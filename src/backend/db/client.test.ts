import { describe, expect, it } from "vitest";

import { getDatabaseConnectionUrl } from "./client";

describe("db client configuration", () => {
  it("uses POSTGRES_URL as the single database connection string", () => {
    expect(
      getDatabaseConnectionUrl({
        appUrl: "http://localhost:3000",
        databaseUrl: "https://example.com/db",
        emailProvider: "ses",
        isDevelopment: false,
        isProduction: true,
      }),
    ).toBe("https://example.com/db");
  });
});
