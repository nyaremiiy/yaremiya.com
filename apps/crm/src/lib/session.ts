/**
 * Сесії й поточний користувач — лише на сервері.
 *
 * У cookie лежить випадковий токен; у базі (`sessions.id`) — лише його
 * SHA-256-хеш, тож навіть копія бази не дає увійти чужою сесією.
 * Вимкнений користувач (`is_active = false`) одразу втрачає всі сесії:
 * перевірка нижче вимагає активного користувача.
 */

import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { forbidden, redirect } from "next/navigation";
import { and, eq, gt, lt, sql } from "drizzle-orm";
import { getDb, sessions, users } from "@yaremiya/shared/db";
import { initialOf, type CurrentUser } from "./current-user";
import { canAccess, type Section } from "./permissions";

import { PATH_HEADER, SESSION_COOKIE } from "./session-constants";

const DAY = 24 * 60 * 60 * 1000;
/** «Запам'ятати мене» — 30 днів. */
export const REMEMBER_MS = 30 * DAY;
/** Без «Запам'ятати» — до закриття браузера, але не довше 12 годин. */
export const SHORT_MS = 12 * 60 * 60 * 1000;
/** Як часто оновлювати «востаннє бачили» (щоб не писати в базу на кожен клік). */
const TOUCH_MS = 5 * 60 * 1000;

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** IP і браузер відвідувача — для журналу дій і захисту від підбору. */
export async function clientInfo(): Promise<{ ip: string | null; userAgent: string | null }> {
  const h = await headers();
  // За Caddy/nginx справжня адреса — перша в X-Forwarded-For.
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || h.get("x-real-ip")?.trim() || null;
  const userAgent = h.get("user-agent")?.slice(0, 200) || null;
  return { ip, userAgent };
}

/** Відкрити сесію й поставити cookie. Викликати лише з серверної дії. */
export async function createSession(userId: number, remember: boolean): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const ttl = remember ? REMEMBER_MS : SHORT_MS;
  const expiresAt = new Date(Date.now() + ttl);
  const { ip, userAgent } = await clientInfo();
  const db = getDb();

  await db.insert(sessions).values({ id: hashToken(token), userId, expiresAt, ip, userAgent });
  // Заодно прибрати прострочені сесії цього користувача.
  await db.delete(sessions).where(and(eq(sessions.userId, userId), lt(sessions.expiresAt, new Date())));

  (await cookies()).set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // Без maxAge cookie зникає при закритті браузера.
    ...(remember ? { maxAge: Math.floor(ttl / 1000) } : {}),
  });
}

/** Закрити поточну сесію (у базі й у браузері). Повертає, чий це був вхід. */
export async function destroySession(): Promise<number | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  store.delete(SESSION_COOKIE);
  if (!token) return null;
  const [row] = await getDb()
    .delete(sessions)
    .where(eq(sessions.id, hashToken(token)))
    .returning({ userId: sessions.userId });
  return row?.userId ?? null;
}

/**
 * Хто зараз працює в CRM, або `null`, якщо не увійшли (сесії немає,
 * вона прострочена чи користувача вимкнено). Один запит до бази на сторінку.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const db = getDb();
  const id = hashToken(token);
  const [row] = await db
    .select({
      userId: users.id,
      login: users.login,
      name: users.name,
      role: users.role,
      lastSeenAt: sessions.lastSeenAt,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, id), gt(sessions.expiresAt, sql`now()`), eq(users.isActive, true)))
    .limit(1);

  if (!row) return null;

  if (Date.now() - row.lastSeenAt.getTime() > TOUCH_MS) {
    await db.update(sessions).set({ lastSeenAt: new Date() }).where(eq(sessions.id, id));
  }

  return {
    id: row.userId,
    login: row.login,
    name: row.name,
    initial: initialOf(row.name),
    role: row.role,
  };
});

/** Для сторінок: користувач або перехід на `/login?next=<ця сторінка>`. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (user) return user;
  const path = (await headers()).get(PATH_HEADER);
  redirect(path && path !== "/" ? `/login?next=${encodeURIComponent(path)}` : "/login");
}

/** Для сторінок розділів: увійшов + має доступ, інакше 403 «Немає доступу». */
export async function requireSection(section: Section): Promise<CurrentUser> {
  const user = await requireUser();
  if (!canAccess(user.role, section)) forbidden();
  return user;
}

/**
 * Для серверних дій (кнопки, форми): перевірка прав на сервері,
 * незалежно від того, що показує меню.
 */
export async function authorizeAction(section: Section): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Сесія завершилась. Увійдіть знову.");
  if (!canAccess(user.role, section)) throw new Error("Немає доступу.");
  return user;
}
