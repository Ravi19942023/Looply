import { beforeEach, describe, expect, it, vi } from "vitest";

import { hashPassword, UnauthorizedError } from "@/backend/lib";
import type { IAuditService } from "@/backend/modules/audit";

import { AuthService } from "./auth.service";
import type { IUserRepository, UserRecord } from "./user.repository.interface";

const findByEmail = vi.fn();
const findById = vi.fn();
const log = vi.fn();

const userRepository: IUserRepository = {
  findByEmail,
  findById,
  findAll: vi.fn(),
  create: vi.fn(),
  updateProfile: vi.fn(),
  updateRole: vi.fn(),
  delete: vi.fn(),
};

const auditService: IAuditService = {
  log,
};

describe("AuthService", () => {
  beforeEach(() => {
    findByEmail.mockReset();
    findById.mockReset();
    log.mockReset();
  });

  it("returns tokens for a valid login", async () => {
    const passwordHash = await hashPassword("password123");

    findByEmail.mockResolvedValue({
      id: "user-1",
      name: "Looply Admin",
      email: "admin@looply.ai",
      role: "admin",
      passwordHash,
    } satisfies UserRecord);

    const service = new AuthService(userRepository, auditService);
    const result = await service.login({
      email: "admin@looply.ai",
      password: "password123",
    });

    expect(result.user.email).toBe("admin@looply.ai");
    expect(result.tokens.accessToken).toBeTruthy();
    expect(result.tokens.refreshToken).toBeTruthy();
    expect(log).toHaveBeenCalledTimes(1);
  });

  it("rejects invalid credentials", async () => {
    findByEmail.mockResolvedValue(null);

    const service = new AuthService(userRepository, auditService);

    await expect(
      service.login({
        email: "missing@looply.ai",
        password: "password123",
      }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
