/**
 * `pnpm db:create-admin` — перший адміністратор з `.env`:
 * ADMIN_LOGIN, ADMIN_NAME, ADMIN_PASSWORD.
 * Якщо користувач з таким логіном уже є — нічого не змінює.
 * Пароль одразу хешується; сам пароль ніде не зберігається й не виводиться.
 */

import { sql } from "drizzle-orm";
import { auditLog, users } from "../src/db/schema";
import { closeDb, getDb } from "../src/db/client";
import { hashPassword, isValidLogin, normalizeLogin, PASSWORD_MIN_LENGTH } from "../src/users";
import { requireEnv, errorText } from "./env";

requireEnv("DATABASE_URL");
const login = normalizeLogin(requireEnv("ADMIN_LOGIN"));
const name = requireEnv("ADMIN_NAME");

if (!isValidLogin(login)) {
  console.error("✗ ADMIN_LOGIN: лише латиниця, цифри, _ . -, від 3 до 32 символів.");
  process.exit(1);
}

const db = getDb();
try {
  const [existing] = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(sql`lower(${users.login}) = ${login}`)
    .limit(1);

  if (existing) {
    console.log(`Користувач «${login}» уже є (роль: ${existing.role}) — нічого не змінено.`);
    console.log("Якщо в .env ще лишився ADMIN_PASSWORD — видаліть цей рядок.");
  } else {
    const password = process.env.ADMIN_PASSWORD ?? "";
    if (password.length < PASSWORD_MIN_LENGTH) {
      console.error(`✗ ADMIN_PASSWORD у .env: щонайменше ${PASSWORD_MIN_LENGTH} символів.`);
      process.exitCode = 1;
    } else {
      const passwordHash = await hashPassword(password);
      const [created] = await db
        .insert(users)
        .values({ login, name, role: "admin", passwordHash })
        .returning({ id: users.id });
      await db.insert(auditLog).values({
        action: "user_created",
        target: login,
        details: { role: "admin", via: "create-admin" },
      });
      console.log(`✓ Адміністратора «${login}» створено (id ${created.id}).`);
      console.log("");
      console.log("  Тепер ВИДАЛІТЬ рядок ADMIN_PASSWORD з файлу .env — він більше не потрібен.");
      console.log("  Далі паролі задаються лише в CRM, у розділі «Користувачі й ролі».");
    }
  }
} catch (err) {
  console.error(`✗ ${errorText(err)}`);
  process.exitCode = 1;
} finally {
  await closeDb();
}
