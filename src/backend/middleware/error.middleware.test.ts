import { describe, expect, it } from "vitest";

import { AppError } from "@/backend/lib";

import { withErrorBoundary } from "./error.middleware";

describe("withErrorBoundary", () => {
  it("maps AppError to typed response", async () => {
    const response = await withErrorBoundary(async () => {
      throw new AppError(403, "Denied", "FORBIDDEN");
    });

    expect(response.status).toBe(403);
  });

  it("maps unknown errors to 500", async () => {
    const response = await withErrorBoundary(async () => {
      throw new Error("Boom");
    });

    expect(response.status).toBe(500);
  });
});
