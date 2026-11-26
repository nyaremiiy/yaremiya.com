/**
 * Правила для користувачів: формат логіна, паролі.
 * Спільне для CRM і команд у терміналі.
 */

import { hash, verify } from "@node-rs/argon2";

export const LOGIN_PATTERN = /^[a-z0-9_.-]{3,32}$/;
export const PASSWORD_MIN_LENGTH = 8;

/** Логін зберігаємо й порівнюємо малими літерами, без пробілів по краях. */
export function normalizeLogin(login: string): string {
  return login.trim().toLowerCase();
}

export function isValidLogin(login: string): boolean {
  return LOGIN_PATTERN.test(login);
}

// argon2id з параметрами, рекомендованими OWASP (19 МіБ пам'яті, 2 проходи).
const ARGON2_OPTIONS = { memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

export async function hashPassword(password: string): Promise<string> {
  if (password.length < PASSWORD_MIN_LENGTH) {
    throw new Error(`Пароль має бути щонайменше ${PASSWORD_MIN_LENGTH} символів.`);
  }
  return hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}
