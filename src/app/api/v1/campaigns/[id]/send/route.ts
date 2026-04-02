import type { NextRequest } from "next/server";

import { ROLES } from "@/shared/constants";
import { ensureBootstrap } from "@/backend/lib/bootstrap";
import type { CampaignController } from "@/backend/modules/campaigns";
import { withGuard } from "@/backend/guards";
import { withAuth, withErrorBoundary, withRateLimit, withRequestLog } from "@/backend/middleware";

export async function POST(
  req: NextRequest,
  context: Readonly<{ params: Promise<{ id: string }> }>,
): Promise<Response> {
  return withErrorBoundary(async () => {
    const { id } = await context.params;
    const container = await ensureBootstrap();
    return withRequestLog(req, async () =>
      withRateLimit(req, async () =>
        withAuth(req, async (actorId, role) =>
          withGuard(role, ROLES.MANAGER, async () =>
            container.resolve<CampaignController>("CampaignController").send(req, id, actorId),
          ),
        ),
      ),
    );
  });
}
