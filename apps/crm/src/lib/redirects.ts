/** Куди перейти після входу: адреса з `?next=` (лише всередині CRM) або дашборд. */
export function safeNextPath(next: string | undefined | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return "/dashboard";
  }
  if (next === "/login" || next.startsWith("/login?") || next.startsWith("/login/")) {
    return "/dashboard";
  }
  return next;
}
