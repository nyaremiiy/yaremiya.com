CREATE TYPE "public"."plant_status" AS ENUM('in_stock', 'low', 'preorder');--> statement-breakpoint
CREATE TABLE "categories" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "categories_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "plant_photos" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "plant_photos_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"plant_id" integer NOT NULL,
	"file_key" text NOT NULL,
	"alt" text,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plant_sizes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "plant_sizes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"plant_id" integer NOT NULL,
	"pot" text NOT NULL,
	"height" text,
	"price" integer,
	"unit" text,
	"stock" integer DEFAULT 0 NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "plant_sizes_stock_nonnegative" CHECK ("plant_sizes"."stock" >= 0),
	CONSTRAINT "plant_sizes_price_nonnegative" CHECK ("plant_sizes"."price" IS NULL OR "plant_sizes"."price" >= 0)
);
--> statement-breakpoint
CREATE TABLE "plants" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "plants_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"latin_name" text,
	"category_id" integer NOT NULL,
	"short_description" text,
	"description" text,
	"care" text,
	"status" "plant_status" DEFAULT 'in_stock' NOT NULL,
	"is_visible" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp with time zone,
	"season_months" integer[] DEFAULT '{}'::integer[] NOT NULL,
	"conditions" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"seo_title" text,
	"seo_description" text,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" integer,
	CONSTRAINT "plants_slug_unique" UNIQUE("slug"),
	CONSTRAINT "plants_slug_format" CHECK ("plants"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);
--> statement-breakpoint
ALTER TABLE "plant_photos" ADD CONSTRAINT "plant_photos_plant_id_plants_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."plants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plant_sizes" ADD CONSTRAINT "plant_sizes_plant_id_plants_id_fk" FOREIGN KEY ("plant_id") REFERENCES "public"."plants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plants" ADD CONSTRAINT "plants_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plants" ADD CONSTRAINT "plants_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "plant_photos_plant_idx" ON "plant_photos" USING btree ("plant_id");--> statement-breakpoint
CREATE INDEX "plant_sizes_plant_idx" ON "plant_sizes" USING btree ("plant_id");--> statement-breakpoint
CREATE INDEX "plants_category_idx" ON "plants" USING btree ("category_id");--> statement-breakpoint
-- Початкові категорії (довідник, однаковий на всіх серверах).
INSERT INTO "categories" ("slug", "name", "sort") VALUES
	('dekoratyvni-kushchi', 'Декоративні кущі', 1),
	('kvity', 'Квіти', 2),
	('sadzhantsi', 'Саджанці', 3),
	('rozsada-kvitiv', 'Розсада квітів', 4),
	('rozsada-ovochiv', 'Розсада овочів', 5)
ON CONFLICT ("slug") DO NOTHING;
