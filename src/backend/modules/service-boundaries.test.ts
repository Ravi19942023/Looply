import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function collectServiceFiles(directory: string): string[] {
  const entries = readdirSync(directory, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const entryPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      return collectServiceFiles(entryPath);
    }

    return entry.isFile() && entry.name.endsWith(".service.ts") ? [entryPath] : [];
  });
}

describe("service boundaries", () => {
  it("keeps service files free of db and route-layer imports", () => {
    const serviceFiles = collectServiceFiles(join(process.cwd(), "src", "backend", "modules"));

    for (const filePath of serviceFiles) {
      const source = readFileSync(filePath, "utf8");

      expect(source, filePath).not.toContain('@/backend/db');
      expect(source, filePath).not.toMatch(/\bNextRequest\b/);
      expect(source, filePath).not.toMatch(/\bResponse\b/);
    }
  });
});
