import { describe, expect, it } from "vitest";

import { StorageAdapterFactory } from "./storage-adapter.factory";

describe("StorageAdapterFactory", () => {
  it("constructs the Vercel Blob adapter", () => {
    const adapter = StorageAdapterFactory.create();
    expect(adapter.provider).toBe("vercel-blob");
  });
});
