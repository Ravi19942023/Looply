import { env } from "./env";

export const appConfig = {
  appUrl: env.APP_URL,
  databaseUrl: env.POSTGRES_URL,
  emailProvider: env.EMAIL_PROVIDER,
  isDevelopment: env.NODE_ENV === "development",
  isProduction: env.NODE_ENV === "production",
} as const;

export type AppConfig = typeof appConfig;
