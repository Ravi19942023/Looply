import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/backend/lib", async () => {
  const actual = await vi.importActual<typeof import("@/backend/lib")>("@/backend/lib");

  return {
    ...actual,
    verifyJwt: vi.fn(),
  };
});

import { verifyJwt } from "@/backend/lib";
import { AUTH_COOKIE_NAME } from "@/shared/constants";

import { withAuth } from "./auth.middleware";

describe("withAuth", () => {
  beforeEach(() => {
    vi.mocked(verifyJwt).mockReset();
  });

  it("returns 401 when no token exists", async () => {
    const request = new NextRequest("http://localhost/api/v1/customers");
    const response = await withAuth(request, async () => Response.json({ ok: true }));

    expect(response.status).toBe(401);
  });

  it("delegates to the handler when the token is valid", async () => {
    vi.mocked(verifyJwt).mockResolvedValue({
      sub: "user-1",
      role: "admin",
    });

    const request = new NextRequest("http://localhost/api/v1/customers", {
      headers: {
        Authorization: "Bearer token",
      },
    });

    const response = await withAuth(request, async (actorId, role) =>
      Response.json({ actorId, role }),
    );
    const body = (await response.json()) as { actorId: string; role: string };

    expect(response.status).toBe(200);
    expect(body.actorId).toBe("user-1");
    expect(body.role).toBe("admin");
  });

  it("accepts a valid cookie token", async () => {
    vi.mocked(verifyJwt).mockResolvedValue({
      sub: "user-2",
      role: "viewer",
    });

    const request = new NextRequest("http://localhost/api/v1/customers", {
      headers: {
        Cookie: `${AUTH_COOKIE_NAME}=cookie-token`,
      },
    });

    const response = await withAuth(request, async (actorId, role) =>
      Response.json({ actorId, role }),
    );
    const body = (await response.json()) as { actorId: string; role: string };

    expect(response.status).toBe(200);
    expect(body.actorId).toBe("user-2");
    expect(body.role).toBe("viewer");
  });

  it("returns 401 when token verification fails", async () => {
    vi.mocked(verifyJwt).mockRejectedValue(new Error("invalid"));

    const request = new NextRequest("http://localhost/api/v1/customers", {
      headers: {
        Authorization: "Bearer bad-token",
      },
    });

    const response = await withAuth(request, async () => Response.json({ ok: true }));
    expect(response.status).toBe(401);
  });

  it("returns 401 when payload is missing required claims", async () => {
    vi.mocked(verifyJwt).mockResolvedValue({
      sub: "user-1",
    });

    const request = new NextRequest("http://localhost/api/v1/customers", {
      headers: {
        Authorization: "Bearer incomplete-token",
      },
    });

    const response = await withAuth(request, async () => Response.json({ ok: true }));
    expect(response.status).toBe(401);
  });
});
