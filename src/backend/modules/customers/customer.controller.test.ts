import { describe, expect, it, vi } from "vitest";

import { CustomerController } from "./customer.controller";

describe("CustomerController", () => {
  it("returns 404 when LTV data is missing", async () => {
    const controller = new CustomerController({
      getCustomerLtv: vi.fn().mockResolvedValue(null),
    } as never);

    const response = await controller.ltv("customer-1", "actor-1");

    expect(response.status).toBe(404);
  });
});
