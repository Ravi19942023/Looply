import type { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/backend/lib";

import { AnalyticsSummaryQuerySchema } from "./analytics.schema";
import type { AnalyticsService } from "./analytics.service";

export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  async summary(req: NextRequest, actorId: string): Promise<Response> {
    const parsed = AnalyticsSummaryQuerySchema.safeParse({
      period: req.nextUrl.searchParams.get("period") ?? undefined,
    });

    if (!parsed.success) {
      return errorResponse(400, "Validation failed", "VALIDATION_ERROR", parsed.error.flatten());
    }

    const days = parseInt(parsed.data.period, 10);
    const summary = await this.analyticsService.getSummary(actorId, days);
    return successResponse(200, summary);
  }
}
