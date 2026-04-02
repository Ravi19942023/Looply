import type { NextRequest } from "next/server";

import { withAuth, withErrorBoundary, withRequestLog } from "@/backend/middleware";
import { ChatbotError } from "@/lib/errors";
import { convertToUIMessages } from "@/lib/utils";
import { deleteMessagesByChatIdAfterTimestamp, getChatById, getMessageById, getMessagesByChatId } from "@/lib/db/queries";

export async function GET(req: NextRequest): Promise<Response> {
  return withErrorBoundary(async () =>
    withRequestLog(req, async () =>
      withAuth(req, async (actorId) => {
        const chatId = req.nextUrl.searchParams.get("chatId");

        if (!chatId) {
          return new ChatbotError("bad_request:api", "chatId is required.").toResponse();
        }

        const [chat, messages] = await Promise.all([
          getChatById({ id: chatId }),
          getMessagesByChatId({ id: chatId }),
        ]);

        if (!chat || chat.actorId !== actorId) {
          return new ChatbotError("not_found:chat").toResponse();
        }

        return Response.json({
          messages: convertToUIMessages(messages),
          title: chat.title,
        });
      }),
    ),
  );
}

export async function DELETE(req: NextRequest): Promise<Response> {
  return withErrorBoundary(async () =>
    withRequestLog(req, async () =>
      withAuth(req, async (actorId) => {
        const messageId = req.nextUrl.searchParams.get("messageId");

        if (!messageId) {
          return new ChatbotError("bad_request:api", "messageId is required.").toResponse();
        }

        const [message] = await getMessageById({ id: messageId });

        if (!message) {
          return new ChatbotError("not_found:chat").toResponse();
        }

        const chat = await getChatById({ id: message.chatId });

        if (!chat || chat.actorId !== actorId) {
          return new ChatbotError("forbidden:chat").toResponse();
        }

        await deleteMessagesByChatIdAfterTimestamp({
          chatId: message.chatId,
          timestamp: message.createdAt,
        });

        return Response.json({ ok: true }, { status: 200 });
      }),
    ),
  );
}
