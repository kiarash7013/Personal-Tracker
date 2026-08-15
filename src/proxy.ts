import { NextResponse, type NextRequest } from "next/server";
import { getAuthSecret, SESSION_COOKIE_NAME } from "@/modules/authentication/config";
import { verifySessionToken } from "@/modules/authentication/domain/session-token";

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const identity = token ? await verifySessionToken(token, getAuthSecret()) : null;

  if (!identity) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
