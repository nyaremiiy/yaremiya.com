import { NextResponse, type NextRequest } from "next/server";
import { DEMO_ROLE_COOKIE, isDemoRoleSwitchEnabled, isRole } from "@/lib/demo-role";

/**
 * ЛИШЕ для демо в режимі розробки: `?role=admin|manager|worker`
 * запам'ятовується в cookie, щоб роль трималась при переходах по меню.
 * Це не захист маршрутів — у робочій збірці proxy нічого не робить.
 */
export function proxy(request: NextRequest) {
  if (!isDemoRoleSwitchEnabled) return NextResponse.next();

  const role = request.nextUrl.searchParams.get("role");
  if (!isRole(role)) return NextResponse.next();

  // Передаємо роль і в поточний запит, і зберігаємо на майбутні.
  request.cookies.set(DEMO_ROLE_COOKIE, role);
  const response = NextResponse.next({ request: { headers: request.headers } });
  response.cookies.set({ name: DEMO_ROLE_COOKIE, value: role, path: "/", sameSite: "lax" });
  return response;
}

export const config = {
  matcher: ["/((?!_next/|favicon.svg|logo/|demo/|robots.txt).*)"],
};
