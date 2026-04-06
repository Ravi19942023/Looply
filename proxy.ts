import { type NextRequest, NextResponse } from "next/server";
import {
  createAuthSession,
  getCurrentUserFromRequest,
  REFRESH_COOKIE_NAME,
  verifyRefreshToken,
} from "@/lib/auth/server";
import { getUserById } from "@/lib/db/queries";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/ping")) {
    return new Response("pong", { status: 200 });
  }

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  if (["/login", "/register"].includes(pathname)) {
    const user = await getCurrentUserFromRequest(request);
    if (user) {
      const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
      return NextResponse.redirect(new URL(`${base}/`, request.url));
    }

    return NextResponse.next();
  }

  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const user = await getCurrentUserFromRequest(request);

  if (!user) {
    const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;

    if (refreshToken) {
      const payload = verifyRefreshToken(refreshToken);
      if (payload?.sub) {
        const dbUser = await getUserById({ id: payload.sub });
        if (dbUser) {
          const response = NextResponse.next();
          const tokens = await createAuthSession({
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name ?? null,
            type: "regular",
          });
          response.cookies.set("looply_access_token", tokens.accessToken, {
            httpOnly: true,
            path: "/",
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24,
          });
          response.cookies.set("looply_refresh_token", tokens.refreshToken, {
            httpOnly: true,
            path: "/",
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 7,
          });
          return response;
        }
      }
    }

    const redirectUrl = encodeURIComponent(new URL(request.url).pathname);

    return NextResponse.redirect(
      new URL(`${base}/login?redirectUrl=${redirectUrl}`, request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/chat/:id",
    "/api/:path*",
    "/login",
    "/register",

    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
