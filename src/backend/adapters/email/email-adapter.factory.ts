import { env } from "@/backend/config";

import type { IEmailAdapter } from "./email-adapter.interface";
import { SESAdapter } from "./ses.adapter";

export class EmailAdapterFactory {
  static create(provider = env.EMAIL_PROVIDER): IEmailAdapter {
    switch (provider) {
      case "ses":
        return new SESAdapter();
      default:
        throw new Error(`Email provider ${provider} is not supported in this POC. Currently, only AWS SES is available.`);
    }
  }
}
