import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import { PgVectorAdapter } from "./pgvector.adapter";

const describePgVector =
  process.env.RUN_DB_ADAPTER_TESTS === "true" ? describe : describe.skip;

describePgVector("PgVectorAdapter", () => {
  it("upserts, queries, and deletes vector records", async () => {
    const recordId = `vector-${randomUUID()}`;
    const namespace = `workspace-${randomUUID()}`;
    const adapter = new PgVectorAdapter();

    await adapter.upsert([
      {
        id: recordId,
        namespace,
        values: Array.from({ length: 1536 }, (_, index) => (index === 0 ? 1 : 0)),
        metadata: {
          source: "test",
          fileName: "vector-test.txt",
          text: "This is a test chunk for lexical search.",
        },
      },
    ]);

    const results = await adapter.query(
      namespace,
      Array.from({ length: 1536 }, (_, index) => (index === 0 ? 1 : 0)),
      5,
    );
    const lexicalResults = await adapter.queryLexical(namespace, "test", 5);

    expect(results.some((result) => result.id === recordId)).toBe(true);
    expect(lexicalResults.some((result) => result.id === recordId)).toBe(true);

    await adapter.delete(namespace, [recordId]);
    const afterDelete = await adapter.query(
      namespace,
      Array.from({ length: 1536 }, (_, index) => (index === 0 ? 1 : 0)),
      5,
    );
    expect(afterDelete.some((result) => result.id === recordId)).toBe(false);
  }, 15_000);
});
