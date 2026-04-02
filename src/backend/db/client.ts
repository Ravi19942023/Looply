import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

import { appConfig } from "@/backend/config";

import * as schema from "./schema";

export function getDatabaseConnectionUrl(config = appConfig): string {
  return config.databaseUrl;
}

export function createDbClient(connectionString = getDatabaseConnectionUrl()) {
  const sql = neon(connectionString);
  return drizzleNeon(sql, { schema });
}

export type Database = ReturnType<typeof createDbClient>;

export const db = createDbClient();
