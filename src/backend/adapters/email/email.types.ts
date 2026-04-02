export interface SendEmailPayload {
  to: string[];
  subject: string;
  html: string;
  from?: string;
}

export interface SendEmailResult {
  success: boolean;
  provider: string;
  messageIds: string[];
}
