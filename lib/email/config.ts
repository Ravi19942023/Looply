import { z } from "zod";

const emailEnvSchema = z.object({
  EMAIL_PROVIDER: z.enum(["ses"]).default("ses"),
  EMAIL_FROM: z.string().email(),
  AWS_REGION: z.string().default("us-east-1"),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
});

export type EmailEnv = z.infer<typeof emailEnvSchema>;

export function getEmailEnv(): EmailEnv {
  return emailEnvSchema.parse({
    EMAIL_PROVIDER: process.env.EMAIL_PROVIDER,
    EMAIL_FROM: process.env.EMAIL_FROM,
    AWS_REGION: process.env.AWS_REGION,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  });
}
