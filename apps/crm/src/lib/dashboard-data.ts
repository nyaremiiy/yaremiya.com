/**
 * Дані дашборду — поки демо (`demo-data.ts`), «Команда» — з бази.
 * Кожен блок має свою функцію, тож блоки вантажаться незалежно (`<Suspense>`).
 * `cache` — щоб версії для комп'ютера й телефона не просили те саме двічі.
 *
 * DEMO_DELAY_MS (див. `demo-delay.ts`) — штучна затримка, щоб побачити
 * скелетони. Блоки чекають трохи по-різному (×0,5…×1,4) — видно,
 * що вони з'являються незалежно.
 */

import { cache } from "react";
import {
  activity,
  newLeads,
  ordersToPrepare,
  pickupsToday,
  recentOrders,
  salesByCategory,
  salesMonth,
  todayMetrics,
} from "./demo-data";
import { demoDelay } from "./demo-delay";
import { getLowStockSizes, getStockSummary } from "./plants-data";
import { getTeam } from "./team";

/** Показники: «Рослин у наявності» — з бази, решта поки демо. */
export const getTodayMetrics = cache(async () => {
  await demoDelay(0.5);
  const stock = await getStockSummary();
  return todayMetrics.map((m) =>
    m.key === "stock"
      ? {
          ...m,
          value: `${stock.inStock} з ${stock.total}`,
          caption: `${stock.preorder} — передзамовлення`,
          mobile: { ...m.mobile, value: `${stock.inStock}/${stock.total}` },
        }
      : m,
  );
});

/** «Закінчуються» — розміри із залишком ≤ 5 (з бази). */
export const getLowStock = cache(async () => {
  await demoDelay(0.7);
  return getLowStockSizes(3);
});

export const getNewLeads = cache(async () => {
  await demoDelay(0.8);
  return newLeads;
});

export const getRecentOrders = cache(async () => {
  await demoDelay(1);
  return recentOrders;
});

export const getSales = cache(async () => {
  await demoDelay(1.2);
  return { month: salesMonth, categories: salesByCategory };
});

export const getActivity = cache(async () => {
  await demoDelay(1.4);
  return activity;
});

export const getTeamMembers = cache(async () => {
  await demoDelay(1.4);
  return getTeam();
});

export const getWorkerToday = cache(async () => {
  await demoDelay(1);
  return { orders: ordersToPrepare, stock: await getLowStockSizes(3), pickupsToday };
});
