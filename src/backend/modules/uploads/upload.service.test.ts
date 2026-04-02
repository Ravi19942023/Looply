import { beforeEach, describe, expect, it, vi } from "vitest";

const { mammothExtractRawTextMock } = vi.hoisted(() => ({
  mammothExtractRawTextMock: vi.fn(),
}));

vi.mock("mammoth", () => ({
  default: {
    extractRawText: mammothExtractRawTextMock,
  },
}));

import { UploadService } from "./upload.service";

describe("UploadService", () => {
  beforeEach(() => {
    mammothExtractRawTextMock.mockReset();
  });

  it("extracts DOCX content with mammoth before ingestion", async () => {
    mammothExtractRawTextMock.mockResolvedValue({
      value: "Carion Portal Setup Guide\nThis document explains publishing setup.",
    });
    const documents = {
      create: vi.fn().mockResolvedValue({
        id: "doc-1",
        key: "key",
        url: "https://example.com/file",
        fileName: "doc.docx",
        actorId: "actor",
      }),
      findById: vi.fn(),
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
        chunks: [{ id: "doc-1:0", text: "Carion Portal Setup Guide", embedding: [0.1], metadata: { chunkIndex: 0, documentId: "doc-1", actorId: "actor" } }],
        result: { chunkCount: 1 },
      }),
    };
    const audit = { log: vi.fn().mockResolvedValue(undefined) };
    const service = new UploadService(documents as never, storage as never, vector as never, ingestionService as never, audit as never);

    await service.uploadDocument({
      actorId: "actor",
      fileName: "doc.docx",
      contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      content: Buffer.from("fake-docx"),
    });

    expect(mammothExtractRawTextMock).toHaveBeenCalled();
    expect(ingestionService.ingest).toHaveBeenCalledWith(
      expect.stringContaining("Carion Portal Setup Guide"),
      expect.any(Object),
    );
  });

  it("cleans up the private blob upload if ingestion fails", async () => {
    const documents = {
      create: vi.fn(),
      findById: vi.fn(),
      findByActor: vi.fn().mockResolvedValue([]),
      findInContext: vi.fn().mockResolvedValue([]),
      findInContextByActor: vi.fn().mockResolvedValue([]),
      delete: vi.fn().mockResolvedValue(undefined),
      toggleContext: vi.fn().mockResolvedValue(null),
    };
    const storage = {
      upload: vi.fn().mockResolvedValue({ key: "documents/actor/doc.txt", url: "https://blob.example/doc.txt" }),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    const vector = {
      upsert: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      queryLexical: vi.fn().mockResolvedValue([]),
    };
    const ingestionService = {
      ingest: vi.fn().mockRejectedValue(new Error("embedding failed")),
    };
    const audit = { log: vi.fn().mockResolvedValue(undefined) };
    const service = new UploadService(documents as never, storage as never, vector as never, ingestionService as never, audit as never);

    await expect(service.uploadDocument({
      actorId: "actor",
      fileName: "doc.txt",
      contentType: "text/plain",
      content: Buffer.from("hello world from looply"),
    })).rejects.toThrow("Ingestion failed");

    expect(storage.delete).toHaveBeenCalledWith({
      key: "documents/actor/doc.txt",
      url: "https://blob.example/doc.txt",
    });
  });

  it("rejects unreadable extracted text", async () => {
    mammothExtractRawTextMock.mockResolvedValue({
      value: "PK\u0000\u0001\u0002",
    });
    const documents = {
      create: vi.fn(),
      findById: vi.fn(),
      findByActor: vi.fn().mockResolvedValue([]),
      findInContext: vi.fn().mockResolvedValue([]),
      findInContextByActor: vi.fn().mockResolvedValue([]),
      delete: vi.fn().mockResolvedValue(undefined),
      toggleContext: vi.fn().mockResolvedValue(null),
    };
    const storage = { upload: vi.fn().mockResolvedValue({ key: "key", url: "https://example.com/file" }), delete: vi.fn().mockResolvedValue(undefined) };
    const vector = {
      upsert: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      queryLexical: vi.fn().mockResolvedValue([]),
    };
    const ingestionService = { ingest: vi.fn() };
    const audit = { log: vi.fn().mockResolvedValue(undefined) };
    const service = new UploadService(documents as never, storage as never, vector as never, ingestionService as never, audit as never);

    await expect(service.uploadDocument({
      actorId: "actor",
      fileName: "doc.docx",
      contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      content: Buffer.from("fake-docx"),
    })).rejects.toThrow("empty or unreadable");

    expect(ingestionService.ingest).not.toHaveBeenCalled();
  });
});
