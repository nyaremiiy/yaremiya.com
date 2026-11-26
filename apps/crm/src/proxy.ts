import { NextResponse, type NextRequest } from "next/server";
import { PATH_HEADER, SESSION_COOKIE } from "@/lib/session-constants";

/**
 * Швидка перевірка на вході: без cookie сесії — одразу на `/login?next=…`.
 * Це лише перший фільтр. Справжня перевірка (чи сесія жива, чи користувач
 * активний, які в нього права) — на сервері в кожній сторінці й дії
 * (`src/lib/session.ts`).
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isLogin = pathname === "/login" || pathname.startsWith("/login/");

  if (!isLogin && !request.cookies.has(SESSION_COOKIE)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    if (pathname !== "/") url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  // Передаємо сторінкам поточну адресу — щоб повернути сюди після входу.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(PATH_HEADER, pathname + search);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  // /media/ — фото рослин, вони публічні (є на сайті).
  matcher: ["/((?!_next/|favicon.svg|logo/|demo/|media/|robots.txt).*)"],
};
