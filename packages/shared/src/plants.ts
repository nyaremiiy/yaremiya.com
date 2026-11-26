/**
 * Рослини: спільні правила й читання для CRM і сайту.
 */

import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { getDb } from "./db/client";
import { categories, plantPhotos, plantSizes, plants, type PlantStatus } from "./db/schema";
import { mediaUrl } from "./media";

export * from "./plant-format";
import { minPrice } from "./plant-format";

/* ───── Для сайту ───── */

export type SitePlant = {
  slug: string;
  name: string;
  categorySlug: string;
  categoryName: string;
  shortDescription: string;
  status: PlantStatus;
  priceFrom: number | null;
  /** «шт», якщо в розміру з найменшою ціною задано одиницю. */
  unit: string | null;
  seasonMonths: number[];
  photo: { src400: string; src800: string; src1600: string; width: number; height: number; alt: string } | null;
};

export type SiteCategory = { slug: string; name: string };

/**
 * Каталог для сайту: лише показані (`is_visible`) і не в архіві.
 * Читається під час збирання сайту.
 */
export async function getSiteCatalog(): Promise<{ categories: SiteCategory[]; plants: SitePlant[] }> {
  const db = getDb();
  const rows = await db
    .select({
      id: plants.id,
      slug: plants.slug,
      name: plants.name,
      shortDescription: plants.shortDescription,
      status: plants.status,
      seasonMonths: plants.seasonMonths,
      categorySlug: categories.slug,
      categoryName: categories.name,
      categorySort: categories.sort,
    })
    .from(plants)
    .innerJoin(categories, eq(categories.id, plants.categoryId))
    .where(and(eq(plants.isVisible, true), isNull(plants.archivedAt)))
    .orderBy(asc(plants.sort), asc(plants.id));

  const ids = rows.map((r) => r.id);
  const [sizes, photos, cats] = await Promise.all([
    ids.length
      ? db.select().from(plantSizes).where(inArray(plantSizes.plantId, ids)).orderBy(asc(plantSizes.sort), asc(plantSizes.id))
      : [],
    ids.length
      ? db.select().from(plantPhotos).where(inArray(plantPhotos.plantId, ids)).orderBy(asc(plantPhotos.sort), asc(plantPhotos.id))
      : [],
    db.select({ slug: categories.slug, name: categories.name }).from(categories).orderBy(asc(categories.sort)),
  ]);

  const result: SitePlant[] = rows.map((r) => {
    const own = sizes.filter((s) => s.plantId === r.id);
    const priceFrom = minPrice(own);
    const cheapest = own.find((s) => s.price === priceFrom);
    const photo = photos.find((p) => p.plantId === r.id);
    return {
      slug: r.slug,
      name: r.name,
      categorySlug: r.categorySlug,
      categoryName: r.categoryName,
      shortDescription: r.shortDescription ?? "",
      status: r.status,
      priceFrom,
      unit: cheapest?.unit === "шт" ? "шт" : null,
      seasonMonths: [...r.seasonMonths].sort((a, b) => a - b),
      photo: photo
        ? {
            src400: mediaUrl(photo.fileKey, 400),
            src800: mediaUrl(photo.fileKey, 800),
            src1600: mediaUrl(photo.fileKey, 1600),
            width: photo.width,
            height: photo.height,
            alt: photo.alt || r.name,
          }
        : null,
    };
  });

  // На сайті — лише категорії, у яких є рослини.
  const used = new Set(result.map((p) => p.categorySlug));
  return { categories: cats.filter((c) => used.has(c.slug)), plants: result };
}
