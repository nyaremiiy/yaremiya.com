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
  lowStock,
  newLeads,
  ordersToPrepare,
  pickupsToday,
  recentOrders,
  salesByCategory,
  salesMonth,
  todayMetrics,
} from "./demo-data";
import { demoDelay } from "./demo-delay";
import { getTeam } from "./team";

export const getTodayMetrics = cache(async () => {
  await demoDelay(0.5);
  return todayMetrics;
});

export const getLowStock = cache(async () => {
  await demoDelay(0.7);
  return lowStock;
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
  return { orders: ordersToPrepare, stock: lowStock, pickupsToday };
});
