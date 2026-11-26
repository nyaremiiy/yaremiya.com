import type { Role } from "./permissions";

/** Хто зараз працює в CRM (без секретів — можна передавати в браузер). */
export type CurrentUser = {
  id: number;
  login: string;
  name: string;
  /** Кличний відмінок для привітання: «Оксано». Без нього — просто «Доброго дня!». */
  vocative?: string;
  initial: string;
  role: Role;
};

/** Перша літера імені для кружечка-аватара. */
export function initialOf(name: string): string {
  return (name.trim().charAt(0) || "?").toUpperCase();
}
