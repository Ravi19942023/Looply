import { getEmailEnv } from "./config";
import type { IEmailAdapter } from "./email-adapter.interface";
import { SESAdapter } from "./ses.adapter";

export function createEmailAdapter(
  provider = getEmailEnv().EMAIL_PROVIDER
): IEmailAdapter {
  switch (provider) {
    case "ses":
      return new SESAdapter();
    default:
      throw new Error(`Email provider ${provider} is not supported.`);
  }
}
