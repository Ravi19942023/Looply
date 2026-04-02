import type { NextRequest } from "next/server";

import { ROLES } from "@/shared/constants";
import { ensureBootstrap } from "@/backend/lib/bootstrap";
import type { AuditController } from "@/backend/modules/audit";
import { withGuard } from "@/backend/guards";
import { withAuth, withErrorBoundary, withRateLimit, withRequestLog } from "@/backend/middleware";

export async function GET(req: NextRequest): Promise<Response> {
  return withErrorBoundary(async () => {
    const container = await ensureBootstrap();
    return withRequestLog(req, async () =>
      withRateLimit(req, async () =>
        withAuth(req, async (_actorId, role) =>
          withGuard(role, ROLES.ADMIN, async () =>
            container.resolve<AuditController>("AuditController").query(req),
          ),
        ),
      ),
    );
  });
}
