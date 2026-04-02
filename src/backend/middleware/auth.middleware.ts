import type { NextRequest } from "next/server";

import { AUTH_COOKIE_NAME } from "@/shared/constants";
import { errorResponse, verifyJwt } from "@/backend/lib";

interface AuthPayload extends Record<string, unknown> {
  sub?: string;
  role?: string;
}

type AuthHandler = (actorId: string, role: string) => Promise<Response>;

export async function withAuth(req: NextRequest, handler: AuthHandler): Promise<Response> {
  const headerToken = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  const cookieToken = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const token = headerToken ?? cookieToken;

  if (!token) {
    return errorResponse(401, "Authentication required", "UNAUTHORIZED");
  }

  const payload = await verifyJwt<AuthPayload>(token).catch(() => null);

  if (!payload?.sub || !payload.role) {
    return errorResponse(401, "Invalid or expired token", "UNAUTHORIZED");
  }

  return handler(payload.sub, payload.role);
}
