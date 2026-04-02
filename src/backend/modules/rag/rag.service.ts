import type { VectorQueryResult } from "@/backend/adapters/vector";
import type { IVectorAdapter } from "@/backend/adapters/vector";
import { embedText } from "@/backend/lib/ai-gateway";
import { INGESTION_CONFIG } from "./ingestion.constants";
import type { IAuditService } from "@/backend/modules/audit";
import { AUDIT_EVENTS } from "@/backend/modules/audit";
import { ICacheService } from "@/backend/lib/redis";
import type { IChatDocumentRepository } from "@/backend/modules/chat-files";
import type { IDocumentRepository } from "@/backend/modules/uploads";

import { DEFAULT_MIN_SCORE, DEFAULT_RAG_LIMIT } from "./rag.constants";
import { type DocumentLike, mergeRagMatches, toRagContextChunk } from "./rag.merge";
import type { RagContextChunk, RagRetrievalOptions } from "./rag.types";

import type { TelemetryService } from "@/backend/modules/telemetry";

export class RagService {
  constructor(
    private readonly vectorAdapter: IVectorAdapter,
    private readonly documentRepository: IDocumentRepository,
    private readonly chatDocumentRepository: IChatDocumentRepository,
    private readonly cacheService: ICacheService,
    private readonly auditService: IAuditService,
    private readonly telemetryService: TelemetryService,
  ) { }

  async retrieveContext(
    actorId: string,
    embedding: number[],
    options: RagRetrievalOptions = {},
  ): Promise<RagContextChunk[]> {
    const limit = options.limit ?? DEFAULT_RAG_LIMIT;
    const minScore = options.minScore ?? DEFAULT_MIN_SCORE;

    const { merged, stats } = await this.retrieveMergedMatches(actorId, embedding, {
      limit,
      minScore,
      chatId: options.chatId,
      query: null,
    });

    await this.auditService.log({
      actorId,
      event: AUDIT_EVENTS.RAG_CONTEXT_RETRIEVED,
      metadata: {
        type: options.chatId ? "rag.retrieve.merged" : "rag.retrieve",
        limit,
        minScore,
        matchedResults: merged.length,
        semanticCandidates: stats.semanticCandidates,
        lexicalCandidates: stats.lexicalCandidates,
        topSemanticScore: stats.topSemanticScore,
        chatId: options.chatId ?? null,
      },
    });

    return merged;
  }

  async retrieveContextForQuery(
    actorId: string,
    query: string,
    options: RagRetrievalOptions = {},
  ): Promise<RagContextChunk[]> {
    const limit = options.limit ?? DEFAULT_RAG_LIMIT;
    const minScore = options.minScore ?? DEFAULT_MIN_SCORE;
    const { embedding, usage } = await embedText(query);

    if (usage && options.chatId) {
      this.telemetryService.logTokenUsage({
        actorId,
        chatId: options.chatId,
        source: "rag:embed",
        model: INGESTION_CONFIG.EMBEDDING_MODEL,
        promptTokens: usage.tokens,
        completionTokens: 0,
        totalTokens: usage.tokens,
      }).catch(console.error);
    }

    const { merged, stats } = await this.retrieveMergedMatches(actorId, embedding, {
      limit,
      minScore,
      chatId: options.chatId,
      query,
    });

    await this.auditService.log({
      actorId,
      event: AUDIT_EVENTS.RAG_CONTEXT_RETRIEVED,
      metadata: {
        type: options.chatId ? "rag.retrieve.hybrid.merged" : "rag.retrieve.hybrid",
        limit,
        minScore,
        matchedResults: merged.length,
        semanticCandidates: stats.semanticCandidates,
        lexicalCandidates: stats.lexicalCandidates,
        topSemanticScore: stats.topSemanticScore,
        chatId: options.chatId ?? null,
      },
    });

    return merged;
  }

  formatContextForPrompt(chunks: RagContextChunk[]): string | null {
    if (chunks.length === 0) {
      return null;
    }

    const bySource = new Map<string, RagContextChunk[]>();

    for (const chunk of chunks) {
      const scopeLabel = chunk.scope === "session" ? "Session file" : "Knowledge base";
      const key = `${scopeLabel}::${chunk.fileName ?? "Unknown document"}`;
      const existing = bySource.get(key) ?? [];
      existing.push(chunk);
      bySource.set(key, existing);
    }

    const sections: string[] = [];

    for (const [compositeKey, fileChunks] of bySource) {
      const [scopeLabel, fileName] = compositeKey.split("::");
      const excerpts = fileChunks
        .map((chunk) => {
          const text = chunk.text ?? "[no text available]";
          const score = (chunk.score * 100).toFixed(0);
          return `> (relevance: ${score}%)\n> ${text}`;
        })
        .join("\n>\n");

      sections.push(`### Source: ${fileName} (${scopeLabel})\n${excerpts}`);
    }

    return sections.join("\n\n");
  }

  private async retrieveMergedMatches(
    actorId: string,
    embedding: number[],
    params: {
      limit: number;
      minScore: number;
      chatId?: string;
      query: string | null;
    },
  ): Promise<{
    merged: RagContextChunk[];
    stats: {
      semanticCandidates: number;
      lexicalCandidates: number;
      topSemanticScore: number | null;
    };
  }> {
    const globalDocs = await this.documentRepository.findInContextByActor(actorId);
    const sessionDocs = params.chatId
      ? await this.chatDocumentRepository.findByChatAndActor(params.chatId, actorId)
      : [];

    const globalMap = new Map<string, DocumentLike>(globalDocs.map((document) => [document.id, document]));
    const sessionMap = new Map<string, DocumentLike>(sessionDocs.map((document) => [document.id, document]));

    const [globalSemantic, sessionSemantic] = await Promise.all([
      this.getSemanticMatches(actorId, embedding, globalMap, {
        limit: params.limit,
        minScore: params.minScore,
        scope: "global",
      }),
      params.chatId
        ? this.getSemanticMatches(`chat:${params.chatId}`, embedding, sessionMap, {
          limit: params.limit,
          minScore: params.minScore,
          scope: "session",
        })
        : Promise.resolve({ results: [], rawCount: 0, topScore: null }),
    ]);

    const [globalLexical, sessionLexical] = params.query
      ? await Promise.all([
        this.getLexicalMatches(actorId, params.query, globalMap, params.limit, "global"),
        params.chatId
          ? this.getLexicalMatches(`chat:${params.chatId}`, params.query, sessionMap, params.limit, "session")
          : Promise.resolve([]),
      ])
      : [[], []];

    const enrichedResults = await Promise.all(
      mergeRagMatches(
        [...globalSemantic.results, ...sessionSemantic.results],
        [...globalLexical, ...sessionLexical],
        params.limit,
      ).map(async (result) => {
        const scope = (result.metadata?.scope as "global" | "session" | undefined) ?? "global";
        const documentId = result.id.split(":")[0]!;
        const chunkIndex = parseInt(result.id.split(":")[1] ?? "0");
        const documentMap = scope === "session" ? sessionMap : globalMap;

        let text = result.metadata?.text as string | undefined;

        // Try to fetch from Redis for session files to optimize memory/speed
        if (scope === "session" && params.chatId) {
          const cacheKey = `sess:doc:${params.chatId}:${documentId}`;
          const cachedChunks = await this.cacheService.get<string[]>(cacheKey);
          if (cachedChunks && cachedChunks[chunkIndex]) {
            text = cachedChunks[chunkIndex];
          }
        }

        const chunk = toRagContextChunk(result, documentMap, scope);
        if (text) {
          chunk.text = text;
        }
        return chunk;
      }),
    );

    return {
      merged: enrichedResults,
      stats: {
        semanticCandidates: globalSemantic.rawCount + sessionSemantic.rawCount,
        lexicalCandidates: globalLexical.length + sessionLexical.length,
        topSemanticScore: [globalSemantic.topScore, sessionSemantic.topScore]
          .filter((score): score is number => score !== null)
          .sort((left, right) => right - left)[0] ?? null,
      },
    };
  }

  private async getSemanticMatches(
    namespace: string,
    embedding: number[],
    documentById: Map<string, DocumentLike>,
    options: {
      limit: number;
      minScore: number;
      scope: "global" | "session";
    },
  ): Promise<{ results: VectorQueryResult[]; rawCount: number; topScore: number | null }> {
    if (documentById.size === 0) {
      return { results: [], rawCount: 0, topScore: null };
    }

    const fetchLimit = Math.max(options.limit * 4, 20);
    const results = await this.vectorAdapter.query(namespace, embedding, fetchLimit);
    const topScore = results[0]?.score ?? null;
    const matchedResults = results
      .filter((result) => {
        const documentId = result.id.split(":")[0]!;
        return result.score >= options.minScore && documentById.has(documentId);
      })
      .map((result) => ({
        ...result,
        metadata: {
          ...(result.metadata ?? {}),
          scope: options.scope,
        },
      }));

    return {
      results: matchedResults,
      rawCount: results.length,
      topScore,
    };
  }

  private async getLexicalMatches(
    namespace: string,
    query: string,
    documentById: Map<string, DocumentLike>,
    limit: number,
    scope: "global" | "session",
  ): Promise<VectorQueryResult[]> {
    if (documentById.size === 0) {
      return [];
    }

    return (await this.vectorAdapter.queryLexical(namespace, query, limit))
      .filter((result) => documentById.has(result.id.split(":")[0]!))
      .map((result) => ({
        ...result,
        metadata: {
          ...(result.metadata ?? {}),
          scope,
        },
      }));
  }

}
