/**
 * Фото рослин: перевірка, обробка й збереження в UPLOADS_DIR (поза репозиторієм).
 * Спільне для CRM (завантаження) і команди `db:import-plants`.
 *
 * Обробка (sharp): справжнє зображення (jpg, png, webp, heic) до 15 МБ →
 * поворот за EXIF → обрізка до квадрата за центром → WebP 1600 / 800 / 400 px
 * без метаданих (EXIF з геолокацією не зберігається).
 */

import { randomBytes } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp, { type Metadata } from "sharp";

export const PHOTO_SIZES = [1600, 800, 400] as const;
export type PhotoSize = (typeof PHOTO_SIZES)[number];
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
/** Менше — попередження «Фото замале…», але дозволяємо. */
export const MIN_RECOMMENDED_PX = 800;

export class PhotoError extends Error {}

/** Папка завантажень. Без UPLOADS_DIR — `uploads/` у корені репозиторію (лише для розробки; у .gitignore). */
export function uploadsDir(): string {
  const dir = process.env.UPLOADS_DIR?.trim();
  if (dir) return path.resolve(dir);
  return path.resolve(import.meta.dirname, "../../../uploads");
}

/** Публічна адреса фото: `/media/plants/12/ab12cd-800.webp`. */
export function mediaUrl(fileKey: string, size: PhotoSize): string {
  return `/media/${fileKey}-${size}.webp`;
}

/** Шлях на диску за адресою з `/media/...`; `null`, якщо адреса підозріла. */
export function resolveMediaPath(relative: string): string | null {
  if (!/^plants\/\d+\/[a-z0-9]+-(1600|800|400)\.webp$/.test(relative)) return null;
  const root = uploadsDir();
  const full = path.resolve(root, relative);
  return full.startsWith(root + path.sep) ? full : null;
}

const ALLOWED = new Set(["jpeg", "png", "webp", "heif"]);

function looksLikeHeic(buf: Buffer): boolean {
  // ISO BMFF: "ftyp" на 4-му байті, бренд heic/heix/mif1/…
  if (buf.length < 12 || buf.toString("ascii", 4, 8) !== "ftyp") return false;
  return /^(heic|heix|hevc|hevx|mif1|msf1)$/.test(buf.toString("ascii", 8, 12));
}

/** HEIC з iPhone: sharp його не розпаковує, тож спершу перетворюємо в JPEG. */
async function decodeHeic(buf: Buffer): Promise<Buffer> {
  const { default: convert } = await import("heic-convert");
  const out = await convert({ buffer: new Uint8Array(buf), format: "JPEG", quality: 0.95 });
  return Buffer.from(out);
}

export type SavedPhoto = { fileKey: string; width: number; height: number; tooSmall: boolean };

/**
 * Перевірити й зберегти фото для рослини. Тип визначається за вмістом файлу,
 * а не за назвою. Кидає PhotoError з поясненням для людини.
 */
export async function savePlantPhoto(plantId: number, input: Buffer): Promise<SavedPhoto> {
  if (input.length === 0) throw new PhotoError("Файл порожній.");
  if (input.length > MAX_UPLOAD_BYTES) throw new PhotoError("Фото завелике — до 15 МБ.");

  let buf = input;
  if (looksLikeHeic(buf)) {
    try {
      buf = await decodeHeic(buf);
    } catch {
      throw new PhotoError("Не вдалося прочитати фото HEIC. Спробуйте зберегти його як JPG.");
    }
  }

  let meta: Metadata;
  try {
    meta = await sharp(buf, { failOn: "error" }).metadata();
  } catch {
    throw new PhotoError("Це не схоже на фото. Підходять JPG, PNG, WebP або HEIC.");
  }
  if (!meta.format || !ALLOWED.has(meta.format)) {
    throw new PhotoError("Цей формат не підходить. Підходять JPG, PNG, WebP або HEIC.");
  }

  // Розміри з урахуванням повороту за EXIF.
  const rotated = (meta.orientation ?? 1) >= 5;
  const w = (rotated ? meta.height : meta.width) ?? 0;
  const h = (rotated ? meta.width : meta.height) ?? 0;
  const side = Math.min(w, h);
  if (side < 50) throw new PhotoError("Фото надто мале.");

  const fileKey = `plants/${plantId}/${randomBytes(8).toString("hex")}`;
  const dir = path.join(uploadsDir(), "plants", String(plantId));
  await mkdir(dir, { recursive: true });

  const largest = Math.min(PHOTO_SIZES[0], side);
  try {
    for (const size of PHOTO_SIZES) {
      const out = await sharp(buf, { failOn: "error" })
        .rotate()
        .resize(size, size, { fit: "cover", position: "centre", withoutEnlargement: true })
        .webp({ quality: size >= 1600 ? 80 : 78 })
        .toBuffer(); // без .withMetadata() — EXIF і геолокація не зберігаються
      await writeFile(path.join(uploadsDir(), `${fileKey}-${size}.webp`), out);
    }
  } catch (err) {
    await deletePlantPhotoFiles(fileKey);
    throw err instanceof PhotoError ? err : new PhotoError("Не вдалося обробити фото.");
  }

  return { fileKey, width: largest, height: largest, tooSmall: side < MIN_RECOMMENDED_PX };
}

export async function deletePlantPhotoFiles(fileKey: string): Promise<void> {
  await Promise.all(
    PHOTO_SIZES.map((size) => rm(path.join(uploadsDir(), `${fileKey}-${size}.webp`), { force: true })),
  );
}
