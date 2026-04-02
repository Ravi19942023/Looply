import { describe, expect, it } from "vitest";

import { ROLES } from "@/shared/constants";

import { withFeatureFlag } from "./feature-flag.guard";
import { withOwnershipCheck } from "./ownership.guard";
import { withGuard } from "./role.guard";

describe("guards", () => {
  it("allows access when role meets minimum", async () => {
    const response = await withGuard(ROLES.ADMIN, ROLES.VIEWER, async () => Response.json({ ok: true }));
    expect(response.status).toBe(200);
  });

  it("blocks access when role is insufficient", async () => {
    const response = await withGuard(ROLES.VIEWER, ROLES.ADMIN, async () => Response.json({ ok: true }));
    expect(response.status).toBe(403);
  });

  it("allows ownership for admins and owners", async () => {
    const adminResponse = await withOwnershipCheck("a", ROLES.ADMIN, "b", async () => Response.json({ ok: true }));
    const ownerResponse = await withOwnershipCheck("a", ROLES.VIEWER, "a", async () => Response.json({ ok: true }));
    expect(adminResponse.status).toBe(200);
    expect(ownerResponse.status).toBe(200);
  });

  it("blocks ownership for non-owners", async () => {
    const response = await withOwnershipCheck("a", ROLES.VIEWER, "b", async () => Response.json({ ok: true }));
    expect(response.status).toBe(403);
  });

  it("respects feature flag state", async () => {
    const enabled = await withFeatureFlag(true, "chat", async () => Response.json({ ok: true }));
    const disabled = await withFeatureFlag(false, "chat", async () => Response.json({ ok: true }));
    expect(enabled.status).toBe(200);
    expect(disabled.status).toBe(403);
  });
});
