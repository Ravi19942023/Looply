import { and, eq, ilike, or, sql } from "drizzle-orm";

import { db } from "@/backend/db";
import { documentEmbeddings } from "@/backend/db/schema";

import type { IVectorAdapter } from "./vector-adapter.interface";
import type { VectorQueryResult, VectorRecord } from "./vector.types";

const LEXICAL_STOP_WORDS = new Set([
  "a",
  "an",
  "about",
  "and",
  "for",
  "is",
  "me",
  "tell",
  "the",
  "to",
  "what",
]);

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getSignificantTokens(query: string): string[] {
  return Array.from(
    new Set(
      normalizeSearchText(query)
        .split(" ")
        .filter((token) => token.length >= 3 && !LEXICAL_STOP_WORDS.has(token)),
    ),
  );
}

function buildNormalizedMetadataExpr(field: "text" | "fileName") {
  return sql`trim(regexp_replace(regexp_replace(lower(coalesce(metadata->>${field}, '')), '[^a-z0-9]+', ' ', 'g'), ' +', ' ', 'g'))`;
}

function toVectorLiteral(values: number[]): string {
  if (values.length === 0) {
    throw new Error("Vector values are required.");
  }

  if (!values.every((value) => Number.isFinite(value))) {
    throw new Error("Vector values must all be finite numbers.");
  }

  return `[${values.join(",")}]`;
}

export class PgVectorAdapter implements IVectorAdapter {
  readonly provider = "pgvector";

  async upsert(records: VectorRecord[]): Promise<void> {
    for (const record of records) {
      const existing = await db.query.documentEmbeddings.findFirst({
        where: sql`${documentEmbeddings.recordId} = ${record.id} and ${documentEmbeddings.namespace} = ${record.namespace}`,
      });

      if (existing) {
        await db
          .update(documentEmbeddings)
          .set({
            namespace: record.namespace,
            embedding: record.values,
            metadata: record.metadata ?? {},
            updatedAt: new Date(),
          })
          .where(sql`${documentEmbeddings.recordId} = ${record.id} and ${documentEmbeddings.namespace} = ${record.namespace}`);
      } else {
        await db.insert(documentEmbeddings).values({
          namespace: record.namespace,
          recordId: record.id,
          embedding: record.values,
          metadata: record.metadata ?? {},
        });
      }
    }
  }

  async query(namespace: string, values: number[], limit: number): Promise<VectorQueryResult[]> {
    const vectorLiteral = sql.raw(`'${toVectorLiteral(values)}'::vector`);
    const result = await db.execute(sql`
      select
        record_id as id,
        namespace,
        metadata,
        1 - (embedding <=> ${vectorLiteral}) as score
      from document_embeddings
      where namespace = ${namespace}
      order by embedding <=> ${vectorLiteral}
      limit ${limit}
    `);

    const normalizedResult = result as unknown as
      | Array<{ id: string; namespace: string; score: number | string; metadata: Record<string, unknown> | null }>
      | { rows?: Array<{ id: string; namespace: string; score: number | string; metadata: Record<string, unknown> | null }> };

    const rows = Array.isArray(normalizedResult)
      ? normalizedResult
      : Array.isArray(normalizedResult.rows)
        ? normalizedResult.rows
        : [];

    return rows.map((row) => ({
      id: String(row.id),
      score: Number(row.score),
      namespace: String(row.namespace),
      metadata: (row.metadata as Record<string, unknown> | null) ?? undefined,
      retrievalMode: "semantic",
    }));
  }

  async queryLexical(namespace: string, query: string, limit: number): Promise<VectorQueryResult[]> {
    const normalizedQuery = normalizeSearchText(query);
    const tokens = getSignificantTokens(query);

    if (!normalizedQuery && tokens.length === 0) {
      return [];
    }

    const normalizedTextExpr = buildNormalizedMetadataExpr("text");
    const normalizedFileNameExpr = buildNormalizedMetadataExpr("fileName");
    const fetchLimit = Math.max(limit * 4, 20);
    const queryPattern = `%${normalizedQuery}%`;
    const tokenScoreTerms = tokens.map((token) => {
      const tokenPattern = `%${token}%`;
      return sql`(case when ${normalizedTextExpr} like ${tokenPattern} or ${normalizedFileNameExpr} like ${tokenPattern} then 1 else 0 end)`;
    });
    const tokenMatchesExpr =
      tokenScoreTerms.length > 0 ? sql.join(tokenScoreTerms, sql` + `) : sql`0`;
    const exactFileNameMatchExpr = normalizedQuery
      ? sql`case when ${normalizedFileNameExpr} like ${queryPattern} then true else false end`
      : sql`false`;
    const exactTextMatchExpr = normalizedQuery
      ? sql`case when ${normalizedTextExpr} like ${queryPattern} then true else false end`
      : sql`false`;

    const whereClauses = [
      normalizedQuery
        ? sql`${normalizedTextExpr} like ${queryPattern}`
        : null,
      normalizedQuery
        ? sql`${normalizedFileNameExpr} like ${queryPattern}`
        : null,
      ...tokens.flatMap((token) => {
        const tokenPattern = `%${token}%`;
        return [
          sql`${normalizedTextExpr} like ${tokenPattern}`,
          sql`${normalizedFileNameExpr} like ${tokenPattern}`,
        ];
      }),
    ].filter((clause): clause is Exclude<typeof clause, null> => clause !== null);

    if (whereClauses.length === 0) {
      return [];
    }

    const result = await db.execute(sql`
      select
        record_id as id,
        namespace,
        metadata,
        ${exactFileNameMatchExpr} as exact_file_name_match,
        ${exactTextMatchExpr} as exact_text_match,
        ${tokenMatchesExpr} as token_matches
      from document_embeddings
      where namespace = ${namespace}
        and (${sql.join(whereClauses, sql` or `)})
      order by
        ${exactFileNameMatchExpr} desc,
        ${exactTextMatchExpr} desc,
        ${tokenMatchesExpr} desc,
        created_at desc
      limit ${fetchLimit}
    `);

    const normalizedResult = result as unknown as
      | Array<{
        id: string;
        namespace: string;
        metadata: Record<string, unknown> | null;
        exact_file_name_match: boolean;
        exact_text_match: boolean;
        token_matches: number | string;
      }>
      | {
        rows?: Array<{
          id: string;
          namespace: string;
          metadata: Record<string, unknown> | null;
          exact_file_name_match: boolean;
          exact_text_match: boolean;
          token_matches: number | string;
        }>;
      };

    const rows = Array.isArray(normalizedResult)
      ? normalizedResult
      : Array.isArray(normalizedResult.rows)
        ? normalizedResult.rows
        : [];

    return rows.map((row) => {
      const tokenMatches = Number(row.token_matches);
      const tokenCoverage = tokens.length === 0 ? 0 : tokenMatches / tokens.length;
      const exactFileNameMatch = Boolean(row.exact_file_name_match);
      const exactTextMatch = Boolean(row.exact_text_match);
      const lexicalScore = exactFileNameMatch
        ? 1
        : exactTextMatch
          ? 0.95
          : Math.min(0.9, tokenCoverage * 0.8 + (tokenMatches > 0 ? 0.1 : 0));

      return {
        id: String(row.id),
        score: lexicalScore,
        namespace: String(row.namespace),
        metadata: (row.metadata as Record<string, unknown> | null) ?? undefined,
        retrievalMode: "lexical",
        lexical: {
          exactFileNameMatch,
          exactTextMatch,
          tokenMatches,
          tokenCoverage,
        },
      };
    });
  }

  async delete(namespace: string, ids: string[]): Promise<void> {
    for (const id of ids) {
      await db
        .delete(documentEmbeddings)
        .where(
          and(
            eq(documentEmbeddings.namespace, namespace),
            or(
              eq(documentEmbeddings.recordId, id),
              ilike(documentEmbeddings.recordId, `${id}:%`),
            ),
          ),
        );
    }
  }
}
