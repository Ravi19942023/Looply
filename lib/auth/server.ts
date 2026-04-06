import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getUserById } from "@/lib/db/queries";
import type {
  AccessTokenPayload,
  AuthSession,
  AuthUser,
  RefreshTokenPayload,
} from "./types";

export const AUTH_COOKIE_NAME = "looply_access_token";
export const REFRESH_COOKIE_NAME = "looply_refresh_token";

const ACCESS_TOKEN_MAX_AGE = 60 * 60 * 24;
const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 7;

function base64urlEncode(value: string) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64urlDecode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding =
    normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, "base64").toString("utf8");
}

function signValue(value: string) {
  return createHmac("sha256", process.env.AUTH_SECRET ?? "")
    .update(value)
    .digest("base64url");
}

function signToken<T extends Record<string, unknown>>(payload: T) {
  const header = base64urlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64urlEncode(JSON.stringify(payload));
  const unsigned = `${header}.${body}`;
  const signature = signValue(unsigned);
  return `${unsigned}.${signature}`;
}

function verifyToken<T extends Record<string, unknown>>(
  token: string
): T | null {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [header, body, signature] = parts;
  if (!header || !body || !signature) {
    return null;
  }

  const expectedSignature = signValue(`${header}.${body}`);

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (signatureBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64urlDecode(body)) as T & { exp?: number };
    if (
      typeof payload.exp !== "number" ||
      payload.exp < Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function verifyAccessToken(token: string) {
  return verifyToken<AccessTokenPayload>(token);
}

export function verifyRefreshToken(token: string) {
  return verifyToken<RefreshTokenPayload>(token);
}

function parseCookieHeader(header: string | null) {
  const pairs = (header ?? "").split(";").map((part) => part.trim());
  const cookies = new Map<string, string>();

  for (const pair of pairs) {
    if (!pair) {
      continue;
    }
    const separatorIndex = pair.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }
    const name = pair.slice(0, separatorIndex).trim();
    const value = pair.slice(separatorIndex + 1).trim();
    cookies.set(name, decodeURIComponent(value));
  }

  return cookies;
}

export function createAuthSession(user: AuthUser): {
  accessToken: string;
  refreshToken: string;
} {
  const now = Math.floor(Date.now() / 1000);
  const accessToken = signToken<AccessTokenPayload>({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    type: "access",
    exp: now + ACCESS_TOKEN_MAX_AGE,
  });
  const refreshToken = signToken<RefreshTokenPayload>({
    sub: user.id,
    type: "refresh",
    exp: now + REFRESH_TOKEN_MAX_AGE,
  });

  return { accessToken, refreshToken };
}

export function setAuthCookies(
  target:
    | ReadonlyRequestCookies
    | {
        set: (
          name: string,
          value: string,
          options: Record<string, unknown>
        ) => void;
      },
  tokens: { accessToken: string; refreshToken: string }
) {
  const secure = process.env.NODE_ENV === "production";
  const baseOptions = {
    httpOnly: true,
    path: "/",
    sameSite: "lax" as const,
    secure,
  };

  target.set(AUTH_COOKIE_NAME, tokens.accessToken, {
    ...baseOptions,
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });
  target.set(REFRESH_COOKIE_NAME, tokens.refreshToken, {
    ...baseOptions,
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
}

export function clearAuthCookies(
  target:
    | ReadonlyRequestCookies
    | {
        set: (
          name: string,
          value: string,
          options: Record<string, unknown>
        ) => void;
      }
) {
  const secure = process.env.NODE_ENV === "production";
  const options = {
    httpOnly: true,
    path: "/",
    sameSite: "lax" as const,
    secure,
    maxAge: 0,
  };

  target.set(AUTH_COOKIE_NAME, "", options);
  target.set(REFRESH_COOKIE_NAME, "", options);
}

export async function getCurrentUserFromCookies(
  cookieStore:
    | ReadonlyRequestCookies
    | { get: (name: string) => { value: string } | undefined }
): Promise<AuthUser | null> {
  const accessToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!accessToken) {
    return null;
  }

  const payload = verifyAccessToken(accessToken);
  if (!payload?.sub || payload.type !== "access") {
    return null;
  }

  const user = await getUserById({ id: payload.sub });
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name ?? null,
    role: (user.role as AuthUser["role"]) ?? "manager",
    type: (user.role as AuthUser["type"]) ?? "manager",
  };
}

export async function getCurrentUserFromRequest(
  request: Request | NextRequest
): Promise<AuthUser | null> {
  const cookieHeader = request.headers.get("cookie");
  const parsed = parseCookieHeader(cookieHeader);
  const accessToken = parsed.get(AUTH_COOKIE_NAME);

  if (!accessToken) {
    return null;
  }

  const payload = verifyAccessToken(accessToken);
  if (!payload?.sub || payload.type !== "access") {
    return null;
  }

  const user = await getUserById({ id: payload.sub });
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name ?? null,
    role: (user.role as AuthUser["role"]) ?? "manager",
    type: (user.role as AuthUser["type"]) ?? "manager",
  };
}

export async function refreshAccessTokenFromRequest(
  request: NextRequest
): Promise<{ response: NextResponse; user: AuthUser } | null> {
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;

  if (!refreshToken) {
    return null;
  }

  const payload = verifyRefreshToken(refreshToken);
  if (!payload?.sub || payload.type !== "refresh") {
    return null;
  }

  const user = await getUserById({ id: payload.sub });
  if (!user) {
    return null;
  }

  const authUser: AuthUser = {
    id: user.id,
    email: user.email,
    name: user.name ?? null,
    role: (user.role as AuthUser["role"]) ?? "manager",
    type: (user.role as AuthUser["type"]) ?? "manager",
  };

  const tokens = createAuthSession(authUser);
  const response = NextResponse.redirect(request.nextUrl);
  setAuthCookies(response.cookies, tokens);

  return { response, user: authUser };
}

export async function getCurrentSessionFromCookies(
  cookieStore:
    | ReadonlyRequestCookies
    | { get: (name: string) => { value: string } | undefined }
): Promise<AuthSession | null> {
  const user = await getCurrentUserFromCookies(cookieStore);
  return user ? { user } : null;
}
