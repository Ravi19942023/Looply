import { describe, expect, it } from "vitest";

import { VectorAdapterFactory } from "./vector-adapter.factory";

describe("VectorAdapterFactory", () => {
  it("constructs pgvector", () => {
    const adapter = VectorAdapterFactory.create();
    expect(adapter.provider).toBe("pgvector");
  });
});
