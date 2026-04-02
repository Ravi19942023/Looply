import { logger } from "@/backend/lib";

export function resolveJobRegistrationMode(): "route-driven" {
  return "route-driven";
}

export function registerAllJobs(): "registered" {
  logger.info("Background jobs are registered through route handlers and Vercel cron.");
  return "registered";
}
