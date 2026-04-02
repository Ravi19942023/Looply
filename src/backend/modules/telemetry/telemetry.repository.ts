import { db } from "@/backend/db/client";
import { emailLogs, telemetryLogs, toolLogs } from "@/backend/db/schema";
import type { NewEmailLog } from "@/backend/db/schema/email-logs.schema";
import type { NewTelemetryLog } from "@/backend/db/schema/telemetry.schema";
import type { NewToolLog } from "@/backend/db/schema/tool-logs.schema";

export class TelemetryRepository {
  async create(data: NewTelemetryLog): Promise<void> {
    await db.insert(telemetryLogs).values(data);
  }

  async createToolLog(data: NewToolLog): Promise<void> {
    await db.insert(toolLogs).values(data);
  }

  async createEmailLog(data: NewEmailLog): Promise<void> {
    await db.insert(emailLogs).values(data);
  }
}
