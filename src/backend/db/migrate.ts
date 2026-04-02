import { resolve } from "node:path";

import { migrate } from "drizzle-orm/neon-http/migrator";

import { db } from "@/backend/db";
import { ensurePgVector } from "@/backend/db/ensure-pgvector";

async function runMigrations(): Promise<void> {
  await ensurePgVector();

  const migrationsFolder = resolve(process.cwd(), "src/backend/db/migrations");
  process.stdout.write(`Applying migrations from ${migrationsFolder}\n`);

  await migrate(db, {
    migrationsFolder,
  });

  process.stdout.write("Database migrations applied successfully.\n");
}

void runMigrations().catch((error) => {
  process.stderr.write(
    `Failed to apply database migrations: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
});
