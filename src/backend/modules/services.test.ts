import { describe, expect, it, vi } from "vitest";

const { embedTextMock } = vi.hoisted(() => ({
  embedTextMock: vi.fn(),
}));

vi.mock("@/backend/lib/ai-gateway", () => ({
  embedText: embedTextMock,
  embedTexts: vi.fn(),
}));

import { AuditService } from "./audit";
import { AnalyticsService } from "./analytics";
import { AuthService } from "./auth";
import { CampaignService } from "./campaigns";
import { ChatService } from "./chat";
import { CustomerService } from "./customers";
import { MemoryService } from "./memory";
import { RagService } from "./rag";
import { UploadService } from "./uploads";

describe("service layer", () => {
  it("customer service delegates to repository and audit service", async () => {
    const repo = {
      findAll: vi.fn().mockResolvedValue({ items: [], pagination: { page: 1, pageSize: 10, total: 0, totalPages: 1 } }),
      findTopByRevenue: vi.fn().mockResolvedValue([]),
      findChurnRisk: vi.fn().mockResolvedValue([]),
      getLtvById: vi.fn().mockResolvedValue(null),
    };
    const audit = { log: vi.fn().mockResolvedValue(undefined) };
    const service = new CustomerService(repo as never, audit as never);

    await service.list({ page: 1, pageSize: 10 }, "actor");

    expect(repo.findAll).toHaveBeenCalled();
    expect(audit.log).toHaveBeenCalled();
  });

  it("customer service delegates LTV lookups to the repository", async () => {
    const repo = {
      findAll: vi.fn(),
      findTopByRevenue: vi.fn(),
      findChurnRisk: vi.fn(),
      getLtvById: vi.fn().mockResolvedValue(null),
    };
    const audit = { log: vi.fn().mockResolvedValue(undefined) };
    const service = new CustomerService(repo as never, audit as never);

    await service.getCustomerLtv("customer-1", "actor");

    expect(repo.getLtvById).toHaveBeenCalledWith("customer-1");
    expect(audit.log).toHaveBeenCalled();
  });

  it("campaign service delegates to repository, customer repository, and audit/email services", async () => {
    const campaignRepo = {
      create: vi.fn().mockResolvedValue({ id: "1" }),
      findAll: vi.fn().mockResolvedValue([]),
      findById: vi.fn().mockResolvedValue(null),
      updateStatus: vi.fn().mockResolvedValue(null),
      createLogs: vi.fn().mockResolvedValue(undefined),
    };
    const customerRepo = {
      findAll: vi.fn().mockResolvedValue({ items: [{ email: "a@example.com", segment: "general" }], pagination: { page: 1, pageSize: 1, total: 1, totalPages: 1 } }),
    };
    const email = { send: vi.fn().mockResolvedValue({ success: true, provider: "ses", messageIds: ["1"] }) };
    const audit = { log: vi.fn().mockResolvedValue(undefined) };
    const service = new CampaignService(campaignRepo as never, customerRepo as never, email as never, audit as never);

    await service.create({ name: "Campaign", subject: "Subj", message: "Body", segment: "general" }, "actor");

    expect(campaignRepo.create).toHaveBeenCalled();
    expect(audit.log).toHaveBeenCalled();
  });

  it("analytics service delegates to transaction repository and audit", async () => {
    const repo = { getSummary: vi.fn().mockResolvedValue({ kpis: [], revenueData: [], recentOrders: [] }) };
    const audit = { log: vi.fn().mockResolvedValue(undefined) };
    const service = new AnalyticsService(repo as never, audit as never);

    await service.getSummary("actor", 30);

    expect(repo.getSummary).toHaveBeenCalledWith(30);
    expect(audit.log).toHaveBeenCalled();
  });

  it("memory service delegates to repository methods", async () => {
    const repo = {
      findByUserId: vi.fn().mockResolvedValue(null),
      findRecentMessages: vi.fn().mockResolvedValue([]),
      findAllMessages: vi.fn().mockResolvedValue([]),
      appendMessage: vi.fn().mockResolvedValue(undefined),
      updateMemoryField: vi.fn().mockResolvedValue(undefined),
    };
    const service = new MemoryService(repo as never);

    await service.getMemory("actor");
    await service.getConversationContext("session");
    await service.appendMessage("session", { sessionId: "session", role: "user", content: "hi" });

    expect(repo.findByUserId).toHaveBeenCalled();
    expect(repo.findAllMessages).toHaveBeenCalled();
    expect(repo.appendMessage).toHaveBeenCalled();
  });

  it("audit service delegates to repository", async () => {
    const repo = { create: vi.fn().mockResolvedValue(undefined), findAll: vi.fn().mockResolvedValue({ items: [], pagination: { page: 1, pageSize: 10, total: 0, totalPages: 1 } }) };
    const service = new AuditService(repo as never);

    await service.log({ actorId: "actor", event: "test" });
    await service.query({ page: 1, pageSize: 10 });

    expect(repo.create).toHaveBeenCalled();
    expect(repo.findAll).toHaveBeenCalled();
  });

  it("upload service orchestrates adapters and repository", async () => {
    const documents = {
      create: vi.fn().mockResolvedValue({
        id: "doc-1",
        key: "key",
        url: "https://example.com/file",
        fileName: "doc.txt",
        actorId: "actor",
      }),
      findById: vi.fn().mockResolvedValue({ id: "doc-1", key: "key", actorId: "actor" }),
      findByActor: vi.fn().mockResolvedValue([]),
      findInContext: vi.fn().mockResolvedValue([]),
      findInContextByActor: vi.fn().mockResolvedValue([]),
      delete: vi.fn().mockResolvedValue(undefined),
      toggleContext: vi.fn().mockResolvedValue({ id: "doc-1", inContext: false }),
    };
    const storage = { upload: vi.fn().mockResolvedValue({ key: "key", url: "https://example.com/file" }), delete: vi.fn().mockResolvedValue(undefined) };
    const vector = {
      upsert: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      queryLexical: vi.fn().mockResolvedValue([]),
    };
    const ingestionService = {
      ingest: vi.fn().mockResolvedValue({
        chunks: [{ id: "doc-1:0", text: "hello", embedding: [0.1], metadata: { chunkIndex: 0, documentId: "doc-1", actorId: "actor" } }],
        result: { chunkCount: 1 },
      }),
    };
    const audit = { log: vi.fn().mockResolvedValue(undefined) };
    const service = new UploadService(documents as never, storage as never, vector as never, ingestionService as never, audit as never);

    await service.uploadDocument({
      actorId: "actor",
      fileName: "doc.txt",
      contentType: "text/plain",
      content: Buffer.from("hello world from looply"),
    });

    expect(storage.upload).toHaveBeenCalled();
    expect(ingestionService.ingest).toHaveBeenCalled();
    expect(vector.upsert).toHaveBeenCalled();
    expect(documents.create).toHaveBeenCalled();
    expect(vector.upsert).toHaveBeenCalledWith([
      expect.objectContaining({
        id: "doc-1:0",
        namespace: "actor",
      }),
    ]);
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({
      metadata: expect.objectContaining({
        extractionMethod: "utf8",
        readableTextDetected: true,
      }),
    }));
  });


  it("upload service enforces actor ownership for deletes and context changes", async () => {
    const documents = {
      create: vi.fn(),
      findById: vi.fn().mockResolvedValue({ id: "doc-1", key: "key", actorId: "owner" }),
      findByActor: vi.fn(),
      findInContext: vi.fn(),
      findInContextByActor: vi.fn(),
      delete: vi.fn(),
      toggleContext: vi.fn(),
    };
    const storage = { upload: vi.fn(), delete: vi.fn() };
    const vector = { upsert: vi.fn(), delete: vi.fn() };
    const ingestionService = { ingest: vi.fn() };
    const audit = { log: vi.fn() };
    const service = new UploadService(documents as never, storage as never, vector as never, ingestionService as never, audit as never);

    await expect(service.deleteDocument("doc-1", "other-actor")).rejects.toThrow("current actor");
    await expect(service.toggleDocumentContext("doc-1", false, "other-actor")).rejects.toThrow(
      "current actor",
    );

    expect(storage.delete).not.toHaveBeenCalled();
    expect(vector.delete).not.toHaveBeenCalled();
    expect(documents.toggleContext).not.toHaveBeenCalled();
  });

  it("rag service delegates to vector and document repository", async () => {
    const vector = {
      query: vi.fn().mockResolvedValue([{ id: "1", score: 0.9 }]),
      queryLexical: vi.fn().mockResolvedValue([]),
    };
    const documents = {
      findInContextByActor: vi.fn().mockResolvedValue([
        { id: "1", actorId: "actor", fileName: "doc.txt", url: "https://example.com/doc.txt" },
      ]),
    };
    const chatDocuments = {
      findByChatAndActor: vi.fn().mockResolvedValue([]),
    };
    const audit = { log: vi.fn().mockResolvedValue(undefined) };
    const cache = { get: vi.fn(), set: vi.fn(), delete: vi.fn(), invalidate: vi.fn() };
    const telemetry = { logTokenUsage: vi.fn(), logToolUsage: vi.fn() };
    const service = new RagService(vector as never, documents as never, chatDocuments as never, cache as never, audit as never, telemetry as never);

    const result = await service.retrieveContext("actor", [0.1], { limit: 5 });

    expect(documents.findInContextByActor).toHaveBeenCalledWith("actor");
    expect(vector.query).toHaveBeenCalled();
    expect(result).toEqual([
      expect.objectContaining({
        id: "1",
        fileName: "doc.txt",
      }),
    ]);
  });

  it("rag service can embed a query before retrieval", async () => {
    embedTextMock.mockResolvedValue([0.2]);
    const vector = {
      query: vi.fn().mockResolvedValue([]),
      queryLexical: vi.fn().mockResolvedValue([]),
    };
    const documents = {
      findInContextByActor: vi.fn().mockResolvedValue([{ id: "1", actorId: "actor" }]),
    };
    const chatDocuments = {
      findByChatAndActor: vi.fn().mockResolvedValue([]),
    };
    const audit = { log: vi.fn().mockResolvedValue(undefined) };
    const cache = { get: vi.fn(), set: vi.fn(), delete: vi.fn(), invalidate: vi.fn() };
    const telemetry = { logTokenUsage: vi.fn(), logToolUsage: vi.fn() };
    const service = new RagService(vector as never, documents as never, chatDocuments as never, cache as never, audit as never, telemetry as never);

    await service.retrieveContextForQuery("actor", "find policy", { limit: 3 });

    expect(embedTextMock).toHaveBeenCalledWith("find policy");
    expect(vector.query).toHaveBeenCalled();
    expect(vector.queryLexical).toHaveBeenCalledWith("actor", "find policy", 3);
  });

  it("chat service manages history and persistence through memory service", async () => {
    const memory = {
      getMemory: vi.fn().mockResolvedValue(null),
      getContextWindow: vi.fn().mockResolvedValue({
        messages: [
          { role: "user", content: "earlier", id: "1", sessionId: "session", createdAt: new Date() },
          { role: "assistant", content: "reply", id: "2", sessionId: "session", createdAt: new Date() },
          { role: "tool", content: "ignored", id: "3", sessionId: "session", createdAt: new Date() },
        ],
        compressedSummary: null,
        tokenCount: 10,
        droppedCount: 0,
      }),
      getContextWindowManager: vi.fn().mockReturnValue({
        compressSummary: vi.fn().mockResolvedValue(""),
      }),
      appendMessage: vi.fn().mockResolvedValue(undefined),
    };
    const rag = { retrieveContextForQuery: vi.fn().mockResolvedValue([]), formatContextForPrompt: vi.fn().mockReturnValue(null) };
    const service = new ChatService(memory as never, rag as never);

    const context = await service.buildSystemContext("actor", "session");
    expect(typeof context).toBe("string");
    expect(context).toContain("Looply AI");
    const history = await service.getConversationHistory("session");
    expect(history).toEqual([
      { role: "user", content: "earlier" },
      { role: "assistant", content: "reply" },
    ]);
    await service.appendUserMessage("session", "hi");
    await service.appendAssistantMessage("session", "hello");

    expect(memory.appendMessage).toHaveBeenNthCalledWith(
      1,
      "session",
      expect.objectContaining({ role: "user", content: "hi" }),
    );
    expect(memory.appendMessage).toHaveBeenNthCalledWith(
      2,
      "session",
      expect.objectContaining({ role: "assistant", content: "hello" }),
    );
  });

  it("auth service still works with injected dependencies", async () => {
    const repo = {
      findByEmail: vi.fn().mockResolvedValue(null),
      findById: vi.fn().mockResolvedValue(null),
    };
    const audit = { log: vi.fn().mockResolvedValue(undefined) };
    const service = new AuthService(repo as never, audit as never);

    await expect(
      service.login({
        email: "missing@example.com",
        password: "password123",
      }),
    ).rejects.toThrow();
  });
});
