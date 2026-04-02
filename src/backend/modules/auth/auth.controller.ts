import type { NextRequest } from "next/server";

import { REFRESH_COOKIE_NAME } from "@/shared/constants";
import { errorResponse, successResponse } from "@/backend/lib";

import { LoginSchema } from "./auth.schema";
import type { AuthService } from "./auth.service";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async login(req: NextRequest): Promise<Response> {
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(400, "Validation failed", "VALIDATION_ERROR", parsed.error.flatten());
    }

    const result = await this.authService.login(parsed.data);
    const response = successResponse(200, result.user);

    response.headers.append("Set-Cookie", this.authService.buildAccessCookieHeader(result.tokens.accessToken));
    response.headers.append("Set-Cookie", this.authService.buildRefreshCookieHeader(result.tokens.refreshToken));

    return response;
  }

  async refresh(req: NextRequest): Promise<Response> {
    const refreshToken = req.cookies.get(REFRESH_COOKIE_NAME)?.value;

    if (!refreshToken) {
      return errorResponse(401, "Refresh token missing", "UNAUTHORIZED");
    }

    const result = await this.authService.refreshSession(refreshToken);
    const response = successResponse(200, result.user);
    response.headers.append("Set-Cookie", this.authService.buildAccessCookieHeader(result.tokens.accessToken));
    response.headers.append("Set-Cookie", this.authService.buildRefreshCookieHeader(result.tokens.refreshToken));
    return response;
  }
}
