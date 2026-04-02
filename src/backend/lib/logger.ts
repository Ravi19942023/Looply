import pino from "pino";

import { env } from "@/backend/config";

export const logger = pino({
  level: env.NODE_ENV === "development" ? "debug" : "info",
  base: {
    service: "looply",
  },
});
