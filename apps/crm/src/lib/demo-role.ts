/**
 * Перемикач ролі для демо (`?role=admin|manager|worker`).
 * Працює лише в режимі розробки; у робочій збірці його немає.
 */

import { ROLES, type Role } from "./permissions";

export const isDemoRoleSwitchEnabled = process.env.NODE_ENV !== "production";

/** Cookie, у якій proxy запам'ятовує вибрану роль. */
export const DEMO_ROLE_COOKIE = "crm_demo_role";

/** Без параметра — Менеджер. */
export const DEFAULT_DEMO_ROLE: Role = "manager";

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as string[]).includes(value);
}
