import { errorResponse } from "@/backend/lib";

export async function withFeatureFlag(
  isEnabled: boolean,
  featureName: string,
  handler: () => Promise<Response>,
): Promise<Response> {
  if (!isEnabled) {
    return errorResponse(403, `${featureName} is not enabled`, "FEATURE_DISABLED");
  }

  return handler();
}
