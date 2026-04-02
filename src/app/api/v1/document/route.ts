import type { NextRequest } from "next/server";

import { artifactUpdateSchema } from "@/backend/modules/chat/chat-ui.schema";
import { withAuth, withErrorBoundary, withRequestLog } from "@/backend/middleware";
import { ChatbotError } from "@/lib/errors";
import { deleteDocumentsByIdAfterTimestamp, getArtifactById, getDocumentById, getDocumentsById, getLatestArtifactByChatId, saveDocument } from "@/lib/db/queries";

export async function GET(req: NextRequest): Promise<Response> {
  return withErrorBoundary(async () =>
    withRequestLog(req, async () =>
      withAuth(req, async (actorId) => {
        const id = req.nextUrl.searchParams.get("id");
        const chatId = req.nextUrl.searchParams.get("chatId");

        if (chatId) {
          const artifact = await getLatestArtifactByChatId({ chatId });

          if (!artifact || artifact.actorId !== actorId) {
            return Response.json({ artifact: null, versions: [] });
          }

          const versions = await getDocumentsById({ id: artifact.id });

          return Response.json({
            artifact: {
              id: artifact.id,
              title: artifact.title,
              kind: artifact.kind,
            },
            versions,
          });
        }

        if (!id) {
          return new ChatbotError("bad_request:api", "Document id is required.").toResponse();
        }

        const documents = await getDocumentsById({ id });
        const latest = documents.at(-1);

        if (!latest || latest.userId !== actorId) {
          return new ChatbotError("not_found:document").toResponse();
        }

        return Response.json(documents);
      }),
    ),
  );
}

export async function POST(req: NextRequest): Promise<Response> {
  return withErrorBoundary(async () =>
    withRequestLog(req, async () =>
      withAuth(req, async (actorId) => {
        const id = req.nextUrl.searchParams.get("id");

        if (!id) {
          return new ChatbotError("bad_request:api", "Document id is required.").toResponse();
        }

        const [existing, artifact] = await Promise.all([getDocumentById({ id }), getArtifactById({ id })]);
        if (!existing || !artifact || existing.userId !== actorId) {
          return new ChatbotError("not_found:document").toResponse();
        }

        const body = await req.json().catch(() => null);
        const parsed = artifactUpdateSchema.safeParse(body);

        if (!parsed.success) {
          return new ChatbotError("bad_request:document", "Invalid artifact payload.").toResponse();
        }

        await saveDocument({
          id,
          chatId: artifact.chatId,
          userId: actorId,
          title: parsed.data.title,
          kind: parsed.data.kind,
          content: parsed.data.content,
        });

        const documents = await getDocumentsById({ id });
        return Response.json(documents, { status: 200 });
      }),
    ),
  );
}

export async function DELETE(req: NextRequest): Promise<Response> {
  return withErrorBoundary(async () =>
    withRequestLog(req, async () =>
      withAuth(req, async (actorId) => {
        const id = req.nextUrl.searchParams.get("id");
        const timestamp = req.nextUrl.searchParams.get("timestamp");

        if (!id || !timestamp) {
          return new ChatbotError("bad_request:api", "Document id and timestamp are required.").toResponse();
        }

        const existing = await getDocumentById({ id });
        if (!existing || existing.userId !== actorId) {
          return new ChatbotError("not_found:document").toResponse();
        }

        await deleteDocumentsByIdAfterTimestamp({
          id,
          timestamp: new Date(timestamp),
        });

        return Response.json({ ok: true }, { status: 200 });
      }),
    ),
  );
}
