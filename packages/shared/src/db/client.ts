/**
 * Підключення до бази. Адреса — лише зі змінної `DATABASE_URL` (файл `.env`,
 * свій на кожному середовищі). У коді адрес і паролів бази немає.
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Database = ReturnType<typeof createDb>;

function createDb(url: string) {
  const client = postgres(url, {
    max: Number(process.env.DATABASE_POOL_MAX) || 5,
    // Без зайвих повідомлень PostgreSQL у логах.
    onnotice: () => {},
  });
  return drizzle(client, { schema });
}

// Один пул на весь процес (і під час «гарячого» перезапуску в режимі розробки).
const globalForDb = globalThis as unknown as { __yaremiyaDb?: Database };

/** Клієнт бази; створюється при першому зверненні. */
export function getDb(): Database {
  if (!globalForDb.__yaremiyaDb) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "Не задано DATABASE_URL. Впишіть адресу бази у файл .env (зразок — .env.example).",
      );
    }
    globalForDb.__yaremiyaDb = createDb(url);
  }
  return globalForDb.__yaremiyaDb;
}

/** Закрити з'єднання (для команд у терміналі, щоб процес завершився). */
export async function closeDb(): Promise<void> {
  const db = globalForDb.__yaremiyaDb;
  if (db) {
    await db.$client.end({ timeout: 5 });
    globalForDb.__yaremiyaDb = undefined;
  }
}
