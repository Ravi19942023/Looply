import { AUTH_COOKIE_NAME, REFRESH_COOKIE_NAME } from "@/shared/constants";
import { comparePassword, signJwt, UnauthorizedError } from "@/backend/lib";
import type { IAuditService } from "@/backend/modules/audit";
import { AUDIT_EVENTS } from "@/backend/modules/audit";

import type { AuthResult, LoginPayload } from "./auth.types";
import type { IUserRepository } from "./user.repository.interface";

export class AuthService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly auditService: IAuditService,
  ) {}

  async login(payload: LoginPayload): Promise<AuthResult> {
    const user = await this.userRepository.findByEmail(payload.email);

    if (!user || !(await comparePassword(payload.password, user.passwordHash))) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const accessToken = await signJwt({
      sub: user.id,
      role: user.role,
      email: user.email,
    });

    const refreshToken = await signJwt(
      {
        sub: user.id,
        type: "refresh",
      },
      "7d",
    );

    await this.auditService.log({
      actorId: user.id,
      event: AUDIT_EVENTS.LOGIN_SUCCEEDED,
      metadata: {
        email: user.email,
      },
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  async refreshSession(refreshToken: string): Promise<AuthResult> {
    const payload = await import("@/backend/lib").then((module) =>
      module.verifyJwt<{ sub?: string; type?: string }>(refreshToken),
    );

    if (!payload.sub || payload.type !== "refresh") {
      throw new UnauthorizedError("Invalid refresh token");
    }

    const user = await this.userRepository.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    const accessToken = await signJwt({
      sub: user.id,
      role: user.role,
      email: user.email,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  buildAccessCookieHeader(token: string): string {
    return this.buildCookieHeader(AUTH_COOKIE_NAME, token, 60 * 60 * 24);
  }

  buildRefreshCookieHeader(token: string): string {
    return this.buildCookieHeader(REFRESH_COOKIE_NAME, token, 60 * 60 * 24 * 7);
  }

  private buildCookieHeader(name: string, token: string, maxAgeSeconds: number): string {
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    return `${name}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`;
  }
}
