/**
 * Правила показу рослин без звернень до бази — можна використовувати
 * і в браузері (CRM), і на сервері, і на сайті.
 */

import type { PlantConditions, PlantStatus } from "./db/schema";

export const PLANT_STATUS_LABELS: Record<PlantStatus, string> = {
  in_stock: "В наявності",
  low: "Мало",
  preorder: "Передзамовлення",
};

/** Сумарний залишок ≤ 5 при статусі «В наявності» — підсвічуємо в CRM (статус сам не міняємо). */
export const LOW_STOCK_THRESHOLD = 5;

export const MONTHS_SHORT = ["Січ", "Лют", "Бер", "Кві", "Тра", "Чер", "Лип", "Сер", "Вер", "Жов", "Лис", "Гру"];

export const CONDITION_LABELS: Record<keyof PlantConditions, string> = {
  sun: "Сонце",
  partShade: "Півтінь",
  hardy: "Зимує без укриття",
};

type SizeLike = { pot: string; price: number | null; stock: number; unit?: string | null };

/** «0,5 л · 2 л · 3 л» */
export function sizesLabel(sizes: SizeLike[]): string {
  return sizes.map((s) => s.pot).join(" · ");
}

/** Найменша ціна (для «від N грн») або null — «ціна навесні». */
export function minPrice(sizes: SizeLike[]): number | null {
  const prices = sizes.map((s) => s.price).filter((p): p is number => p !== null);
  return prices.length ? Math.min(...prices) : null;
}

/** «90–250 грн», «85 грн» або «ціна навесні». */
export function priceRangeLabel(sizes: SizeLike[]): string {
  const prices = sizes.map((s) => s.price).filter((p): p is number => p !== null);
  if (!prices.length) return "ціна навесні";
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? `${min} грн` : `${min}–${max} грн`;
}

export function totalStock(sizes: SizeLike[]): number {
  return sizes.reduce((sum, s) => sum + s.stock, 0);
}
