"use server";

/**
 * Вхід у CRM і поточний користувач — поки заглушки.
 *
 * Це серверні функції (Server Actions): форма входу викликає `signIn`
 * у браузері, а виконується він на сервері. Справжня авторизація
 * (PostgreSQL, хеш паролів, сесії в httpOnly-cookie, обмеження спроб)
 * з'явиться на наступному етапі — тоді замінюємо лише тіла цих функцій,
 * а сторінки лишаються без змін.
 */

import { cookies } from "next/headers";
import { demoUsers, type DemoUser } from "./demo-data";
import { DEFAULT_DEMO_ROLE, DEMO_ROLE_COOKIE, isDemoRoleSwitchEnabled, isRole } from "./demo-role";
import type { Role } from "./permissions";

export type SignInResult =
  | { ok: true }
  | { ok: false; error: "invalid-credentials" | "not-connected" };

export async function signIn(
  email: string,
  password: string,
  remember: boolean,
): Promise<SignInResult> {
  void email;
  void password;
  void remember;

  // Невелика пауза, щоб було видно стан «Входимо…».
  await new Promise((resolve) => setTimeout(resolve, 600));

  // Демо: у режимі розробки «впускаємо» з будь-якими даними, щоб можна було
  // подивитися дашборд. У робочій збірці входу ще немає.
  if (isDemoRoleSwitchEnabled) return { ok: true };
  return { ok: false, error: "not-connected" };
}

export type CurrentUser = DemoUser;

/**
 * Хто зараз працює в CRM. Поки — демо-користувач:
 * роль з `?role=admin|manager|worker` (запам'ятовується в cookie, див. `src/proxy.ts`),
 * без параметра — Менеджер. Перемикач працює лише в режимі розробки.
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  let role: Role = DEFAULT_DEMO_ROLE;
  if (isDemoRoleSwitchEnabled) {
    const fromCookie = (await cookies()).get(DEMO_ROLE_COOKIE)?.value;
    if (isRole(fromCookie)) role = fromCookie;
  }
  return demoUsers[role];
}
