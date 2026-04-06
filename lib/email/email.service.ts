import { createEmailLogs } from "@/lib/db/queries";
import type { SendEmailPayload, SendEmailResult } from "./email.types";
import type { IEmailAdapter } from "./email-adapter.interface";

export class EmailService {
  private readonly emailAdapter: IEmailAdapter;

  constructor(emailAdapter: IEmailAdapter) {
    this.emailAdapter = emailAdapter;
  }

  async send(
    payload: SendEmailPayload,
    metadata: Record<string, unknown> = {}
  ): Promise<SendEmailResult> {
    const result = await this.emailAdapter.send(payload);

    await createEmailLogs({
      logs: result.results.map((recipientResult) => ({
        recipient: recipientResult.recipient,
        subject: payload.subject,
        body: payload.html,
        status: recipientResult.success ? "sent" : "failed",
        messageId: recipientResult.messageId ?? null,
        provider: recipientResult.provider,
        metadata: {
          ...metadata,
          error: recipientResult.error ?? null,
          batchSize: payload.to.length,
        },
        sentAt: new Date(),
      })),
    });

    return result;
  }
}
