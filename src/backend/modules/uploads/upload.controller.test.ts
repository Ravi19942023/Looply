import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

import { UploadController } from "./upload.controller";

describe("UploadController", () => {
  it("validates upload payloads", async () => {
    const controller = new UploadController({
      uploadDocument: vi.fn(),
      listDocuments: vi.fn(),
      deleteDocument: vi.fn(),
    } as never);

    const request = new NextRequest("http://localhost/api/v1/uploads", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await controller.upload(request, "actor-1");

    expect(response.status).toBe(400);
  });

  it("decodes base64 payloads before delegating to the service", async () => {
    const uploadDocument = vi.fn().mockResolvedValue({ id: "doc-1" });
    const controller = new UploadController({
      uploadDocument,
      listDocuments: vi.fn(),
      deleteDocument: vi.fn(),
    } as never);

    const request = new NextRequest("http://localhost/api/v1/uploads", {
      method: "POST",
      body: JSON.stringify({
        fileName: "doc.txt",
        contentType: "text/plain",
        contentBase64: Buffer.from("hello").toString("base64"),
      }),
    });

    const response = await controller.upload(request, "actor-1");

    expect(response.status).toBe(201);
    expect(uploadDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: "actor-1",
        fileName: "doc.txt",
        contentType: "text/plain",
        content: Buffer.from("hello"),
      }),
    );
  });

  it("delegates delete through the authenticated actor path", async () => {
    const deleteDocument = vi.fn().mockResolvedValue(undefined);
    const controller = new UploadController({
      uploadDocument: vi.fn(),
      listDocuments: vi.fn(),
      deleteDocument,
    } as never);

    const response = await controller.delete("doc-1", "admin-1");

    expect(response.status).toBe(200);
    expect(deleteDocument).toHaveBeenCalledWith("doc-1", "admin-1");
  });
});
