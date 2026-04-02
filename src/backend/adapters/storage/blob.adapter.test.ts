import { describe, expect, it, vi } from "vitest";

const { delMock, putMock } = vi.hoisted(() => ({
  putMock: vi.fn(),
  delMock: vi.fn(),
}));

vi.mock("@vercel/blob", () => ({
  put: putMock,
  del: delMock,
}));

import { BlobAdapter } from "./blob.adapter";

describe("BlobAdapter", () => {
  it("uploads to private Vercel Blob storage", async () => {
    putMock.mockResolvedValue({
      pathname: "documents/actor/doc.txt",
      url: "https://blob.vercel-storage.com/doc.txt",
    });

    const adapter = new BlobAdapter();
    const result = await adapter.upload({
      key: "documents/actor/doc.txt",
      body: Buffer.from("hello"),
      contentType: "text/plain",
    });

    expect(putMock).toHaveBeenCalledWith(
      "documents/actor/doc.txt",
      expect.any(Buffer),
      expect.objectContaining({
        access: "private",
        contentType: "text/plain",
      }),
    );
    expect(result).toEqual({
      key: "documents/actor/doc.txt",
      url: "https://blob.vercel-storage.com/doc.txt",
    });
  });

  it("deletes blobs using the stored blob URL", async () => {
    delMock.mockResolvedValue(undefined);

    const adapter = new BlobAdapter();
    await adapter.delete({
      key: "documents/actor/doc.txt",
      url: "https://blob.vercel-storage.com/doc.txt",
    });

    expect(delMock).toHaveBeenCalledWith(
      "https://blob.vercel-storage.com/doc.txt",
      expect.any(Object),
    );
  });
});
