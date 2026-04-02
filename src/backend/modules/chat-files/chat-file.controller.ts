import type { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/backend/lib";

import { UploadChatDocumentRequestSchema } from "./chat-file.schema";
import type { ChatFileService } from "./chat-file.service";

export class ChatFileController {
  constructor(private readonly service: ChatFileService) {}

  async list(req: NextRequest, actorId: string): Promise<Response> {
    const chatId = req.nextUrl.searchParams.get("chatId");

    if (!chatId) {
      return errorResponse(400, "chatId is required", "VALIDATION_ERROR");
    }

    const documents = await this.service.list(chatId, actorId);
    return successResponse(200, documents);
  }

  async upload(req: NextRequest, actorId: string): Promise<Response> {
    const body = await req.json().catch(() => null);
    const parsed = UploadChatDocumentRequestSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(400, "Validation failed", "VALIDATION_ERROR", parsed.error.flatten());
    }

    const document = await this.service.upload({
      chatId: parsed.data.chatId,
      actorId,
      fileName: parsed.data.fileName,
      contentType: parsed.data.contentType,
      content: Buffer.from(parsed.data.contentBase64, "base64"),
    });

    return successResponse(201, document);
  }

  async delete(id: string, actorId: string): Promise<Response> {
    await this.service.delete(id, actorId);
    return successResponse(200, { id });
  }
}
