import { describe, expect, it } from "vitest";

import { ensureBootstrap } from "./bootstrap";

describe("bootstrap", () => {
  it("registers all phase 9 services and controllers", async () => {
    const bootstrappedContainer = await ensureBootstrap();
    const secondContainer = await ensureBootstrap();

    expect(secondContainer).toBe(bootstrappedContainer);
    expect(bootstrappedContainer.resolve("AuditService")).toBeDefined();
    expect(bootstrappedContainer.resolve("AnalyticsService")).toBeDefined();
    expect(bootstrappedContainer.resolve("AuthService")).toBeDefined();
    expect(bootstrappedContainer.resolve("CampaignService")).toBeDefined();
    expect(bootstrappedContainer.resolve("ChatService")).toBeDefined();
    expect(bootstrappedContainer.resolve("CustomerService")).toBeDefined();
    expect(bootstrappedContainer.resolve("MemoryService")).toBeDefined();
    expect(bootstrappedContainer.resolve("RagService")).toBeDefined();
    expect(bootstrappedContainer.resolve("UploadService")).toBeDefined();
    expect(bootstrappedContainer.resolve("AnalyticsController")).toBeDefined();
    expect(bootstrappedContainer.resolve("AuditController")).toBeDefined();
    expect(bootstrappedContainer.resolve("AuthController")).toBeDefined();
    expect(bootstrappedContainer.resolve("CampaignController")).toBeDefined();
    expect(bootstrappedContainer.resolve("ChatController")).toBeDefined();
    expect(bootstrappedContainer.resolve("CustomerController")).toBeDefined();
    expect(bootstrappedContainer.resolve("UploadController")).toBeDefined();
  });
});
