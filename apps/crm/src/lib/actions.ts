"use server";

/**
 * Дії Працівника. Права перевіряються тут, на сервері, а не лише в меню.
 * Самі дані поки демо — справжні запити до бази з'являться разом
 * із розділами «Замовлення» й «Рослини».
 */

import { authorizeAction } from "./session";

export async function markOrderReady(id: string, ready: boolean): Promise<{ ok: true }> {
  await authorizeAction("orders");
  void id;
  void ready;
  return { ok: true };
}

export async function updateStock(
  items: { id: string; qty: number }[],
): Promise<{ ok: true }> {
  await authorizeAction("plants");
  void items;
  // Невелика пауза, щоб було видно стан «Зберігаємо…».
  await new Promise((resolve) => setTimeout(resolve, 400));
  return { ok: true };
}
