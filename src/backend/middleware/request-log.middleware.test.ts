import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { mockInfo } = vi.hoisted(() => ({
  mockInfo: vi.fn(),
}));

vi.mock("@/backend/lib", async () => {
  const actual = await vi.importActual<typeof import("@/backend/lib")>("@/backend/lib");

  return {
    ...actual,
    logger: {
      info: mockInfo,
    },
  };
});

import { withRequestLog } from "./request-log.middleware";

describe("withRequestLog", () => {
  it("returns the handler response and logs request metadata", async () => {
    const request = new NextRequest("http://localhost/api/v1/customers", {
      headers: {
        "x-real-ip": "127.0.0.1",
      },
    });

    const response = await withRequestLog(request, async () => Response.json({ ok: true }));

    expect(response.status).toBe(200);
    expect(mockInfo).toHaveBeenCalledTimes(1);
  });
});
