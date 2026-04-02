import type { NextRequest } from "next/server";

import { AuditService, AuditRepository, AUDIT_EVENTS } from "@/backend/modules/audit";
import { MetricsComputeService } from "@/backend/modules/analytics";
import { env } from "@/backend/config/env";

const auditRepository = new AuditRepository();
const auditService = new AuditService(auditRepository);
const metricsComputeService = new MetricsComputeService();

export async function POST(req: NextRequest): Promise<Response> {
  const secret = env.CRON_SECRET;

  if (!secret) {
    return Response.json(
      { error: "CRON_SECRET is not configured" },
      { status: 503 },
    );
  }

  const authHeader = req.headers.get("authorization");
  const isVercelCron = req.headers.get("x-vercel-cron") === "1";
  const customApiKey = req.headers.get("x-api-key");

  const isAuthorized = isVercelCron || authHeader === `Bearer ${secret}` || customApiKey === secret;

  if (!isAuthorized) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const startedAt = Date.now();

  const result = await metricsComputeService.recomputeAll();

  const durationMs = Date.now() - startedAt;

  await auditService.log({
    actorId: "system",
    event: AUDIT_EVENTS.METRICS_RECOMPUTED,
    metadata: {
      processed: result.processed,
      durationMs,
    },
  });

  return Response.json({
    success: true,
    processed: result.processed,
    durationMs,
  });
}
