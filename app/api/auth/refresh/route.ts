import { type NextRequest, NextResponse } from "next/server";
import {
  createAuthSession,
  REFRESH_COOKIE_NAME,
  setAuthCookies,
  verifyRefreshToken,
} from "@/lib/auth/server";
import { getUserById } from "@/lib/db/queries";

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;
  if (!refreshToken) {
    return Response.json({ error: "Refresh token missing" }, { status: 401 });
  }

  const payload = verifyRefreshToken(refreshToken);
  if (!payload?.sub) {
    return Response.json({ error: "Invalid refresh token" }, { status: 401 });
  }

  const user = await getUserById({ id: payload.sub });
  if (!user) {
    return Response.json({ error: "User not found" }, { status: 401 });
  }

  const tokens = await createAuthSession({
    id: user.id,
    email: user.email,
    name: user.name ?? null,
    type: "regular",
  });

  const response = NextResponse.json(
    {
      user: {
        id: user.id,
        email: user.email,
        name: user.name ?? null,
        type: "regular",
      },
    },
    { status: 200 }
  );
  setAuthCookies(response.cookies, tokens);
  return response;
}
