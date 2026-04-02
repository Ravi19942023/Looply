import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";

import { createDbClient } from "@/backend/db/client";
import { campaignLogs, campaigns } from "@/backend/db/schema";

import { TransactionRepository } from "./analytics";
import { AuditRepository } from "./audit";
import { UserRepository } from "./auth";
import { CampaignRepository } from "./campaigns";
import { CustomerRepository } from "./customers";
import { MemoryRepository } from "./memory";
import { DocumentRepository } from "./uploads";

const describeRepository =
  process.env.RUN_DB_REPOSITORY_TESTS === "true"
    ? describe
    : describe.skip;

const db = createDbClient();

const userRepository = new UserRepository();
const customerRepository = new CustomerRepository();
const transactionRepository = new TransactionRepository();
const campaignRepository = new CampaignRepository();
const auditRepository = new AuditRepository();
const memoryRepository = new MemoryRepository();
const documentRepository = new DocumentRepository();

let seededUserId = "";

beforeAll(async () => {
  const user = await userRepository.findByEmail("admin@looply.ai");
  if (!user) {
    throw new Error("Seed data missing: admin user not found.");
  }
  seededUserId = user.id;
}, 30000);

describeRepository("repository smoke tests", () => {
  it("finds users by id and email", async () => {
    const byEmail = await userRepository.findByEmail("admin@looply.ai");
    const byId = byEmail ? await userRepository.findById(byEmail.id) : null;

    expect(byEmail?.email).toBe("admin@looply.ai");
    expect(byId?.id).toBe(byEmail?.id);
  });

  it("queries customer repository list/top/churn", async () => {
    const list = await customerRepository.findAll({ page: 1, pageSize: 10 });
    const top = await customerRepository.findTopByRevenue(5);
    const churn = await customerRepository.findChurnRisk(30);

    expect(list.items.length).toBeGreaterThan(0);
    expect(top.length).toBeGreaterThan(0);
    expect(Array.isArray(churn)).toBe(true);
  });

  it("builds analytics summary from transaction repository", async () => {
    const summary = await transactionRepository.getSummary(30);

    expect(summary.kpis.length).toBeGreaterThan(0);
    expect(summary.recentOrders.length).toBeGreaterThan(0);
  });

  it("creates, reads, updates, and logs campaigns", async () => {
    const created = await campaignRepository.create({
      createdBy: seededUserId,
      message: "<p>hello</p>",
      name: "Repository Smoke Campaign",
      recipientCount: 1,
      segment: "general",
      status: "draft",
      subject: "Smoke",
    });

    const loaded = await campaignRepository.findById(created.id);
    const updated = await campaignRepository.updateStatus(created.id, "sent", new Date());

    await campaignRepository.createLogs([
      {
        campaignId: created.id,
        email: "smoke@example.com",
        status: "sent",
        messageId: "smoke-1",
      },
    ]);

    const logged = await campaignRepository.findById(created.id);

    expect(loaded?.id).toBe(created.id);
    expect(updated?.status).toBe("sent");
    expect((logged?.logs.length ?? 0) > 0).toBe(true);

    await db.delete(campaignLogs).where(eq(campaignLogs.campaignId, created.id));
    await db.delete(campaigns).where(eq(campaigns.id, created.id));
  });

  it("creates and queries audit logs", async () => {
    const event = `repo.test.${randomUUID()}`;
    await auditRepository.create({
      actorId: seededUserId,
      event,
      metadata: { source: "vitest" },
    });

    const result = await auditRepository.findAll({
      page: 1,
      pageSize: 10,
      event,
    });

    expect(result.items.some((item) => item.event === event)).toBe(true);
  });

  it("reads and appends memory records", async () => {
    const memory = await memoryRepository.findByUserId(seededUserId);
    const sessionId = `repo-session-${randomUUID()}`;

    await memoryRepository.appendMessage({
      sessionId,
      role: "user",
      content: "repository smoke",
    });

    const messages = await memoryRepository.findRecentMessages(sessionId, 10);

    expect(memory?.userId).toBe(seededUserId);
    expect(messages.some((message) => message.sessionId === sessionId)).toBe(true);
  });

  it("creates, lists, toggles, and deletes documents", async () => {
    const created = await documentRepository.create({
      actorId: seededUserId,
      key: `docs/${randomUUID()}.txt`,
      url: "https://example.com/doc.txt",
      fileName: "doc.txt",
      fileSize: 128,
      chunkCount: 1,
      inContext: true,
    });

    const byId = await documentRepository.findById(created.id);
    const byActor = await documentRepository.findByActor(seededUserId);
    const inContext = await documentRepository.findInContext();
    const toggled = await documentRepository.toggleContext(created.id, false);

    expect(byId?.id).toBe(created.id);
    expect(byActor.some((doc) => doc.id === created.id)).toBe(true);
    expect(inContext.some((doc) => doc.id === created.id)).toBe(true);
    expect(toggled?.inContext).toBe(false);

    await documentRepository.delete(created.id);
    const deleted = await documentRepository.findById(created.id);
    expect(deleted).toBeNull();
  });
});
