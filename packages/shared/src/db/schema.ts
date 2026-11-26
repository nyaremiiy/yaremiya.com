/**
 * Структура бази даних ЯРЕМІЇ — ЄДИНЕ місце, де її описано.
 *
 * Змінюємо лише так: правка цього файлу → `pnpm db:generate` → новий файл
 * міграції в `packages/shared/drizzle/` → коміт. Базу вручну не чіпаємо.
 */

import { sql } from "drizzle-orm";
import {
  bigserial,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("user_role", ["admin", "manager", "worker"]);

/** Люди, які працюють у CRM. Реєстрації немає — додає лише адміністратор. */
export const users = pgTable(
  "users",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    /** Завжди малими літерами; латиниця, цифри, `_` `.` `-`, 3–32 символи. */
    login: text("login").notNull(),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    role: roleEnum("role").notNull(),
    /** Лише хеш (argon2id). Сам пароль ніде не зберігається. */
    passwordHash: text("password_hash").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    /** Хто додав; порожнє — створено командою на сервері. */
    createdBy: integer("created_by").references((): AnyPgColumn => users.id, {
      onDelete: "set null",
    }),
  },
  (t) => [
    uniqueIndex("users_login_lower_idx").on(sql`lower(${t.login})`),
    check("users_login_format", sql`${t.login} ~ '^[a-z0-9_.-]{3,32}$'`),
  ],
);

/** Відкриті входи. `id` — хеш (SHA-256) випадкового токена з cookie, не сам токен. */
export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    userAgent: text("user_agent"),
    ip: text("ip"),
  },
  (t) => [index("sessions_user_id_idx").on(t.userId), index("sessions_expires_at_idx").on(t.expiresAt)],
);

/**
 * Журнал дій: входи, невдалі спроби, виходи, зміни користувачів.
 * Паролів і токенів тут ніколи немає. Невдалі спроби входу звідси ж
 * рахує захист від підбору пароля (працює й після перезапуску).
 */
export const auditLog = pgTable(
  "audit_log",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
    /** Порожнє — для невдалого входу або дії з командного рядка. */
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    /** login, login_failed, logout, user_created, role_changed, password_set, user_disabled, user_enabled… */
    action: text("action").notNull(),
    /** Що саме змінили; для входу — логін (малими літерами). */
    target: text("target"),
    details: jsonb("details").$type<Record<string, unknown>>(),
    ip: text("ip"),
  },
  (t) => [
    index("audit_log_at_idx").on(t.at),
    index("audit_log_action_at_idx").on(t.action, t.at),
    index("audit_log_user_id_idx").on(t.userId),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type AuditEntry = typeof auditLog.$inferInsert;
export type Role = (typeof roleEnum.enumValues)[number];
