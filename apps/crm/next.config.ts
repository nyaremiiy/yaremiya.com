import { existsSync } from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

// Корінь монорепо — щоб Next.js правильно знаходив пакети pnpm.
const monorepoRoot = path.join(__dirname, "../..");

// Один файл .env у корені монорепо (DATABASE_URL тощо) — для `next dev` і `next start`.
// На сервері змінні можна задати й іншим способом (наприклад, у systemd).
const rootEnv = path.join(monorepoRoot, ".env");
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);

const nextConfig: NextConfig = {
  // Збірка під власний сервер (без прив'язки до Vercel).
  output: "standalone",
  outputFileTracingRoot: monorepoRoot,
  turbopack: { root: monorepoRoot },
  // Спільний пакет (схема бази) — у вигляді TypeScript, збирається разом із CRM.
  transpilePackages: ["@yaremiya/shared"],
  poweredByHeader: false,
  // Не писати в консоль аргументи серверних дій — серед них є пароль при вході.
  logging: { serverFunctions: false },
  devIndicators: false,
  // forbidden() — екран «Немає доступу» зі статусом 403.
  experimental: {
    authInterrupts: true,
    // Фото рослин — до 15 МБ (+ запас на службові дані форми).
    proxyClientMaxBodySize: "16mb",
  },
};

export default nextConfig;
