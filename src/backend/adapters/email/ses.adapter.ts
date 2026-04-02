import { SendEmailCommand, SESv2Client } from "@aws-sdk/client-sesv2";

import { env } from "@/backend/config";

import type { IEmailAdapter } from "./email-adapter.interface";
import type { SendEmailPayload, SendEmailResult } from "./email.types";

export class SESAdapter implements IEmailAdapter {
  readonly provider: string = "ses";
  private readonly client: SESv2Client;

  constructor() {
    this.client = new SESv2Client({
      region: env.AWS_REGION,
      credentials:
        env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
          ? {
              accessKeyId: env.AWS_ACCESS_KEY_ID,
              secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
            }
          : undefined,
    });
  }

  async send(payload: SendEmailPayload): Promise<SendEmailResult> {
    const command = new SendEmailCommand({
      FromEmailAddress: payload.from ?? env.EMAIL_FROM,
      Destination: {
        ToAddresses: payload.to,
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
    });

    const response = await this.client.send(command);

    return {
      success: true,
      provider: this.provider,
      messageIds: response.MessageId ? [response.MessageId] : [],
    };
  }
}
