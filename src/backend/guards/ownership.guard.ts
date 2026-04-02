import { ROLES } from "@/shared/constants";
import { errorResponse } from "@/backend/lib";

export async function withOwnershipCheck(
  actorId: string,
  actorRole: string,
  resourceOwnerId: string,
  handler: () => Promise<Response>,
): Promise<Response> {
  if (actorRole === ROLES.ADMIN || actorId === resourceOwnerId) {
    return handler();
  }

  return errorResponse(403, "You do not own this resource", "FORBIDDEN");
}
