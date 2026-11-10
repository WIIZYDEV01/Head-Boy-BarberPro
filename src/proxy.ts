import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

const AUTH_PAGES = ["/login", "/register", "/forgot-password", "/update-password"];
const GOOGLE_VERIFY_FILE = /^\/google[A-Za-z0-9_-]+\.html$/;

function isPublicPath(pathname: string) {
  if (AUTH_PAGES.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return true;
  }
  if (pathname.startsWith("/auth/callback")) return true;
  if (pathname.startsWith("/api/webhooks")) return true;
  if (GOOGLE_VERIFY_FILE.test(pathname)) return true;
  return false;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Search Console HTML-file check must not hit the login wall.
  if (GOOGLE_VERIFY_FILE.test(pathname)) {
    const file = pathname.slice(1);
    return new NextResponse(`google-site-verification: ${file}`, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  // Do not call getUser() here. It can consume the OAuth code before the callback route exchanges it.
  if (pathname.startsWith("/auth/callback")) {
    return NextResponse.next({ request });
  }

  const { user, response } = await updateSession(request);

  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname === "/" ? "/app" : pathname);
    return NextResponse.redirect(url);
  }

  if (user && AUTH_PAGES.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    const url = request.nextUrl.clone();
    url.pathname = "/app";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4)$).*)",
  ],
};
