import type { NextRequest } from "next/server";

import { ensureBootstrap } from "@/backend/lib/bootstrap";
import type { ChatFileController } from "@/backend/modules/chat-files";
import { withAuth, withErrorBoundary, withRateLimit, withRequestLog } from "@/backend/middleware";

export async function DELETE(
  req: NextRequest,
  context: Readonly<{ params: Promise<{ id: string }> }>,
): Promise<Response> {
  return withErrorBoundary(async () => {
    const { id } = await context.params;
    const container = await ensureBootstrap();
    return withRequestLog(req, async () =>
      withRateLimit(req, async () =>
        withAuth(req, async (actorId) =>
          container.resolve<ChatFileController>("ChatFileController").delete(id, actorId),
        ),
      ),
    );
  });
}
