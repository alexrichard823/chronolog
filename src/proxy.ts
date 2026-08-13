import { NextResponse, type NextRequest } from "next/server";
import { safeRedirectPath } from "@/lib/auth/redirects";
import { updateSession } from "@/lib/supabase/proxy";

const protectedPaths = ["/families", "/update-password"];
const signedOutOnlyPaths = ["/login", "/register"];

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => to.cookies.set(cookie));
  return to;
}

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname, search } = request.nextUrl;
  const isProtected = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (!user && isProtected) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", safeRedirectPath(`${pathname}${search}`));
    return copyCookies(response, NextResponse.redirect(loginUrl));
  }

  if (user && signedOutOnlyPaths.includes(pathname)) {
    const familiesUrl = request.nextUrl.clone();
    familiesUrl.pathname = "/families";
    familiesUrl.search = "";
    return copyCookies(response, NextResponse.redirect(familiesUrl));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
