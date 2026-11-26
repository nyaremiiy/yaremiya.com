"use server";

/**
 * Дії з рослинами. Права перевіряються тут, на сервері:
 * залишки — усі, хто бачить «Рослини»; решта — лише Адмін і Менеджер.
 * Кожна зміна ціни, залишку, видимості й архівування — у журнал дій («було → стало»).
 */

import { revalidatePath } from "next/cache";
import { and, eq, inArray, isNull, ne, sql } from "drizzle-orm";
import {
  auditLog,
  categories,
  getDb,
  plantPhotos,
  plantSizes,
  plants,
  type PlantConditions,
  type PlantStatus,
} from "@yaremiya/shared/db";
import { deletePlantPhotoFiles } from "@yaremiya/shared/media";
import { SLUG_PATTERN, slugify } from "@yaremiya/shared/slug";
import { can } from "./permissions";
import { authorizeAction, clientInfo } from "./session";
import { requestSiteRebuild } from "./site-rebuild";

type Db = ReturnType<typeof getDb>;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

async function authorizeManage() {
  const user = await authorizeAction("plants");
  if (!can(user.role, "managePlants")) throw new Error("Немає доступу.");
  return user;
}

function refresh() {
  revalidatePath("/plants");
  revalidatePath("/dashboard");
}

async function audit(
  db: Db | Tx,
  userId: number,
  action: string,
  target: string,
  details: Record<string, unknown>,
) {
  const { ip } = await clientInfo();
  await db.insert(auditLog).values({ userId, action, target, details, ip });
}

/* ───── Список ───── */

export async function setPlantVisible(id: number, visible: boolean): Promise<{ ok: true }> {
  const user = await authorizeManage();
  const db = getDb();
  const [p] = await db
    .select({ name: plants.name, isVisible: plants.isVisible, archivedAt: plants.archivedAt })
    .from(plants)
    .where(eq(plants.id, id))
    .limit(1);
  if (!p) throw new Error("Рослину не знайдено.");
  if (p.archivedAt) throw new Error("Рослина в архіві.");
  if (p.isVisible !== visible) {
    await db.update(plants).set({ isVisible: visible, updatedAt: new Date(), updatedBy: user.id }).where(eq(plants.id, id));
    await audit(db, user.id, "visibility_changed", p.name, { plantId: id, from: p.isVisible, to: visible });
    requestSiteRebuild(`видимість: ${p.name}`);
  }
  refresh();
  return { ok: true };
}

export async function archivePlant(id: number): Promise<{ ok: true }> {
  const user = await authorizeManage();
  const db = getDb();
  const [p] = await db
    .update(plants)
    .set({ archivedAt: new Date(), isVisible: false, updatedAt: new Date(), updatedBy: user.id })
    .where(and(eq(plants.id, id), isNull(plants.archivedAt)))
    .returning({ name: plants.name });
  if (p) {
    await audit(db, user.id, "plant_archived", p.name, { plantId: id });
    requestSiteRebuild(`в архів: ${p.name}`);
  }
  refresh();
  return { ok: true };
}

/** Повернута з архіву рослина прихована з сайту, поки її не ввімкнуть. */
export async function restorePlant(id: number): Promise<{ ok: true }> {
  const user = await authorizeManage();
  const db = getDb();
  const [p] = await db
    .update(plants)
    .set({ archivedAt: null, isVisible: false, updatedAt: new Date(), updatedBy: user.id })
    .where(eq(plants.id, id))
    .returning({ name: plants.name });
  if (p) await audit(db, user.id, "plant_restored", p.name, { plantId: id });
  refresh();
  return { ok: true };
}

/* ───── Залишки (Працівник теж) ───── */

export async function updateStocks(changes: { sizeId: number; stock: number }[]): Promise<{ ok: true }> {
  const user = await authorizeAction("plants");
  const clean = changes.filter((c) => Number.isInteger(c.sizeId));
  for (const c of clean) {
    if (!Number.isInteger(c.stock) || c.stock < 0 || c.stock > 1_000_000) throw new Error("Залишок — ціле число від 0.");
  }
  if (!clean.length) return { ok: true };

  const db = getDb();
  await db.transaction(async (tx) => {
    const rows = await tx
      .select({ id: plantSizes.id, pot: plantSizes.pot, stock: plantSizes.stock, name: plants.name, plantId: plants.id })
      .from(plantSizes)
      .innerJoin(plants, eq(plants.id, plantSizes.plantId))
      .where(and(inArray(plantSizes.id, clean.map((c) => c.sizeId)), isNull(plants.archivedAt)));
    for (const c of clean) {
      const row = rows.find((r) => r.id === c.sizeId);
      if (!row || row.stock === c.stock) continue;
      await tx.update(plantSizes).set({ stock: c.stock }).where(eq(plantSizes.id, c.sizeId));
      await audit(tx, user.id, "stock_changed", `${row.name}, ${row.pot}`, {
        plantId: row.plantId,
        sizeId: row.id,
        from: row.stock,
        to: c.stock,
      });
    }
  });
  refresh();
  return { ok: true };
}

/* ───── Редагування й додавання ───── */

export type PlantFormInput = {
  id: number | null;
  name: string;
  latinName: string;
  categoryId: number | null;
  shortDescription: string;
  description: string;
  care: string;
  status: PlantStatus;
  isVisible: boolean;
  seasonMonths: number[];
  conditions: PlantConditions;
  seoTitle: string;
  seoDescription: string;
  sizes: { id: number | null; pot: string; height: string; price: string; stock: string }[];
  photos: { id: number; alt: string }[];
};

export type SavePlantResult =
  | { ok: true; id: number; created: boolean }
  | { ok: false; errors: Record<string, string> };

const STATUSES: PlantStatus[] = ["in_stock", "low", "preorder"];
const trimOrNull = (v: string) => (v.trim() ? v.trim() : null);

function validate(input: PlantFormInput) {
  const errors: Record<string, string> = {};
  if (!input.name.trim()) errors.name = "Введіть назву рослини";
  else if (input.name.trim().length > 120) errors.name = "Назва задовга (до 120 символів)";
  if (!input.categoryId) errors.categoryId = "Оберіть категорію";
  if (!STATUSES.includes(input.status)) errors.status = "Оберіть статус";
  if (!input.sizes.length) errors.sizes = "Додайте хоча б один розмір";

  const sizes = input.sizes.map((s, i) => {
    const pot = s.pot.trim();
    if (!pot) errors[`sizes.${i}.pot`] = "Вкажіть горщик";
    const priceText = s.price.trim().replace(/\s/g, "");
    let price: number | null = null;
    if (priceText) {
      price = Number(priceText);
      if (!Number.isInteger(price) || price < 0) errors[`sizes.${i}.price`] = "Ціна — ціле число від 0 або порожньо";
    }
    const stockText = s.stock.trim() || "0";
    const stock = Number(stockText);
    if (!Number.isInteger(stock) || stock < 0) errors[`sizes.${i}.stock`] = "Залишок — ціле число від 0";
    return { id: s.id, pot, height: trimOrNull(s.height), price, stock };
  });

  const months = [...new Set(input.seasonMonths)].filter((m) => Number.isInteger(m) && m >= 0 && m <= 11).sort((a, b) => a - b);
  const conditions: PlantConditions = {
    sun: Boolean(input.conditions.sun),
    partShade: Boolean(input.conditions.partShade),
    hardy: Boolean(input.conditions.hardy),
  };
  return { errors, sizes, months, conditions };
}

async function uniqueSlug(db: Db | Tx, base: string, exceptId: number | null): Promise<string> {
  const root = SLUG_PATTERN.test(base) ? base : "roslyna";
  for (let n = 1; n < 100; n++) {
    const candidate = n === 1 ? root : `${root}-${n}`;
    const [taken] = await db
      .select({ id: plants.id })
      .from(plants)
      .where(exceptId ? and(eq(plants.slug, candidate), ne(plants.id, exceptId)) : eq(plants.slug, candidate))
      .limit(1);
    if (!taken) return candidate;
  }
  return `${root}-${Date.now()}`;
}

export async function savePlant(input: PlantFormInput): Promise<SavePlantResult> {
  const user = await authorizeManage();
  const { errors, sizes, months, conditions } = validate(input);
  if (Object.keys(errors).length) return { ok: false, errors };

  const db = getDb();
  const [category] = await db.select({ id: categories.id }).from(categories).where(eq(categories.id, input.categoryId!)).limit(1);
  if (!category) return { ok: false, errors: { categoryId: "Оберіть категорію" } };

  const name = input.name.trim();
  const shortDescription = trimOrNull(input.shortDescription);
  const values = {
    name,
    latinName: trimOrNull(input.latinName),
    categoryId: category.id,
    shortDescription,
    description: trimOrNull(input.description),
    care: trimOrNull(input.care),
    status: input.status,
    seasonMonths: months,
    conditions,
    // SEO: якщо порожньо — з назви й короткого опису.
    seoTitle: trimOrNull(input.seoTitle) ?? `${name} — купити | ЯРЕМІЯ`,
    seoDescription:
      trimOrNull(input.seoDescription) ??
      `${name}${shortDescription ? `: ${shortDescription.replace(/\.$/, "")}` : ""}. Від сімейного господарства на Львівщині.`,
    updatedAt: new Date(),
    updatedBy: user.id,
  };

  const result = await db.transaction(async (tx) => {
    let id = input.id;
    let created = false;
    let siteRelevant = true;

    if (id === null) {
      const slug = await uniqueSlug(tx, slugify(name), null);
      const [row] = await tx
        .insert(plants)
        .values({ ...values, slug, isVisible: input.isVisible })
        .returning({ id: plants.id });
      id = row.id;
      created = true;
      await audit(tx, user.id, "plant_created", name, { plantId: id, visible: input.isVisible });
    } else {
      const [before] = await tx.select().from(plants).where(eq(plants.id, id)).limit(1);
      if (!before) throw new Error("Рослину не знайдено.");
      const archived = before.archivedAt !== null;
      const visible = archived ? false : input.isVisible;
      await tx.update(plants).set({ ...values, isVisible: visible }).where(eq(plants.id, id));

      const changed = (
        [
          ["name", before.name, values.name],
          ["latinName", before.latinName, values.latinName],
          ["categoryId", before.categoryId, values.categoryId],
          ["shortDescription", before.shortDescription, values.shortDescription],
          ["description", before.description, values.description],
          ["care", before.care, values.care],
          ["status", before.status, values.status],
          ["seasonMonths", before.seasonMonths.join(","), months.join(",")],
          [
            "conditions",
            JSON.stringify({ sun: Boolean(before.conditions.sun), partShade: Boolean(before.conditions.partShade), hardy: Boolean(before.conditions.hardy) }),
            JSON.stringify(conditions),
          ],
          ["seoTitle", before.seoTitle, values.seoTitle],
          ["seoDescription", before.seoDescription, values.seoDescription],
        ] as const
      ).filter(([, a, b]) => a !== b);
      if (changed.length) {
        await audit(tx, user.id, "plant_updated", name, {
          plantId: id,
          fields: changed.map(([field]) => field),
          ...(changed.some(([f]) => f === "status") ? { status: { from: before.status, to: values.status } } : {}),
        });
      }
      if (before.isVisible !== visible) {
        await audit(tx, user.id, "visibility_changed", name, { plantId: id, from: before.isVisible, to: visible });
      }
      siteRelevant = before.isVisible || visible;
    }

    // Розміри: видалені — прибрати, наявні — оновити, нові — додати.
    const existing = await tx.select().from(plantSizes).where(eq(plantSizes.plantId, id));
    const keepIds = new Set(sizes.map((s) => s.id).filter((v): v is number => v !== null));
    for (const old of existing) {
      if (!keepIds.has(old.id)) {
        await tx.delete(plantSizes).where(eq(plantSizes.id, old.id));
        if (!created) await audit(tx, user.id, "size_removed", `${name}, ${old.pot}`, { plantId: id, pot: old.pot });
      }
    }
    for (const [sort, s] of sizes.entries()) {
      const old = s.id !== null ? existing.find((e) => e.id === s.id) : undefined;
      if (old) {
        await tx
          .update(plantSizes)
          .set({ pot: s.pot, height: s.height, price: s.price, stock: s.stock, sort })
          .where(eq(plantSizes.id, old.id));
        if (old.price !== s.price) {
          await audit(tx, user.id, "price_changed", `${name}, ${s.pot}`, { plantId: id, sizeId: old.id, from: old.price, to: s.price });
        }
        if (old.stock !== s.stock) {
          await audit(tx, user.id, "stock_changed", `${name}, ${s.pot}`, { plantId: id, sizeId: old.id, from: old.stock, to: s.stock });
        }
      } else {
        const [row] = await tx
          .insert(plantSizes)
          .values({ plantId: id, pot: s.pot, height: s.height, price: s.price, stock: s.stock, sort })
          .returning({ id: plantSizes.id });
        if (!created) {
          await audit(tx, user.id, "size_added", `${name}, ${s.pot}`, { plantId: id, sizeId: row.id, price: s.price, stock: s.stock });
        }
      }
    }

    // Фото: порядок (перше — головне) і опис. Лише фото цієї рослини.
    const ownPhotos = await tx.select({ id: plantPhotos.id }).from(plantPhotos).where(eq(plantPhotos.plantId, id));
    const ownIds = new Set(ownPhotos.map((p) => p.id));
    for (const [sort, ph] of input.photos.filter((p) => ownIds.has(p.id)).entries()) {
      await tx
        .update(plantPhotos)
        .set({ sort, alt: ph.alt.trim().slice(0, 300) || null })
        .where(eq(plantPhotos.id, ph.id));
    }

    return { id, created, siteRelevant: siteRelevant || (created && input.isVisible) };
  });

  if (result.siteRelevant) requestSiteRebuild(`збережено: ${name}`);
  refresh();
  revalidatePath(`/plants/${result.id}/edit`);
  return { ok: true, id: result.id, created: result.created };
}

export async function deletePlantPhoto(photoId: number): Promise<{ ok: true }> {
  const user = await authorizeManage();
  const db = getDb();
  const [photo] = await db
    .select({ id: plantPhotos.id, fileKey: plantPhotos.fileKey, plantId: plantPhotos.plantId, name: plants.name, visible: plants.isVisible })
    .from(plantPhotos)
    .innerJoin(plants, eq(plants.id, plantPhotos.plantId))
    .where(eq(plantPhotos.id, photoId))
    .limit(1);
  if (!photo) return { ok: true };
  await db.delete(plantPhotos).where(eq(plantPhotos.id, photoId));
  await deletePlantPhotoFiles(photo.fileKey);
  // Перенумерувати, щоб головним стало наступне фото.
  await db.execute(sql`
    UPDATE plant_photos p SET sort = r.n - 1
    FROM (SELECT id, row_number() OVER (ORDER BY sort, id) AS n FROM plant_photos WHERE plant_id = ${photo.plantId}) r
    WHERE p.id = r.id`);
  await audit(db, user.id, "photo_deleted", photo.name, { plantId: photo.plantId });
  if (photo.visible) requestSiteRebuild(`фото: ${photo.name}`);
  refresh();
  return { ok: true };
}
