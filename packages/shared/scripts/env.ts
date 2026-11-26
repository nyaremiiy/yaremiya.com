/** Спільне для команд `pnpm db:*`: читає `.env` з кореня монорепо. */

import { existsSync } from "node:fs";
import path from "node:path";

export const repoRoot = path.resolve(import.meta.dirname, "../../..");

const rootEnv = path.join(repoRoot, ".env");
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);

export const isProduction = process.env.APP_ENV === "production";

export function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`✗ Не задано ${name}. Впишіть його у файл .env (зразок — .env.example).`);
    process.exit(1);
  }
  return value;
}

/** Текст помилки разом із причиною (Drizzle ховає відповідь PostgreSQL у `cause`). */
export function errorText(err: unknown): string {
  const e = err as Error & { cause?: { message?: string } };
  const cause = e.cause?.message;
  // Перший рядок без параметрів запиту — щоб у вивід не потрапили дані.
  const main = String(e.message ?? e).split("\nparams:")[0];
  return cause ? `${main}\n  Причина: ${cause}` : main;
}
