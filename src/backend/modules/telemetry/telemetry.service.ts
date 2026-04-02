import type { NewEmailLog } from "@/backend/db/schema/email-logs.schema";
import type { NewTelemetryLog } from "@/backend/db/schema/telemetry.schema";
import type { NewToolLog } from "@/backend/db/schema/tool-logs.schema";

import type { TelemetryRepository } from "./telemetry.repository";

export class TelemetryService {
  constructor(private readonly telemetryRepository: TelemetryRepository) {}

  async logTokenUsage(data: NewTelemetryLog): Promise<void> {
    try {
      if (!data.actorId) return; // actorId is required
      await this.telemetryRepository.create(data);
    } catch (err) {
      console.error("[Telemetry] Failed to log token usage:", err);
    }
  }

  async logToolUsage(data: NewToolLog): Promise<void> {
    try {
      await this.telemetryRepository.createToolLog(data);
    } catch (err) {
      console.error("[Telemetry] Failed to log tool usage:", err);
    }
  }

  async logEmailDelivery(data: NewEmailLog): Promise<void> {
    try {
      await this.telemetryRepository.createEmailLog(data);
    } catch (err) {
      console.error("[Telemetry] Failed to log email delivery:", err);
    }
  }
}
