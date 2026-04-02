import type { NextRequest } from "next/server";

import { ensureBootstrap } from "@/backend/lib/bootstrap";
import { withAuth, withErrorBoundary, withRateLimit, withRequestLog } from "@/backend/middleware";
import type { UploadController } from "@/backend/modules/uploads";

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
          container.resolve<UploadController>("UploadController").delete(id, actorId),
        ),
      ),
    );
  });
}

export async function PATCH(
  req: NextRequest,
  context: Readonly<{ params: Promise<{ id: string }> }>,
): Promise<Response> {
  return withErrorBoundary(async () => {
    const { id } = await context.params;
    const container = await ensureBootstrap();
    return withRequestLog(req, async () =>
      withRateLimit(req, async () =>
        withAuth(req, async (actorId) =>
          container.resolve<UploadController>("UploadController").toggleContext(req, id, actorId),
        ),
      ),
    );
  });
}
