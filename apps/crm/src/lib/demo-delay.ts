/**
 * DEMO_DELAY_MS (у `.env`, лише в режимі розробки) — штучна затримка даних,
 * щоб побачити скелетони. На робочому сервері (`NODE_ENV=production`) не діє.
 * `factor` — у скільки разів довше/коротше чекати цьому блоку.
 */
export function demoDelay(factor = 1): Promise<void> {
  if (process.env.NODE_ENV === "production") return Promise.resolve();
  const ms = Number(process.env.DEMO_DELAY_MS) || 0;
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, Math.round(ms * factor)));
}
