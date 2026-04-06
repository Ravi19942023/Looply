import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { getEmailEnv } from "./config";
import type {
  RecipientDeliveryResult,
  SendEmailPayload,
  SendEmailResult,
} from "./email.types";
import type { IEmailAdapter } from "./email-adapter.interface";

export class SESAdapter implements IEmailAdapter {
  readonly provider = "ses";
  private readonly client: SESv2Client;
  private readonly fromEmail: string;

  constructor() {
    const env = getEmailEnv();
    this.fromEmail = env.EMAIL_FROM;
    this.client = new SESv2Client({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async send(payload: SendEmailPayload): Promise<SendEmailResult> {
    const results: RecipientDeliveryResult[] = [];

    for (const recipient of payload.to) {
      try {
        const response = await this.client.send(
          new SendEmailCommand({
            FromEmailAddress: payload.from ?? this.fromEmail,
            Destination: {
              ToAddresses: [recipient],
            },
            Content: {
              Simple: {
                Subject: {
                  Data: payload.subject,
                },
                Body: {
                  Html: {
                    Data: payload.html,
                  },
                },
              },
            },
          })
        );

        results.push({
          recipient,
          success: true,
          provider: this.provider,
          messageId: response.MessageId ?? null,
        });
      } catch (error) {
        results.push({
          recipient,
          success: false,
          provider: this.provider,
          error: error instanceof Error ? error.message : "SES send failed",
        });
      }
    }

    return {
      provider: this.provider,
      results,
      success: results.some((result) => result.success),
    };
  }
}
