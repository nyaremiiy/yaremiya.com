/**
 * `pnpm db:import-plants` — перенести рослини з `apps/site/data/plants.json` у базу
 * (категорії, рослини, розміри, ціни, статуси, фото через ту саму обробку, що й у CRM).
 * Можна запускати повторно: рослини з уже наявним `slug` пропускає.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { closeDb } from "../src/db/client";
import type { PlantStatus } from "../src/db/schema";
import { errorText, repoRoot, requireEnv } from "./env";
import { createPlantIfMissing } from "./plant-data";

requireEnv("DATABASE_URL");

type JsonPlant = {
  slug: string;
  category: string;
  name: string;
  detail: string;
  priceFrom: number | null;
  unit: string | null;
  status: "in" | "low" | "pre";
  photo: string;
};

const CATEGORY: Record<string, string> = {
  shrubs: "dekoratyvni-kushchi",
  flowers: "kvity",
  saplings: "sadzhantsi",
  seedlings: "rozsada-kvitiv",
};
const STATUS: Record<JsonPlant["status"], PlantStatus> = { in: "in_stock", low: "low", pre: "preorder" };

const siteDir = path.join(repoRoot, "apps/site");
const data = JSON.parse(await readFile(path.join(siteDir, "data/plants.json"), "utf8")) as { plants: JsonPlant[] };
const season = JSON.parse(await readFile(path.join(siteDir, "data/season.json"), "utf8")) as {
  rows: { name: string; from: number; to: number }[];
};

/** Сезон — з рядка календаря з тією ж першою частиною назви («Хризантем…»). */
function seasonFor(name: string): number[] {
  const stem = name.toLowerCase().slice(0, 6);
  const row = season.rows.find((r) => r.name.toLowerCase().startsWith(stem));
  if (!row) return [];
  return Array.from({ length: row.to - row.from + 1 }, (_, i) => row.from + i);
}

function potFrom(p: JsonPlant): string {
  const m = p.detail.match(/горщик\s+([\d,]+\s*л)/i);
  if (m) return m[1];
  return p.category === "seedlings" ? "касета" : "саджанець";
}

try {
  let created = 0;
  for (const [i, p] of data.plants.entries()) {
    const ok = await createPlantIfMissing(
      {
        slug: p.slug,
        name: p.name,
        categorySlug: CATEGORY[p.category] ?? "kvity",
        shortDescription: p.detail,
        status: STATUS[p.status],
        isVisible: true,
        seasonMonths: seasonFor(p.name),
        sizes: [{ pot: potFrom(p), price: p.priceFrom, unit: p.unit, stock: 0 }],
        photoFile: path.join(siteDir, "src/assets", p.photo),
        sort: i,
      },
      "import-plants",
    );
    console.log(`${ok ? "✓" : "·"} ${p.name}${ok ? "" : " — уже є, пропускаю"}`);
    if (ok) created++;
  }
  console.log(`Готово: додано ${created}. Залишки поставлено 0 — оновіть їх у CRM.`);
} catch (err) {
  console.error(`✗ ${errorText(err)}`);
  process.exitCode = 1;
} finally {
  await closeDb();
}
