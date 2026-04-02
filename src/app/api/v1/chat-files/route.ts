import type { NextRequest } from "next/server";

import { ensureBootstrap } from "@/backend/lib/bootstrap";
import type { ChatFileController } from "@/backend/modules/chat-files";
import { withAuth, withErrorBoundary, withRateLimit, withRequestLog } from "@/backend/middleware";

export async function GET(req: NextRequest): Promise<Response> {
  return withErrorBoundary(async () => {
    const container = await ensureBootstrap();
    return withRequestLog(req, async () =>
      withRateLimit(req, async () =>
        withAuth(req, async (actorId) =>
          container.resolve<ChatFileController>("ChatFileController").list(req, actorId),
        ),
      ),
    );
  });
}

export async function POST(req: NextRequest): Promise<Response> {
  return withErrorBoundary(async () => {
    const container = await ensureBootstrap();
    return withRequestLog(req, async () =>
      withRateLimit(req, async () =>
        withAuth(req, async (actorId) =>
          container.resolve<ChatFileController>("ChatFileController").upload(req, actorId),
        ),
      ),
    );
  });
}
