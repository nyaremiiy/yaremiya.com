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
