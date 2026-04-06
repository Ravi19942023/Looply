import type { NextRequest } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { canDeleteAllChats } from "@/lib/auth/permissions";
import {
  createAuditLog,
  deleteAllChatsByUserId,
  getChatsByUserId,
} from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const limit = Math.min(
    Math.max(Number.parseInt(searchParams.get("limit") || "10", 10), 1),
    50
  );
  const startingAfter = searchParams.get("starting_after");
  const endingBefore = searchParams.get("ending_before");

  if (startingAfter && endingBefore) {
    return new ChatbotError(
      "bad_request:api",
      "Only one of starting_after or ending_before can be provided."
    ).toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }

  const chats = await getChatsByUserId({
    id: session.user.id,
    limit,
    startingAfter,
    endingBefore,
  });

  return Response.json(chats);
}

export async function DELETE() {
  const session = await auth();

  if (!session?.user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }

  if (!canDeleteAllChats(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await deleteAllChatsByUserId({ userId: session.user.id });
  await createAuditLog({
    actorId: session.user.id,
    event: "chat.delete_all",
    resourceType: "chat",
    metadata: {
      deletedCount: result.deletedCount,
    },
  });

  return Response.json(result, { status: 200 });
}
