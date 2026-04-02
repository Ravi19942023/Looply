import type { NextRequest } from "next/server";

import { errorResponse, successResponse } from "@/backend/lib";

import { AuditQuerySchema } from "./audit.schema";
import type { AuditService } from "./audit.service";

export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  async query(req: NextRequest): Promise<Response> {
    const parsed = AuditQuerySchema.safeParse({
      page: req.nextUrl.searchParams.get("page"),
      pageSize: req.nextUrl.searchParams.get("pageSize"),
      event: req.nextUrl.searchParams.get("event") ?? undefined,
      actorId: req.nextUrl.searchParams.get("actorId") ?? undefined,
    });

    if (!parsed.success) {
      return errorResponse(400, "Validation failed", "VALIDATION_ERROR", parsed.error.flatten());
    }

    const result = await this.auditService.query(parsed.data);
    return successResponse(200, result.items, { pagination: result.pagination });
  }
}
