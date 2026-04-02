import type { NextRequest } from "next/server";

import { ensureBootstrap } from "@/backend/lib/bootstrap";
import type { SettingsController } from "@/backend/modules/settings";
import { withAuth, withErrorBoundary, withRateLimit, withRequestLog } from "@/backend/middleware";

export async function GET(req: NextRequest): Promise<Response> {
  return withErrorBoundary(async () => {
    const container = await ensureBootstrap();
    return withRequestLog(req, async () =>
      withRateLimit(req, async () =>
        withAuth(req, async () =>
          container.resolve<SettingsController>("SettingsController").getIntegrations(),
        ),
      ),
    );
  });
}
