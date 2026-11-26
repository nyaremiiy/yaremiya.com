import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { requireEnv } from "./env";

/**
 * Резервна копія бази через `pg_dump` у папку поза репозиторієм
 * (`BACKUP_DIR`, за замовчуванням `~/yaremiya-backups`). Повертає шлях до файлу.
 * Пароль бази передається через змінні середовища, а не в командному рядку,
 * щоб його не було видно в списку процесів.
 */
export async function backupDatabase(label = "backup"): Promise<string> {
  const url = new URL(requireEnv("DATABASE_URL"));
  const dir = process.env.BACKUP_DIR?.trim() || path.join(os.homedir(), "yaremiya-backups");
  mkdirSync(dir, { recursive: true, mode: 0o700 });

  const dbName = decodeURIComponent(url.pathname.replace(/^\//, ""));
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const file = path.join(dir, `${dbName}-${stamp}-${label}.dump`);

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    PGHOST: url.hostname,
    PGPORT: url.port || "5432",
    PGUSER: decodeURIComponent(url.username),
    PGPASSWORD: decodeURIComponent(url.password),
    PGDATABASE: dbName,
  };
  const sslmode = url.searchParams.get("sslmode");
  if (sslmode) env.PGSSLMODE = sslmode;

  const pgDump = process.env.PG_DUMP?.trim() || "pg_dump";
  await new Promise<void>((resolve, reject) => {
    const child = spawn(pgDump, ["--format=custom", "--no-owner", `--file=${file}`], {
      env,
      stdio: ["ignore", "inherit", "inherit"],
    });
    child.on("error", (err) =>
      reject(new Error(`Не вдалося запустити ${pgDump}: ${err.message}. Чи встановлено PostgreSQL client?`)),
    );
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`${pgDump} завершився з помилкою (код ${code}).`)),
    );
  });
  return file;
}
