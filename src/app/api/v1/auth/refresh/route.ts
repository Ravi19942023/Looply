import type { NextRequest } from "next/server";

import { ensureBootstrap } from "@/backend/lib/bootstrap";
import { withErrorBoundary, withRateLimit, withRequestLog } from "@/backend/middleware";
import type { AuthController } from "@/backend/modules/auth";

export async function POST(req: NextRequest): Promise<Response> {
  return withErrorBoundary(async () => {
    const container = await ensureBootstrap();
    return withRequestLog(req, async () =>
      withRateLimit(req, async () =>
        container.resolve<AuthController>("AuthController").refresh(req),
      ),
    );
  });
}
