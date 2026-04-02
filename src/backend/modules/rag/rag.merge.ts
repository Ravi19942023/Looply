import type { VectorQueryResult } from "@/backend/adapters/vector";
import type { RagContextChunk } from "./rag.types";

export interface DocumentLike {
  id: string;
  fileName: string;
  url: string;
}

type Scope = "global" | "session";

export function mergeRagMatches(
  semanticMatches: VectorQueryResult[],
  lexicalMatches: VectorQueryResult[],
  limit: number,
): VectorQueryResult[] {
  const candidates = new Map<
    string,
    {
      result: VectorQueryResult;
      semanticScore: number;
      lexicalScore: number;
      exactFileNameMatch: boolean;
      exactTextMatch: boolean;
      tokenMatches: number;
      scope: Scope;
    }
  >();

  for (const result of semanticMatches) {
    const scope = (result.metadata?.scope as Scope | undefined) ?? "global";
    candidates.set(`${scope}:${result.id}`, {
      result,
      semanticScore: result.score,
      lexicalScore: 0,
      exactFileNameMatch: false,
      exactTextMatch: false,
      tokenMatches: 0,
      scope,
    });
  }

  for (const result of lexicalMatches) {
    const scope = (result.metadata?.scope as Scope | undefined) ?? "global";
    const key = `${scope}:${result.id}`;
    const existing = candidates.get(key);
    const lexical = result.lexical;

    if (existing) {
      existing.lexicalScore = Math.max(existing.lexicalScore, result.score);
      existing.exactFileNameMatch = existing.exactFileNameMatch || Boolean(lexical?.exactFileNameMatch);
      existing.exactTextMatch = existing.exactTextMatch || Boolean(lexical?.exactTextMatch);
      existing.tokenMatches = Math.max(existing.tokenMatches, lexical?.tokenMatches ?? 0);
      existing.result = {
        ...existing.result,
        metadata: existing.result.metadata ?? result.metadata,
        lexical: lexical ?? existing.result.lexical,
      };
      continue;
    }

    candidates.set(key, {
      result,
      semanticScore: 0,
      lexicalScore: result.score,
      exactFileNameMatch: Boolean(lexical?.exactFileNameMatch),
      exactTextMatch: Boolean(lexical?.exactTextMatch),
      tokenMatches: lexical?.tokenMatches ?? 0,
      scope,
    });
  }

  return [...candidates.values()]
    .sort((left, right) => {
      if (left.exactFileNameMatch !== right.exactFileNameMatch) {
        return Number(right.exactFileNameMatch) - Number(left.exactFileNameMatch);
      }

      if (left.exactTextMatch !== right.exactTextMatch) {
        return Number(right.exactTextMatch) - Number(left.exactTextMatch);
      }

      if (left.tokenMatches !== right.tokenMatches) {
        return right.tokenMatches - left.tokenMatches;
      }

      if (left.scope !== right.scope && Math.abs(left.lexicalScore - right.lexicalScore) < 0.05) {
        return left.scope === "session" ? -1 : 1;
      }

      if (left.lexicalScore !== right.lexicalScore) {
        return right.lexicalScore - left.lexicalScore;
      }

      if (left.scope !== right.scope && Math.abs(left.semanticScore - right.semanticScore) < 0.05) {
        return left.scope === "session" ? -1 : 1;
      }

      return right.semanticScore - left.semanticScore;
    })
    .slice(0, limit)
    .map(({ result, semanticScore, lexicalScore }) => ({
      ...result,
      score: semanticScore > 0 ? semanticScore : lexicalScore,
    }));
}

export function toRagContextChunk(
  result: VectorQueryResult,
  documentById: Map<string, DocumentLike>,
  scope: Scope,
): RagContextChunk {
  const document = documentById.get(result.id.split(":")[0]!);

  return {
    id: result.id,
    score: result.score,
    text: (result.metadata?.text as string) ?? undefined,
    fileName: document?.fileName,
    url: document?.url,
    scope,
    metadata: result.metadata,
  };
}
