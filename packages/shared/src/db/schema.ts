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

/* ───── Рослини (товари магазину; спільні для CRM і сайту) ───── */

export const plantStatusEnum = pgEnum("plant_status", ["in_stock", "low", "preorder"]);

export const categories = pgTable("categories", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  sort: integer("sort").notNull().default(0),
});

/** Умови вирощування (позначки в CRM). */
export type PlantConditions = {
  sun?: boolean;
  partShade?: boolean;
  hardy?: boolean;
};

/**
 * Рослини не видаляються — лише архівуються (`archived_at`).
 * На сайті показуються лише `is_visible = true` і без `archived_at`.
 */
export const plants = pgTable(
  "plants",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    /** Для адреси на сайті: з назви транслітом, унікальний. */
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    latinName: text("latin_name"),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id),
    /** Для картки каталогу. */
    shortDescription: text("short_description"),
    description: text("description"),
    care: text("care"),
    status: plantStatusEnum("status").notNull().default("in_stock"),
    isVisible: boolean("is_visible").notNull().default(false),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    /** Місяці продажу, 0 = січень. */
    seasonMonths: integer("season_months").array().notNull().default(sql`'{}'::integer[]`),
    conditions: jsonb("conditions").$type<PlantConditions>().notNull().default({}),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    sort: integer("sort").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: integer("updated_by").references(() => users.id, { onDelete: "set null" }),
  },
  (t) => [
    index("plants_category_idx").on(t.categoryId),
    check("plants_slug_format", sql`${t.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`),
  ],
);

/** Розміри: горщик, висота, ціна, залишок. */
export const plantSizes = pgTable(
  "plant_sizes",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    plantId: integer("plant_id")
      .notNull()
      .references(() => plants.id, { onDelete: "cascade" }),
    /** «0,5 л», «касета». */
    pot: text("pot").notNull(),
    /** «10–15 см». */
    height: text("height"),
    /** Гривні, ціле; порожнє — «ціна навесні». */
    price: integer("price"),
    /** Порожнє або «шт» — для «/шт» на сайті. */
    unit: text("unit"),
    stock: integer("stock").notNull().default(0),
    sort: integer("sort").notNull().default(0),
  },
  (t) => [
    index("plant_sizes_plant_idx").on(t.plantId),
    check("plant_sizes_stock_nonnegative", sql`${t.stock} >= 0`),
    check("plant_sizes_price_nonnegative", sql`${t.price} IS NULL OR ${t.price} >= 0`),
  ],
);

/** Фото: файли лежать у UPLOADS_DIR (поза репозиторієм), тут — лише шлях. */
export const plantPhotos = pgTable(
  "plant_photos",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    plantId: integer("plant_id")
      .notNull()
      .references(() => plants.id, { onDelete: "cascade" }),
    /** Основа шляху без розміру: `plants/12/ab12cd` → файли `…-1600.webp`, `…-800.webp`, `…-400.webp`. */
    fileKey: text("file_key").notNull(),
    alt: text("alt"),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    /** 0 — головне. */
    sort: integer("sort").notNull().default(0),
  },
  (t) => [index("plant_photos_plant_idx").on(t.plantId)],
);

export type Category = typeof categories.$inferSelect;
export type Plant = typeof plants.$inferSelect;
export type PlantSize = typeof plantSizes.$inferSelect;
export type PlantPhoto = typeof plantPhotos.$inferSelect;
export type PlantStatus = (typeof plantStatusEnum.enumValues)[number];
