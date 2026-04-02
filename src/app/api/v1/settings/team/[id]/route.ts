import type { NextRequest } from "next/server";

import { ROLES } from "@/shared/constants";
import { ensureBootstrap } from "@/backend/lib/bootstrap";
import { withGuard } from "@/backend/guards";
import type { SettingsController } from "@/backend/modules/settings";
import { withAuth, withErrorBoundary, withRateLimit, withRequestLog } from "@/backend/middleware";

export async function PATCH(
  req: NextRequest,
  context: Readonly<{ params: Promise<{ id: string }> }>,
): Promise<Response> {
  return withErrorBoundary(async () => {
    const { id } = await context.params;
    const container = await ensureBootstrap();
    return withRequestLog(req, async () =>
      withRateLimit(req, async () =>
        withAuth(req, async (_actorId, role) =>
          withGuard(role, ROLES.MANAGER, async () =>
            container.resolve<SettingsController>("SettingsController").updateMemberRole(req, id),
          ),
        ),
      ),
    );
  });
}

export async function DELETE(
  req: NextRequest,
  context: Readonly<{ params: Promise<{ id: string }> }>,
): Promise<Response> {
  return withErrorBoundary(async () => {
    const { id } = await context.params;
    const container = await ensureBootstrap();
    return withRequestLog(req, async () =>
      withRateLimit(req, async () =>
        withAuth(req, async (_actorId, role) =>
          withGuard(role, ROLES.MANAGER, async () =>
            container.resolve<SettingsController>("SettingsController").removeMember(id),
          ),
        ),
      ),
    );
  });
}
