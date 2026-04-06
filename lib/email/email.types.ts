export type SendEmailPayload = {
  from?: string;
  html: string;
  subject: string;
  to: string[];
};

export type RecipientDeliveryResult = {
  error?: string;
  messageId?: string | null;
  provider: string;
  recipient: string;
  success: boolean;
};

export type SendEmailResult = {
  provider: string;
  results: RecipientDeliveryResult[];
  success: boolean;
};
