import type { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/backend/lib";

import { ToggleDocumentContextSchema, UploadDocumentRequestSchema } from "./upload.schema";
import type { UploadService } from "./upload.service";

export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  async list(actorId: string): Promise<Response> {
    const documents = await this.uploadService.listDocuments(actorId);
    return successResponse(200, documents);
  }

  async upload(req: NextRequest, actorId: string): Promise<Response> {
    const body = await req.json().catch(() => null);
    const parsed = UploadDocumentRequestSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(400, "Validation failed", "VALIDATION_ERROR", parsed.error.flatten());
    }

    const document = await this.uploadService.uploadDocument({
      actorId,
      fileName: parsed.data.fileName,
      contentType: parsed.data.contentType,
      content: Buffer.from(parsed.data.contentBase64, "base64"),
    });

    return successResponse(201, document);
  }

  async delete(id: string, actorId: string): Promise<Response> {
    await this.uploadService.deleteDocument(id, actorId);

    return successResponse(200, { id });
  }

  async toggleContext(req: NextRequest, id: string, actorId: string): Promise<Response> {
    const body = await req.json().catch(() => null);
    const parsed = ToggleDocumentContextSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(400, "Validation failed", "VALIDATION_ERROR", parsed.error.flatten());
    }

    const document = await this.uploadService.toggleDocumentContext(id, parsed.data.inContext, actorId);

    if (!document) {
      return errorResponse(404, "Document not found", "NOT_FOUND");
    }

    return successResponse(200, document);
  }
}
