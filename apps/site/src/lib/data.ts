// Єдина точка доступу до даних рослин і сезону.
// Зараз дані беруться з JSON-файлів; пізніше тут можна буде читати їх із бази (Supabase),
// і решта сайту не зміниться.
import plantsData from '../../data/plants.json';
import seasonData from '../../data/season.json';

export type CategoryId = 'all' | 'shrubs' | 'flowers' | 'seedlings' | 'saplings';
export type StatusId = 'in' | 'low' | 'pre';

export interface Category {
  id: CategoryId;
  label: string;
}

export interface Status {
  text: string;
  bg: string;
  fg: string;
}

export interface Plant {
  slug: string;
  category: Exclude<CategoryId, 'all'>;
  name: string;
  detail: string;
  priceFrom: number | null;
  priceText?: string;
  unit: string | null;
  status: StatusId;
  photo: string;
}

export interface SeasonRow {
  name: string;
  kind: string;
  from: number;
  to: number;
}

export const categories = plantsData.categories as Category[];
export const statuses = plantsData.statuses as Record<StatusId, Status>;
export const plants = plantsData.plants as Plant[];

export const categoryLabel = (id: string) =>
  categories.find((c) => c.id === id)?.label ?? id;

export const season = {
  months: seasonData.months as string[],
  monthsFull: seasonData.monthsFull as string[],
  rows: seasonData.rows as SeasonRow[],
};
