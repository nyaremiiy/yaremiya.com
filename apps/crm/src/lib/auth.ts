"use server";

/**
 * Вхід і вихід — серверні дії (Server Actions): форма викликає їх у браузері,
 * а виконуються вони на сервері.
 *
 * Захист від підбору пароля: після 5 невдалих спроб для логіна або для IP
 * за останні 15 хвилин — пауза 15 хвилин. Невдалі спроби рахуємо в журналі
 * дій (`audit_log`), тож обмеження діє й після перезапуску сервера.
 * Відповідь завжди однакова («Невірний логін або пароль») і однаково
 * швидка — і для неіснуючого логіна, і під час паузи.
 */

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { and, eq, gt, or, sql } from "drizzle-orm";
import { auditLog, getDb, users } from "@yaremiya/shared/db";
import { hashPassword, isValidLogin, normalizeLogin, verifyPassword } from "@yaremiya/shared/users";
import { clientInfo, createSession, destroySession } from "./session";

export type SignInResult =
  | { ok: true }
  | { ok: false; error: "invalid-credentials" | "unavailable" };

const MAX_FAILURES = 5;
const LOCK_MS = 15 * 60 * 1000;
/** Довші паролі не перевіряємо (захист від навмисно важких запитів). */
const MAX_PASSWORD_LENGTH = 256;

// Хеш-«пустушка»: перевіряємо пароль і для неіснуючого логіна,
// щоб за часом відповіді не можна було вгадати, чи є такий користувач.
let dummyHash: Promise<string> | undefined;
function getDummyHash(): Promise<string> {
  dummyHash ??= hashPassword(randomBytes(16).toString("hex"));
  return dummyHash;
}

const INVALID: SignInResult = { ok: false, error: "invalid-credentials" };

export async function signIn(
  loginInput: string,
  password: string,
  remember: boolean,
): Promise<SignInResult> {
  const login = normalizeLogin(String(loginInput ?? ""));
  password = String(password ?? "");
  const { ip } = await clientInfo();

  try {
    const db = getDb();
    const logFailure = (reason: string, userId: number | null = null) =>
      db.insert(auditLog).values({
        action: "login_failed",
        userId,
        target: login.slice(0, 64),
        details: { reason },
        ip,
      });

    if (!isValidLogin(login) || !password || password.length > MAX_PASSWORD_LENGTH) {
      await verifyPassword(await getDummyHash(), "x");
      await logFailure("invalid_input");
      return INVALID;
    }

    // Скільки невдалих спроб було за 15 хв — для цього логіна й для цього IP.
    const since = new Date(Date.now() - LOCK_MS);
    const [counts] = await db
      .select({
        byLogin: sql<number>`count(*) filter (where ${auditLog.target} = ${login})`.mapWith(Number),
        byIp: ip
          ? sql<number>`count(*) filter (where ${auditLog.ip} = ${ip})`.mapWith(Number)
          : sql<number>`0`.mapWith(Number),
      })
      .from(auditLog)
      .where(
        and(
          eq(auditLog.action, "login_failed"),
          gt(auditLog.at, since),
          ip ? or(eq(auditLog.target, login), eq(auditLog.ip, ip)) : eq(auditLog.target, login),
        ),
      );

    if (counts.byLogin >= MAX_FAILURES || counts.byIp >= MAX_FAILURES) {
      await verifyPassword(await getDummyHash(), password);
      // Окрема дія, щоб спроби під час паузи не подовжували її безкінечно.
      await db.insert(auditLog).values({ action: "login_blocked", target: login, ip });
      return INVALID;
    }

    const [user] = await db
      .select({ id: users.id, passwordHash: users.passwordHash, isActive: users.isActive })
      .from(users)
      .where(sql`lower(${users.login}) = ${login}`)
      .limit(1);

    if (!user) {
      await verifyPassword(await getDummyHash(), password);
      await logFailure("unknown_login");
      return INVALID;
    }

    if (!(await verifyPassword(user.passwordHash, password))) {
      await logFailure("wrong_password");
      return INVALID;
    }

    if (!user.isActive) {
      await logFailure("disabled");
      return INVALID;
    }

    await createSession(user.id, remember);
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
    await db.insert(auditLog).values({
      action: "login",
      userId: user.id,
      target: login,
      details: { remember },
      ip,
    });
    return { ok: true };
  } catch (err) {
    console.error("Помилка входу:", (err as Error).message);
    return { ok: false, error: "unavailable" };
  }
}

/** «Вийти»: видаляє сесію в базі й cookie, записує в журнал. */
export async function signOut(): Promise<void> {
  try {
    const userId = await destroySession();
    if (userId) {
      const { ip } = await clientInfo();
      await getDb().insert(auditLog).values({ action: "logout", userId, ip });
    }
  } catch (err) {
    console.error("Помилка виходу:", (err as Error).message);
  }
  redirect("/login");
}
