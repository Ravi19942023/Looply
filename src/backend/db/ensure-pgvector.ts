import { pathToFileURL } from "node:url";

import { neon } from "@neondatabase/serverless";

import { env } from "@/backend/config";

export async function ensurePgVector(): Promise<void> {
  const sql = neon(env.POSTGRES_URL);

  await sql`CREATE EXTENSION IF NOT EXISTS vector;`;
  process.stdout.write("pgvector extension is enabled.\n");
}

const entrypoint = process.argv[1];
const isDirectRun = entrypoint ? import.meta.url === pathToFileURL(entrypoint).href : false;

if (isDirectRun) {
  void ensurePgVector().catch((error) => {
    process.stderr.write(
      `Failed to enable pgvector extension: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  });
}
