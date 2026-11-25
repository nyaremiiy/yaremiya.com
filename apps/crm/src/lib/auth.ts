/**
 * Вхід у CRM — поки заглушка.
 *
 * Справжня авторизація (PostgreSQL, хеш паролів, сесії в httpOnly-cookie,
 * обмеження спроб) з'явиться на наступному етапі — тоді замінюємо лише
 * тіло цієї функції, а сторінка входу лишається без змін.
 */

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

  return { ok: false, error: "not-connected" };
}
