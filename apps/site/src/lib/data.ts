// Єдина точка доступу до даних рослин і сезону для сайту.
// Рослини беруться з бази (PostgreSQL) через @yaremiya/shared під час збирання сайту:
// лише ті, що «Показувати на сайті» й не в архіві. Змінюються в CRM (розділ «Рослини»).
// apps/site/data/plants.json — лише резерв для `pnpm db:import-plants`, сайт його не читає.
import { getSiteCatalog, type SitePlant } from '@yaremiya/shared/plants';
import { closeDb } from '@yaremiya/shared/db';
import seasonData from '../../data/season.json';

export type StatusId = SitePlant['status'];
export type Plant = SitePlant;

export interface Category {
  id: string;
  label: string;
}

export interface Status {
  text: string;
  bg: string;
  fg: string;
}

export interface SeasonRow {
  name: string;
  kind: string;
  /** Суцільні проміжки місяців (0 = січень). */
  segments: { from: number; to: number }[];
}

async function loadCatalog() {
  try {
    return await getSiteCatalog();
  } catch (err) {
    throw new Error(
      `Не вдалося прочитати рослини з бази: ${(err as Error).message}\n` +
        'Перевірте DATABASE_URL у файлі .env у корені репозиторію (і що база запущена).',
    );
  } finally {
    await closeDb();
  }
}

const catalog = await loadCatalog();

export const categories: Category[] = [
  { id: 'all', label: 'Усі' },
  ...catalog.categories.map((c) => ({ id: c.slug, label: c.name })),
];

export const statuses: Record<StatusId, Status> = {
  in_stock: { text: 'В наявності', bg: '#E6F0DE', fg: '#3F6130' },
  low: { text: 'Мало', bg: '#F7EBD6', fg: '#7A4F0E' },
  preorder: { text: 'Передзамовлення на весну', bg: '#ECEFEA', fg: '#3E4C3B' },
};

export const plants: Plant[] = catalog.plants;

/** Суцільні проміжки з набору місяців: [2,3,4,9] → [{2–4}, {9–9}]. */
function segmentsOf(months: number[]): { from: number; to: number }[] {
  const sorted = [...new Set(months)].sort((a, b) => a - b);
  const out: { from: number; to: number }[] = [];
  for (const m of sorted) {
    const last = out[out.length - 1];
    if (last && m === last.to + 1) last.to = m;
    else out.push({ from: m, to: m });
  }
  return out;
}

/**
 * Сезонний календар — з «Сезону продажу» рослин у CRM.
 * Рядок — рослини з однаковим першим словом назви («Лаванда …», «Самшит …»),
 * місяці — об'єднання їхніх місяців; підпис — категорії.
 */
function seasonRows(): SeasonRow[] {
  const groups = new Map<string, { months: number[]; kinds: Set<string> }>();
  for (const p of plants) {
    if (!p.seasonMonths.length) continue;
    const key = p.name.split(/[\s—–-]+/)[0];
    const g = groups.get(key) ?? { months: [], kinds: new Set<string>() };
    g.months.push(...p.seasonMonths);
    g.kinds.add(p.categoryName.toLowerCase());
    groups.set(key, g);
  }
  return [...groups.entries()]
    .map(([name, g]) => ({ name, kind: [...g.kinds].join(', '), segments: segmentsOf(g.months) }))
    .sort((a, b) => a.segments[0].from - b.segments[0].from || a.name.localeCompare(b.name, 'uk'));
}

export const season = {
  months: seasonData.months as string[],
  monthsFull: seasonData.monthsFull as string[],
  rows: seasonRows(),
};
