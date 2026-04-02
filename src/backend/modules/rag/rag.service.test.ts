import { describe, expect, it, vi } from "vitest";

const { embedTextMock } = vi.hoisted(() => ({
  embedTextMock: vi.fn(),
}));

vi.mock("@/backend/lib/ai-gateway", () => ({
  embedText: embedTextMock,
}));

import { RagService } from "./rag.service";

describe("RagService", () => {
  it("returns exact lexical matches for entity questions even when semantic scores are weak", async () => {
    embedTextMock.mockResolvedValue([0.1, 0.2]);
    const vector = {
      query: vi.fn().mockResolvedValue([
        {
          id: "carnation:0",
          score: 0.26,
          metadata: { text: "Project Carnation overview", fileName: "carnation.txt" },
          retrievalMode: "semantic",
        },
        {
          id: "carion:0",
          score: 0.19,
          metadata: {
            text: "Carion Portal - Facebook & Instagram Publishing Setup Guide",
            fileName: "Carion_Portal_Meta_Publishing_Setup_Guide.pdf",
          },
          retrievalMode: "semantic",
        },
      ]),
      queryLexical: vi.fn().mockResolvedValue([
        {
          id: "carion:0",
          score: 0.95,
          metadata: {
            text: "Carion Portal - Facebook & Instagram Publishing Setup Guide",
            fileName: "Carion_Portal_Meta_Publishing_Setup_Guide.pdf",
          },
          retrievalMode: "lexical",
          lexical: {
            exactFileNameMatch: false,
            exactTextMatch: true,
            tokenMatches: 2,
            tokenCoverage: 1,
          },
        },
      ]),
    };
    const documents = {
      findInContextByActor: vi.fn().mockResolvedValue([
        {
          id: "carion",
          actorId: "actor",
          fileName: "Carion_Portal_Meta_Publishing_Setup_Guide.pdf",
          url: "https://example.com/carion",
        },
        {
          id: "carnation",
          actorId: "actor",
          fileName: "carnation.txt",
          url: "https://example.com/carnation",
        },
      ]),
    };
    const chatDocuments = {
      findByChatAndActor: vi.fn().mockResolvedValue([]),
    };
    const cache = { get: vi.fn().mockResolvedValue(null), set: vi.fn().mockResolvedValue(undefined), delete: vi.fn().mockResolvedValue(undefined), invalidate: vi.fn().mockResolvedValue(undefined) };
    const audit = { log: vi.fn().mockResolvedValue(undefined) };
    const telemetry = { logTokenUsage: vi.fn().mockResolvedValue(undefined), logToolUsage: vi.fn().mockResolvedValue(undefined), logArtifactUpdate: vi.fn().mockResolvedValue(undefined) };
    const service = new RagService(vector as never, documents as never, chatDocuments as never, cache as never, audit as never, telemetry as never);

    const results = await service.retrieveContextForQuery("actor", "what is carion", { limit: 5 });

    expect(results[0]).toEqual(expect.objectContaining({
      id: "carion:0",
      fileName: "Carion_Portal_Meta_Publishing_Setup_Guide.pdf",
    }));
    expect(results.some((result) => result.id === "carnation:0")).toBe(true);
  });

  it("dedupes semantic and lexical results and excludes out-of-context documents", async () => {
    embedTextMock.mockResolvedValue([0.1, 0.2]);
    const vector = {
      query: vi.fn().mockResolvedValue([
        {
          id: "carion:0",
          score: 0.35,
          metadata: { text: "Carion Portal setup", fileName: "carion.pdf" },
          retrievalMode: "semantic",
        },
        {
          id: "hidden:0",
          score: 0.42,
          metadata: { text: "Hidden guide", fileName: "hidden.pdf" },
          retrievalMode: "semantic",
        },
      ]),
      queryLexical: vi.fn().mockResolvedValue([
        {
          id: "carion:0",
          score: 0.95,
          metadata: { text: "Carion Portal setup", fileName: "carion.pdf" },
          retrievalMode: "lexical",
          lexical: {
            exactFileNameMatch: false,
            exactTextMatch: true,
            tokenMatches: 2,
            tokenCoverage: 1,
          },
        },
        {
          id: "hidden:0",
          score: 1,
          metadata: { text: "Hidden guide", fileName: "hidden.pdf" },
          retrievalMode: "lexical",
          lexical: {
            exactFileNameMatch: true,
            exactTextMatch: true,
            tokenMatches: 2,
            tokenCoverage: 1,
          },
        },
      ]),
    };
    const documents = {
      findInContextByActor: vi.fn().mockResolvedValue([
        {
          id: "carion",
          actorId: "actor",
          fileName: "carion.pdf",
          url: "https://example.com/carion",
        },
      ]),
    };
    const chatDocuments = {
      findByChatAndActor: vi.fn().mockResolvedValue([]),
    };
    const cache = { get: vi.fn().mockResolvedValue(null), set: vi.fn().mockResolvedValue(undefined), delete: vi.fn().mockResolvedValue(undefined), invalidate: vi.fn().mockResolvedValue(undefined) };
    const audit = { log: vi.fn().mockResolvedValue(undefined) };
    const telemetry = { logTokenUsage: vi.fn().mockResolvedValue(undefined), logToolUsage: vi.fn().mockResolvedValue(undefined), logArtifactUpdate: vi.fn().mockResolvedValue(undefined) };
    const service = new RagService(vector as never, documents as never, chatDocuments as never, cache as never, audit as never, telemetry as never);

    const results = await service.retrieveContextForQuery("actor", "carion portal", { limit: 5 });

    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe("carion:0");
  });

  it("merges session-scoped and global results and preserves session scope metadata", async () => {
    embedTextMock.mockResolvedValue([0.1, 0.2]);
    const vector = {
      query: vi
        .fn()
        .mockResolvedValueOnce([
          {
            id: "global:0",
            score: 0.74,
            metadata: { text: "Global policy text", fileName: "policy.pdf" },
            retrievalMode: "semantic",
          },
        ])
        .mockResolvedValueOnce([
          {
            id: "session:0",
            score: 0.72,
            metadata: { text: "Session playbook text", fileName: "playbook.md" },
            retrievalMode: "semantic",
          },
        ]),
      queryLexical: vi
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]),
    };
    const documents = {
      findInContextByActor: vi.fn().mockResolvedValue([
        {
          id: "global",
          actorId: "actor",
          fileName: "policy.pdf",
          url: "https://example.com/policy",
        },
      ]),
    };
    const chatDocuments = {
      findByChatAndActor: vi.fn().mockResolvedValue([
        {
          id: "session",
          actorId: "actor",
          chatId: "chat-1",
          fileName: "playbook.md",
          url: "https://example.com/playbook",
        },
      ]),
    };
    const cache = { get: vi.fn().mockResolvedValue(null), set: vi.fn().mockResolvedValue(undefined), delete: vi.fn().mockResolvedValue(undefined), invalidate: vi.fn().mockResolvedValue(undefined) };
    const audit = { log: vi.fn().mockResolvedValue(undefined) };
    const telemetry = { logTokenUsage: vi.fn().mockResolvedValue(undefined), logToolUsage: vi.fn().mockResolvedValue(undefined), logArtifactUpdate: vi.fn().mockResolvedValue(undefined) };
    const service = new RagService(vector as never, documents as never, chatDocuments as never, cache as never, audit as never, telemetry as never);

    const results = await service.retrieveContextForQuery("actor", "playbook", { limit: 5, chatId: "chat-1" });

    expect(results).toHaveLength(2);
    expect(results[0]).toEqual(expect.objectContaining({
      fileName: "playbook.md",
      scope: "session",
    }));
    expect(results[1]).toEqual(expect.objectContaining({
      fileName: "policy.pdf",
      scope: "global",
    }));
  });
});
