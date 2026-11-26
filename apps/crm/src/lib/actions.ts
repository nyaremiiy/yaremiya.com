"use server";

/**
 * Дії Працівника. Права перевіряються тут, на сервері, а не лише в меню.
 * Залишки — уже з бази; замовлення поки демо (з'являться з розділом «Замовлення»).
 */

import { updateStocks } from "./plant-actions";
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
  // Залишки — з бази: id має вигляд «s-<id розміру>» (див. getLowStockSizes).
  await authorizeAction("plants");
  const changes = items
    .map((item) => ({ sizeId: Number(item.id.replace(/^s-/, "")), stock: item.qty }))
    .filter((c) => Number.isInteger(c.sizeId));
  return updateStocks(changes);
}
