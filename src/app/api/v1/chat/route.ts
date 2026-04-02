import type { NextRequest } from "next/server";

import { withAuth, withErrorBoundary, withRateLimit, withRequestLog } from "@/backend/middleware";
import { chatSubmitSchema } from "@/backend/modules/chat/chat-ui.schema";
import { streamUiChat } from "@/backend/modules/chat/chat-ui.service";
import { ChatbotError } from "@/lib/errors";
import { deleteChatById, getChatById } from "@/lib/db/queries";

export async function POST(req: NextRequest): Promise<Response> {
  return withErrorBoundary(async () => {
    return withRequestLog(req, async () =>
      withRateLimit(req, async () =>
        withAuth(req, async (actorId) => {
          const body = await req.json().catch(() => null);
          const parsed = chatSubmitSchema.safeParse(body);

          if (!parsed.success) {
            return new ChatbotError("bad_request:chat", "Invalid chat payload.").toResponse();
          }

          return streamUiChat({
            actorId,
            chatId: parsed.data.id,
            messages: parsed.data.messages as unknown as import("@/lib/types").ChatMessage[],
          });
        }),
      ),
    );
  });
}

export async function DELETE(req: NextRequest): Promise<Response> {
  return withErrorBoundary(async () =>
    withRequestLog(req, async () =>
      withAuth(req, async (actorId) => {
        const id = req.nextUrl.searchParams.get("id");

        if (!id) {
          return new ChatbotError("bad_request:api", "Chat id is required.").toResponse();
        }

        const chat = await getChatById({ id });

        if (!chat || chat.actorId !== actorId) {
          return new ChatbotError("not_found:chat").toResponse();
        }

        const deleted = await deleteChatById({ id });
        return Response.json(deleted, { status: 200 });
      }),
    ),
  );
}
