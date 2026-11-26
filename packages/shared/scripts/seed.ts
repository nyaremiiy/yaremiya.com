/**
 * `pnpm db:seed` — демо-користувачі для локальної й тестової бази.
 * На основному сервері (`APP_ENV=production`) відмовляється працювати.
 *
 * Паролі демо-користувачів не зберігаються в репозиторії: команда
 * генерує випадкові й показує їх один раз у терміналі.
 */

import { randomBytes } from "node:crypto";
import { sql } from "drizzle-orm";
import { auditLog, users, type Role } from "../src/db/schema";
import { closeDb, getDb } from "../src/db/client";
import { hashPassword } from "../src/users";
import { isProduction, requireEnv, errorText } from "./env";

if (isProduction) {
  console.error("✗ db:seed заборонено на основному сервері (APP_ENV=production).");
  process.exit(1);
}
requireEnv("DATABASE_URL");

const DEMO: { login: string; name: string; role: Role; isActive: boolean }[] = [
  { login: "demo.manager", name: "Менеджер", role: "manager", isActive: true },
  { login: "demo.oksana", name: "Оксана", role: "worker", isActive: true },
  { login: "demo.ivan", name: "Іван", role: "worker", isActive: false },
];

const db = getDb();
try {
  for (const u of DEMO) {
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(sql`lower(${users.login}) = ${u.login}`)
      .limit(1);
    if (existing) {
      console.log(`· ${u.login} — уже є, пропускаю`);
      continue;
    }
    const password = randomBytes(9).toString("base64url");
    await db.insert(users).values({ ...u, passwordHash: await hashPassword(password) });
    await db.insert(auditLog).values({
      action: "user_created",
      target: u.login,
      details: { role: u.role, via: "seed" },
    });
    console.log(`✓ ${u.login} (${u.name}, ${u.role}${u.isActive ? "" : ", вимкнено"}) — пароль: ${password}`);
  }
  console.log("Демо-дані готові. Паролі показано лише зараз — збережіть, якщо потрібні.");
} catch (err) {
  console.error(`✗ ${errorText(err)}`);
  process.exitCode = 1;
} finally {
  await closeDb();
}
