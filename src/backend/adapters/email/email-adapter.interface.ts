import type { SendEmailPayload, SendEmailResult } from "./email.types";

export interface IEmailAdapter {
  readonly provider: string;
  send(payload: SendEmailPayload): Promise<SendEmailResult>;
}
