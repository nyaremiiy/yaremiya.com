import path from "node:path";
import type { NextConfig } from "next";

// Корінь монорепо — щоб Next.js правильно знаходив пакети pnpm.
const monorepoRoot = path.join(__dirname, "../..");

const nextConfig: NextConfig = {
  // Збірка під власний сервер (без прив'язки до Vercel).
  output: "standalone",
  outputFileTracingRoot: monorepoRoot,
  turbopack: { root: monorepoRoot },
  poweredByHeader: false,
  devIndicators: false,
};

export default nextConfig;
