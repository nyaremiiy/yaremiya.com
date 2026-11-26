import { existsSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "drizzle-kit";

// Один .env у корені монорепо.
const rootEnv = path.resolve(process.cwd(), "../../.env") // команди запускаються з packages/shared;
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
  strict: true,
  verbose: true,
});
