import type { IEmailAdapter, SendEmailPayload, SendEmailResult } from "@/backend/adapters/email";
import type { TelemetryService } from "@/backend/modules/telemetry";

export class EmailService {
  constructor(
    private readonly emailAdapter: IEmailAdapter,
    private readonly telemetryService: TelemetryService,
  ) {}

  async send(payload: SendEmailPayload, metadata: Record<string, any> = {}): Promise<SendEmailResult> {
    const result = await this.emailAdapter.send(payload);

    // Track every email delivery in the central log
    for (const to of payload.to) {
      await this.telemetryService.logEmailDelivery({
        recipient: to,
        subject: payload.subject,
        body: payload.html,
        status: result.success ? "sent" : "failed",
        messageId: result.messageIds[0] ?? null, // SES usually returns one ID for a batch or multiple
        provider: this.emailAdapter.provider,
        metadata: {
          ...metadata,
          batchSize: payload.to.length,
        },
      });
    }

    return result;
  }
}
