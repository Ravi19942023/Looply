import type { NextRequest } from "next/server";

import { withAuth, withErrorBoundary, withRequestLog } from "@/backend/middleware";
import { deleteAllChatsByUserId, getChatsByUserId } from "@/lib/db/queries";

export async function GET(req: NextRequest): Promise<Response> {
  return withErrorBoundary(async () =>
    withRequestLog(req, async () =>
      withAuth(req, async (actorId) => {
        const limit = Math.min(Math.max(Number.parseInt(req.nextUrl.searchParams.get("limit") || "20", 10), 1), 50);
        const startingAfter = req.nextUrl.searchParams.get("starting_after");
        const endingBefore = req.nextUrl.searchParams.get("ending_before");

        const result = await getChatsByUserId({
          actorId,
          limit,
          startingAfter,
          endingBefore,
        });

        return Response.json(result);
      }),
    ),
  );
}

export async function DELETE(req: NextRequest): Promise<Response> {
  return withErrorBoundary(async () =>
    withRequestLog(req, async () =>
      withAuth(req, async (actorId) => {
        const result = await deleteAllChatsByUserId({ actorId });
        return Response.json(result, { status: 200 });
      }),
    ),
  );
}
