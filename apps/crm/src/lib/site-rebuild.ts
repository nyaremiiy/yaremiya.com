/**
 * Сигнал «перезібрати сайт» після змін рослин у CRM.
 *
 * На сервері працює невеликий сервіс (`apps/site/deploy/site-rebuilder.mjs`):
 * отримавши сигнал, він чекає 60 с (кілька змін підряд — одне перезбирання),
 * збирає сайт і миттєво підміняє його. Адреса й секрет — у `.env`
 * (SITE_REBUILD_URL, SITE_REBUILD_SECRET). Порожньо — нічого не робимо
 * (локально сайт перезбирають вручну: `pnpm site:rebuild`).
 */
export function requestSiteRebuild(reason: string): void {
  const url = process.env.SITE_REBUILD_URL?.trim();
  const secret = process.env.SITE_REBUILD_SECRET?.trim();
  if (!url || !secret) return;

  // Не чекаємо: збереження в CRM не має гальмувати через сайт.
  void fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
    signal: AbortSignal.timeout(5000),
  }).catch((err) => console.error("Сигнал перезбирання сайту не надіслано:", (err as Error).message));
}

/** Адреса сайту для «Переглянути на сайті» (локально — SITE_PUBLIC_URL=http://localhost:4321). */
export function sitePublicUrl(): string {
  return (process.env.SITE_PUBLIC_URL?.trim() || "https://yaremiya.com").replace(/\/$/, "");
}
