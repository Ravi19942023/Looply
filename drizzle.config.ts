import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/backend/db/schema",
  out: "./src/backend/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.POSTGRES_URL ?? "",
  },
});
