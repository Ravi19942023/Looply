import type { Role } from "@/shared/constants";
import { ROLES } from "@/shared/constants";
import { errorResponse } from "@/backend/lib";

const ROLE_HIERARCHY: Record<Role, number> = {
  [ROLES.VIEWER]: 1,
  [ROLES.ANALYST]: 2,
  [ROLES.MANAGER]: 3,
  [ROLES.ADMIN]: 4,
};

export async function withGuard(
  actorRole: string,
  minimumRole: Role,
  handler: () => Promise<Response>,
): Promise<Response> {
  const actorLevel = ROLE_HIERARCHY[actorRole as Role] ?? 0;

  if (actorLevel < ROLE_HIERARCHY[minimumRole]) {
    return errorResponse(403, "Insufficient permissions", "FORBIDDEN");
  }

  return handler();
}
