import { describe, expect, it } from "vitest";

import { EmailAdapterFactory } from "./email-adapter.factory";

describe("EmailAdapterFactory", () => {
  it("constructs SES", () => {
    const adapter = EmailAdapterFactory.create("ses");
    expect(adapter.provider).toBe("ses");
  });

  it("fails clearly for deferred providers", () => {
    expect(() => EmailAdapterFactory.create("resend")).toThrow();
  });
});
