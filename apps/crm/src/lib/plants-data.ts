/**
 * Рослини для CRM — читання з бази (лише на сервері).
 * Працівнику ціни не віддаються взагалі (не лише ховаються в інтерфейсі).
 */

import { and, asc, eq, inArray, isNotNull, isNull, ne } from "drizzle-orm";
import {
  categories,
  getDb,
  plantPhotos,
  plantSizes,
  plants,
  type PlantConditions,
  type PlantStatus,
} from "@yaremiya/shared/db";
import { mediaUrl } from "@yaremiya/shared/media";
import { LOW_STOCK_THRESHOLD, totalStock } from "@yaremiya/shared/plants";
import { demoDelay } from "./demo-delay";

export type CategoryOption = { id: number; name: string };

export async function getCategories(): Promise<CategoryOption[]> {
  return getDb().select({ id: categories.id, name: categories.name }).from(categories).orderBy(asc(categories.sort));
}

export type CrmSize = { id: number; pot: string; height: string | null; price: number | null; unit: string | null; stock: number };

export type CrmPlantRow = {
  id: number;
  slug: string;
  name: string;
  categoryId: number;
  categoryName: string;
  status: PlantStatus;
  isVisible: boolean;
  archived: boolean;
  photo: string | null;
  sizes: CrmSize[];
  totalStock: number;
  /** «В наявності», а залишку ≤ 5 — підсвітити жовтим. */
  lowStockWarning: boolean;
};

async function loadSizesAndPhotos(ids: number[]) {
  const db = getDb();
  if (!ids.length) return { sizes: [], photos: [] };
  const [sizes, photos] = await Promise.all([
    db.select().from(plantSizes).where(inArray(plantSizes.plantId, ids)).orderBy(asc(plantSizes.sort), asc(plantSizes.id)),
    db.select().from(plantPhotos).where(inArray(plantPhotos.plantId, ids)).orderBy(asc(plantPhotos.sort), asc(plantPhotos.id)),
  ]);
  return { sizes, photos };
}

/** Усі рослини (активні й архів) для Менеджера й Адміністратора. */
export async function getPlantsForManager(): Promise<CrmPlantRow[]> {
  await demoDelay(1);
  const rows = await getDb()
    .select({
      id: plants.id,
      slug: plants.slug,
      name: plants.name,
      categoryId: plants.categoryId,
      categoryName: categories.name,
      status: plants.status,
      isVisible: plants.isVisible,
      archivedAt: plants.archivedAt,
    })
    .from(plants)
    .innerJoin(categories, eq(categories.id, plants.categoryId))
    .orderBy(asc(plants.sort), asc(plants.id));

  const { sizes, photos } = await loadSizesAndPhotos(rows.map((r) => r.id));
  return rows.map((r) => {
    const own = sizes
      .filter((s) => s.plantId === r.id)
      .map(({ id, pot, height, price, unit, stock }) => ({ id, pot, height, price, unit, stock }));
    const photo = photos.find((p) => p.plantId === r.id);
    const total = totalStock(own);
    return {
      id: r.id,
      slug: r.slug,
      name: r.name,
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      status: r.status,
      isVisible: r.isVisible,
      archived: r.archivedAt !== null,
      photo: photo ? mediaUrl(photo.fileKey, 400) : null,
      sizes: own,
      totalStock: total,
      lowStockWarning: r.status === "in_stock" && total <= LOW_STOCK_THRESHOLD,
    };
  });
}

export type WorkerSize = { id: number; pot: string; stock: number };
export type WorkerPlantRow = { id: number; name: string; categoryName: string; photo: string | null; sizes: WorkerSize[] };

/** Для Працівника: лише активні, без передзамовлень, без цін. */
export async function getPlantsForWorker(): Promise<WorkerPlantRow[]> {
  await demoDelay(1);
  const rows = await getDb()
    .select({ id: plants.id, name: plants.name, categoryName: categories.name })
    .from(plants)
    .innerJoin(categories, eq(categories.id, plants.categoryId))
    .where(and(isNull(plants.archivedAt), ne(plants.status, "preorder")))
    .orderBy(asc(plants.sort), asc(plants.id));
  const { sizes, photos } = await loadSizesAndPhotos(rows.map((r) => r.id));
  return rows.map((r) => {
    const photo = photos.find((p) => p.plantId === r.id);
    return {
      id: r.id,
      name: r.name,
      categoryName: r.categoryName,
      photo: photo ? mediaUrl(photo.fileKey, 400) : null,
      sizes: sizes.filter((s) => s.plantId === r.id).map(({ id, pot, stock }) => ({ id, pot, stock })),
    };
  });
}

export type EditPhoto = { id: number; url: string; alt: string; small: boolean };

export type PlantEditData = {
  id: number | null;
  slug: string;
  name: string;
  latinName: string;
  categoryId: number | null;
  shortDescription: string;
  description: string;
  care: string;
  status: PlantStatus;
  isVisible: boolean;
  archived: boolean;
  seasonMonths: number[];
  conditions: PlantConditions;
  seoTitle: string;
  seoDescription: string;
  sizes: { id: number | null; pot: string; height: string; price: string; stock: string }[];
  photos: EditPhoto[];
};

export function emptyPlant(): PlantEditData {
  return {
    id: null,
    slug: "",
    name: "",
    latinName: "",
    categoryId: null,
    shortDescription: "",
    description: "",
    care: "",
    status: "in_stock",
    isVisible: false,
    archived: false,
    seasonMonths: [],
    conditions: {},
    seoTitle: "",
    seoDescription: "",
    sizes: [{ id: null, pot: "", height: "", price: "", stock: "0" }],
    photos: [],
  };
}

export async function getPlantForEdit(id: number): Promise<PlantEditData | null> {
  await demoDelay(1);
  const db = getDb();
  const [p] = await db.select().from(plants).where(eq(plants.id, id)).limit(1);
  if (!p) return null;
  const { sizes, photos } = await loadSizesAndPhotos([id]);
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    latinName: p.latinName ?? "",
    categoryId: p.categoryId,
    shortDescription: p.shortDescription ?? "",
    description: p.description ?? "",
    care: p.care ?? "",
    status: p.status,
    isVisible: p.isVisible,
    archived: p.archivedAt !== null,
    seasonMonths: p.seasonMonths,
    conditions: p.conditions,
    seoTitle: p.seoTitle ?? "",
    seoDescription: p.seoDescription ?? "",
    sizes: sizes.map((s) => ({
      id: s.id,
      pot: s.pot,
      height: s.height ?? "",
      price: s.price === null ? "" : String(s.price),
      stock: String(s.stock),
    })),
    photos: photos.map((ph) => ({
      id: ph.id,
      url: mediaUrl(ph.fileKey, 800),
      alt: ph.alt ?? "",
      small: ph.width < 800,
    })),
  };
}

/* ───── Для дашборду ───── */

export type StockSummary = { inStock: number; total: number; preorder: number };

/** «Рослин у наявності: 14 з 20» — серед активних (не в архіві). */
export async function getStockSummary(): Promise<StockSummary> {
  const rows = await getDb()
    .select({ id: plants.id, status: plants.status })
    .from(plants)
    .where(isNull(plants.archivedAt));
  const { sizes } = await loadSizesAndPhotos(rows.map((r) => r.id));
  const stockOf = (id: number) => totalStock(sizes.filter((s) => s.plantId === id));
  return {
    total: rows.length,
    inStock: rows.filter((r) => r.status !== "preorder" && stockOf(r.id) > 0).length,
    preorder: rows.filter((r) => r.status === "preorder").length,
  };
}

export type LowStockSize = { id: string; sizeId: number; name: string; pot: string; qty: number; image: string };

/** «Закінчуються»: розміри активних рослин (не передзамовлення) із залишком ≤ 5. */
export async function getLowStockSizes(limit = 3): Promise<LowStockSize[]> {
  const db = getDb();
  const rows = await db
    .select({
      sizeId: plantSizes.id,
      plantId: plants.id,
      name: plants.name,
      pot: plantSizes.pot,
      qty: plantSizes.stock,
    })
    .from(plantSizes)
    .innerJoin(plants, eq(plants.id, plantSizes.plantId))
    .where(and(isNull(plants.archivedAt), ne(plants.status, "preorder")))
    .orderBy(asc(plantSizes.stock), asc(plants.sort));
  const low = rows.filter((r) => r.qty <= LOW_STOCK_THRESHOLD).slice(0, limit);
  const photos = low.length
    ? await db
        .select()
        .from(plantPhotos)
        .where(and(inArray(plantPhotos.plantId, low.map((r) => r.plantId)), isNotNull(plantPhotos.fileKey)))
        .orderBy(asc(plantPhotos.sort))
    : [];
  return low.map((r) => {
    const photo = photos.find((p) => p.plantId === r.plantId);
    return {
      id: `s-${r.sizeId}`,
      sizeId: r.sizeId,
      name: r.name,
      pot: `Горщик ${r.pot}`.replace("Горщик касета", "Касета"),
      qty: r.qty,
      image: photo ? mediaUrl(photo.fileKey, 400) : "/logo/yaremiia-sprout.svg",
    };
  });
}
