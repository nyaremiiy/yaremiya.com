/**
 * `pnpm db:migrate` — застосувати міграції з `packages/shared/drizzle/`.
 * Drizzle сам пам'ятає (таблиця `drizzle.__drizzle_migrations`), які кроки вже виконані.
 * На основному сервері (`APP_ENV=production`) спершу робить резервну копію.
 */

import path from "node:path";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { closeDb, getDb } from "../src/db/client";
import { isProduction, requireEnv, errorText } from "./env";
import { backupDatabase } from "./backup-lib";

requireEnv("DATABASE_URL");

try {
  if (isProduction) {
    console.log("Основний сервер — спершу резервна копія…");
    const file = await backupDatabase("before-migrate");
    console.log(`✓ Резервна копія: ${file}`);
  }
  await migrate(getDb(), { migrationsFolder: path.resolve(import.meta.dirname, "../drizzle") });
  console.log("✓ Міграції застосовано — база в актуальному стані.");
} catch (err) {
  console.error(`✗ Міграції не застосовано: ${errorText(err)}`);
  process.exitCode = 1;
} finally {
  await closeDb();
}
