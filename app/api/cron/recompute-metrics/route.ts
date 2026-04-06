import type { NextRequest } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { recomputeCustomerMetrics } from "@/lib/analytics/metrics-compute";
import { canRunCron } from "@/lib/auth/permissions";
import {
  createAuditLog,
  createJobRun,
  getLatestJobRun,
  getLatestRunningJob,
  updateJobRun,
} from "@/lib/db/queries";

export async function POST(req: NextRequest): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  const session = await auth();

  if (!secret && !session?.user) {
    return Response.json(
      { error: "CRON_SECRET is not configured" },
      { status: 503 }
    );
  }

  const authHeader = req.headers.get("authorization");
  const isVercelCron = req.headers.get("x-vercel-cron") === "1";
  const customApiKey = req.headers.get("x-api-key");

  const isAuthorized =
    isVercelCron ||
    authHeader === `Bearer ${secret}` ||
    customApiKey === secret ||
    Boolean(session?.user && canRunCron(session.user.role));

  if (!isAuthorized) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existingRun = await getLatestRunningJob({
    jobName: "recompute_customer_metrics",
  });

  if (existingRun) {
    return Response.json(
      { error: "A metrics recompute job is already running." },
      { status: 409 }
    );
  }

  const latestRun = await getLatestJobRun({
    jobName: "recompute_customer_metrics",
  });
  const retryCount =
    latestRun?.status === "failed" ? latestRun.retryCount + 1 : 0;
  const job = await createJobRun({
    jobName: "recompute_customer_metrics",
    retryCount,
  });

  const startedAt = Date.now();
  try {
    const result = await recomputeCustomerMetrics();
    const durationMs = Date.now() - startedAt;

    if (job) {
      await updateJobRun({
        id: job.id,
        status: "success",
        processedCount: result.processed,
      });
    }

    await createAuditLog({
      actorId: null,
      event: "analytics.metrics.recomputed",
      resourceType: "job",
      resourceId: job?.id ?? null,
      metadata: {
        processed: result.processed,
        durationMs,
        retryCount,
      },
      ipAddress: req.headers.get("x-forwarded-for"),
      userAgent: req.headers.get("user-agent"),
    });

    return Response.json({
      success: true,
      processed: result.processed,
      durationMs,
      retryCount,
    });
  } catch (error) {
    if (job) {
      await updateJobRun({
        id: job.id,
        status: "failed",
        error: error instanceof Error ? error.message : "Job failed",
      });
    }

    await createAuditLog({
      actorId: null,
      event: "analytics.metrics.failed",
      resourceType: "job",
      resourceId: job?.id ?? null,
      metadata: {
        retryCount,
        error: error instanceof Error ? error.message : "Job failed",
      },
      ipAddress: req.headers.get("x-forwarded-for"),
      userAgent: req.headers.get("user-agent"),
    });

    return Response.json(
      {
        error: error instanceof Error ? error.message : "Job failed",
      },
      { status: 500 }
    );
  }
}
