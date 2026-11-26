/** Спільне для `db:import-plants` і `db:seed`: створити рослину з розмірами й фото. */

import { readFile } from "node:fs/promises";
import { eq } from "drizzle-orm";
import { getDb } from "../src/db/client";
import { auditLog, categories, plantPhotos, plantSizes, plants, type PlantStatus } from "../src/db/schema";
import { savePlantPhoto } from "../src/media";

export type PlantInput = {
  slug: string;
  name: string;
  latinName?: string;
  categorySlug: string;
  shortDescription?: string;
  description?: string;
  care?: string;
  status: PlantStatus;
  isVisible: boolean;
  archived?: boolean;
  seasonMonths?: number[];
  conditions?: { sun?: boolean; partShade?: boolean; hardy?: boolean };
  sizes: { pot: string; height?: string; price: number | null; unit?: string | null; stock: number }[];
  /** Шлях до файлу фото на диску. */
  photoFile?: string;
  sort?: number;
};

/** Створює рослину, якщо такого `slug` ще немає. Повертає true, якщо створено. */
export async function createPlantIfMissing(input: PlantInput, via: string): Promise<boolean> {
  const db = getDb();
  const [existing] = await db.select({ id: plants.id }).from(plants).where(eq(plants.slug, input.slug)).limit(1);
  if (existing) return false;

  const [category] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, input.categorySlug))
    .limit(1);
  if (!category) throw new Error(`Немає категорії ${input.categorySlug} — спершу pnpm db:migrate.`);

  const [plant] = await db
    .insert(plants)
    .values({
      slug: input.slug,
      name: input.name,
      latinName: input.latinName ?? null,
      categoryId: category.id,
      shortDescription: input.shortDescription ?? null,
      description: input.description ?? null,
      care: input.care ?? null,
      status: input.status,
      isVisible: input.archived ? false : input.isVisible,
      archivedAt: input.archived ? new Date() : null,
      seasonMonths: input.seasonMonths ?? [],
      conditions: input.conditions ?? {},
      sort: input.sort ?? 0,
    })
    .returning({ id: plants.id });

  await db.insert(plantSizes).values(
    input.sizes.map((s, i) => ({
      plantId: plant.id,
      pot: s.pot,
      height: s.height ?? null,
      price: s.price,
      unit: s.unit ?? null,
      stock: s.stock,
      sort: i,
    })),
  );

  if (input.photoFile) {
    const saved = await savePlantPhoto(plant.id, await readFile(input.photoFile));
    await db.insert(plantPhotos).values({
      plantId: plant.id,
      fileKey: saved.fileKey,
      alt: input.name,
      width: saved.width,
      height: saved.height,
      sort: 0,
    });
  }

  await db.insert(auditLog).values({ action: "plant_created", target: input.name, details: { plantId: plant.id, via } });
  return true;
}
