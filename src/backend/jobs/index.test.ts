import { describe, expect, it, vi } from "vitest";

vi.mock("@/backend/lib", async () => {
  const actual = await vi.importActual<typeof import("@/backend/lib")>("@/backend/lib");

  return {
    ...actual,
    logger: {
      info: vi.fn(),
    },
  };
});

describe("jobs runtime mode", () => {
  it("registers the route-driven background job surface", async () => {
    const jobsModule = await import("./index");
    expect(jobsModule.resolveJobRegistrationMode()).toBe("route-driven");
    expect(jobsModule.registerAllJobs()).toBe("registered");
  }, 30000);
});
