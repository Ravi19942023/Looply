import { AppError, errorResponse, logger } from "@/backend/lib";

type BoundaryHandler = () => Promise<Response>;

export async function withErrorBoundary(handler: BoundaryHandler): Promise<Response> {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(error.status, error.message, error.code, error.details);
    }

    logger.error({ error }, "Unexpected request failure");
    return errorResponse(500, "Internal server error", "INTERNAL_SERVER_ERROR");
  }
}
