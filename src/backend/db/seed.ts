/* eslint-disable max-lines -- Seed script is data-heavy by nature. */
import { createHash } from "node:crypto";

import { inArray, sql } from "drizzle-orm";

import { hashPassword } from "@/backend/lib";

import { createDbClient } from "./client";
import {
  auditLogs,
  campaignLogs,
  campaigns,
  conversationMessages,
  customerMetrics,
  customers,
  documents,
  products,
  transactions,
  userMemory,
  users,
} from "./schema";

const db = createDbClient();

type SeedUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "viewer";
};

type SeedCustomer = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  segment: string;
  tags: string[];
};

type SeedProduct = {
  id: string;
  name: string;
  category: string;
  price: string;
};

function stableUuid(seed: string): string {
  const hash = createHash("sha256").update(seed).digest("hex");
  const part1 = hash.slice(0, 8);
  const part2 = hash.slice(8, 12);
  const part3 = `4${hash.slice(13, 16)}`;
  const variants = ["8", "9", "a", "b"] as const;
  const variant = variants[parseInt(hash.slice(16, 18), 16) % variants.length] ?? "8";
  const part4 = `${variant}${hash.slice(17, 20)}`;
  const part5 = hash.slice(20, 32);

  return `${part1}-${part2}-${part3}-${part4}-${part5}`;
}

const seedUsers: SeedUser[] = [
  {
    id: stableUuid("seed-user:admin@looply.ai"),
    name: "Looply Admin",
    email: "admin@looply.ai",
    role: "admin",
  },
  {
    id: stableUuid("seed-user:manager@looply.ai"),
    name: "Looply Manager",
    email: "manager@looply.ai",
    role: "manager",
  },
  {
    id: stableUuid("seed-user:viewer@looply.ai"),
    name: "Looply Viewer",
    email: "viewer@looply.ai",
    role: "viewer",
  },
];

const segments = ["general", "premium", "enterprise", "inactive"] as const;
const customerProfiles = [
  ["Ava Thompson", "Northstar Wellness"],
  ["Liam Carter", "BrightPath Logistics"],
  ["Mia Rodriguez", "Harbor & Pine Studio"],
  ["Noah Bennett", "Summit Ridge Dental"],
  ["Emma Collins", "Bluebird Kitchens"],
  ["Ethan Foster", "Crescent Legal Group"],
  ["Sophia Ramirez", "Maple Lane Pediatrics"],
  ["Mason Hughes", "Willow Peak Fitness"],
  ["Olivia Ward", "Horizon Travel Co"],
  ["Lucas Brooks", "Elm Street Market"],
  ["Isabella Reed", "Silverline Accounting"],
  ["Logan Price", "Verdant Home Goods"],
  ["Amelia Hayes", "Golden Hour Events"],
  ["James Perry", "Oak & Ash Builders"],
  ["Charlotte Morgan", "Sunset Salon Collective"],
  ["Benjamin Powell", "Clearview Optics"],
  ["Harper Long", "Riverbank Realty"],
  ["Elijah Sanders", "Aster Coffee Roasters"],
  ["Evelyn Ross", "Northgate Auto Care"],
  ["Henry Coleman", "Mint Leaf Bistro"],
  ["Abigail Jenkins", "Beacon Learning Hub"],
  ["Alexander Barnes", "Stonebridge Security"],
  ["Emily Henderson", "Pinecrest Veterinary"],
  ["Michael Bryant", "Apex Solar Works"],
  ["Ella Griffin", "Paper Lantern Design"],
  ["Daniel Diaz", "Highland Property Group"],
  ["Scarlett Russell", "Evergreen Floral"],
  ["Matthew Kim", "Atlas Outdoor Supply"],
  ["Grace Patel", "Saffron Table"],
  ["Jackson Turner", "Driftwood Media"],
  ["Chloe Murphy", "True North Advisors"],
  ["Sebastian Bailey", "Parkside Hardware"],
  ["Victoria Cooper", "Bloomwell Skincare"],
  ["David Richardson", "Ironwood Roofing"],
  ["Riley Cox", "Lighthouse Therapy"],
  ["Joseph Howard", "Vantage Insurance"],
  ["Lily Ward", "Meadowbrook Bakery"],
  ["Samuel Flores", "Cornerstone Plumbing"],
  ["Zoey Peterson", "Aurora Dance Academy"],
  ["Owen Gray", "Metro Print House"],
  ["Nora James", "Copper Kettle Catering"],
  ["Gabriel Watson", "Everfield Landscapes"],
  ["Hannah Wood", "Kindred Childcare"],
  ["Carter Kelly", "Open Road Rentals"],
  ["Layla Brooks", "Westlake Dermatology"],
  ["Wyatt Price", "Peakline Manufacturing"],
  ["Aria Nguyen", "Monarch Bridal Atelier"],
  ["Julian Torres", "Greenstone Energy"],
  ["Penelope Scott", "City Harbor Dental Lab"],
  ["Levi Rivera", "Fable Books & Gifts"],
] as const;
const productCatalog = [
  ["Looply Inbox Pro", "crm", "89.00"],
  ["Looply Audience Studio", "crm", "129.00"],
  ["Looply Revenue Console", "crm", "219.00"],
  ["Journey Builder", "marketing", "79.00"],
  ["Campaign Orchestrator", "marketing", "139.00"],
  ["Retention Intelligence", "analytics", "109.00"],
  ["Executive Reporting Suite", "analytics", "169.00"],
  ["Knowledge Cloud", "knowledge", "119.00"],
  ["Assist Copilot", "ai", "189.00"],
  ["Lifecycle Automation", "retention", "179.00"],
] as const;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildCustomers(): SeedCustomer[] {
  return customerProfiles.map(([contactName, companyName], index) => {
    const segment = segments[index % segments.length] ?? "general";
    const emailDomain = `${slugify(companyName)}.com`;
    const businessTags =
      segment === "enterprise"
        ? ["high-value", "b2b", "renewal-priority"]
        : segment === "premium"
          ? ["upsell-ready", "newsletter-engaged"]
          : segment === "inactive"
            ? ["win-back", "at-risk"]
            : ["active"];

    return {
      id: stableUuid(`seed-customer:${contactName}:${companyName}`),
      name: contactName,
      email: `${slugify(contactName).replace(/-/g, ".")}@${emailDomain}`,
      phone: `+1-555-${String(2100 + index).padStart(4, "0")}`,
      segment,
      tags: [companyName, ...businessTags],
    };
  });
}

function buildProducts(): SeedProduct[] {
  return productCatalog.map(([name, category, price]) => ({
    id: stableUuid(`seed-product:${name}`),
    name,
    category,
    price,
  }));
}

export async function seedDatabase(): Promise<void> {
  const passwordHash = await hashPassword("password123");
  const seededCustomers = buildCustomers();
  const seededProducts = buildProducts();

  await db.insert(users).values(
    seedUsers.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      passwordHash,
    })),
  ).onConflictDoUpdate({
    target: users.email,
    set: {
      name: sql`excluded.name`,
      role: sql`excluded.role`,
      passwordHash: sql`excluded.password_hash`,
      updatedAt: new Date(),
    },
  });

  const persistedUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .where(inArray(users.email, seedUsers.map((user) => user.email)));

  const userByEmail = new Map(persistedUsers.map((user) => [user.email, user]));
  const adminUserId =
    userByEmail.get("admin@looply.ai")?.id ?? stableUuid("seed-user:admin@looply.ai");
  const managerUserId =
    userByEmail.get("manager@looply.ai")?.id ?? stableUuid("seed-user:manager@looply.ai");
  const viewerUserId =
    userByEmail.get("viewer@looply.ai")?.id ?? stableUuid("seed-user:viewer@looply.ai");

  await db
    .insert(customers)
    .values(seededCustomers)
    .onConflictDoUpdate({
      target: customers.email,
      set: {
        name: sql`excluded.name`,
        phone: sql`excluded.phone`,
        segment: sql`excluded.segment`,
        tags: sql`excluded.tags`,
        updatedAt: new Date(),
      },
    });

  const persistedCustomers = await db
    .select({
      id: customers.id,
      email: customers.email,
    })
    .from(customers)
    .where(inArray(customers.email, seededCustomers.map((c) => c.email)));

  const customerIdByEmail = new Map(persistedCustomers.map((c) => [c.email, c.id]));

  // Re-map seededCustomers with actual IDs from the database
  const finalSeededCustomers = seededCustomers.map((c) => ({
    ...c,
    id: customerIdByEmail.get(c.email) ?? c.id,
  }));
  await db.insert(products).values(seededProducts).onConflictDoUpdate({
    target: products.id,
    set: {
      name: sql`excluded.name`,
      category: sql`excluded.category`,
      price: sql`excluded.price`,
      currency: sql`excluded.currency`,
    },
  });

  const now = new Date();
  const txRows = Array.from({ length: 200 }, (_, index) => {
    const customer = finalSeededCustomers[index % finalSeededCustomers.length];
    const product = seededProducts[index % seededProducts.length];

    if (!customer || !product) {
      throw new Error("Seed prerequisites missing for transactions.");
    }

    const createdAt = new Date(now);
    createdAt.setDate(createdAt.getDate() - (index % 90));
    createdAt.setHours(9 + (index % 8), (index * 7) % 60, 0, 0);
    const multiplier = [1, 1, 1, 1, 2, 3][index % 6] ?? 1;
    const amount = (Number(product.price) * multiplier).toFixed(2);
    const status = index % 17 === 0 ? "pending" : index % 11 === 0 ? "refunded" : "completed";

    return {
      id: stableUuid(`seed-transaction:${customer.id}:${product.id}:${index}`),
      customerId: customer.id,
      productId: product.id,
      amount,
      currency: "USD",
      status,
      createdAt,
    };
  });

  await db.insert(transactions).values(txRows).onConflictDoUpdate({
    target: transactions.id,
    set: {
      customerId: sql`excluded.customer_id`,
      productId: sql`excluded.product_id`,
      amount: sql`excluded.amount`,
      currency: sql`excluded.currency`,
      status: sql`excluded.status`,
      createdAt: sql`excluded.created_at`,
    },
  });

  const metricsRows = finalSeededCustomers.map((customer, index) => {
    const customerTransactions = txRows.filter((tx) => tx.customerId === customer.id);
    const completedTransactions = customerTransactions.filter((tx) => tx.status === "completed");
    const totalRevenue = completedTransactions.reduce(
      (sum, tx) => sum + Number(tx.amount),
      0,
    );
    const orderCount = completedTransactions.length;
    const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;
    const lastPurchaseAt = customerTransactions
      .map((tx) => tx.createdAt)
      .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;
    const churnRiskScore = Number(((index % 10) / 10).toFixed(2));

    return {
      customerId: customer.id,
      totalRevenue: totalRevenue.toFixed(2),
      ltv: (totalRevenue * 1.2).toFixed(2),
      orderCount,
      avgOrderValue: avgOrderValue.toFixed(2),
      lastPurchaseAt,
      churnRiskScore,
      recencyScore: Number(((index % 5) / 5).toFixed(2)),
      frequencyScore: Number(((orderCount % 5) / 5).toFixed(2)),
      monetaryScore: Number(((Math.min(totalRevenue, 1000) / 1000)).toFixed(2)),
    };
  });

  await db.insert(customerMetrics).values(metricsRows).onConflictDoUpdate({
    target: customerMetrics.customerId,
    set: {
      totalRevenue: sql`excluded.total_revenue`,
      ltv: sql`excluded.ltv`,
      orderCount: sql`excluded.order_count`,
      avgOrderValue: sql`excluded.avg_order_value`,
      lastPurchaseAt: sql`excluded.last_purchase_at`,
      churnRiskScore: sql`excluded.churn_risk_score`,
      recencyScore: sql`excluded.recency_score`,
      frequencyScore: sql`excluded.frequency_score`,
      monetaryScore: sql`excluded.monetary_score`,
      updatedAt: new Date(),
    },
  });

  const campaignRows = [
    {
      id: stableUuid("seed-campaign:Spring Activation"),
      name: "Spring Activation",
      subject: "Reconnect with Looply this season",
      message: "<p>We have new offers for your segment.</p>",
      segment: "premium",
      status: "sent" as const,
      recipientCount: finalSeededCustomers.filter((customer) => customer.segment === "premium").length,
      createdBy: managerUserId,
      scheduledAt: null,
      sentAt: new Date(),
    },
    {
      id: stableUuid("seed-campaign:Enterprise Renewal"),
      name: "Enterprise Renewal",
      subject: "Your enterprise plan review",
      message: "<p>Book your renewal review with our team.</p>",
      segment: "enterprise",
      status: "draft" as const,
      recipientCount: finalSeededCustomers.filter((customer) => customer.segment === "enterprise").length,
      createdBy: managerUserId,
      scheduledAt: null,
      sentAt: null,
    },
  ];

  await db.insert(campaigns).values(campaignRows).onConflictDoUpdate({
    target: campaigns.id,
    set: {
      name: sql`excluded.name`,
      subject: sql`excluded.subject`,
      message: sql`excluded.message`,
      segment: sql`excluded.segment`,
      status: sql`excluded.status`,
      recipientCount: sql`excluded.recipient_count`,
      scheduledAt: sql`excluded.scheduled_at`,
      sentAt: sql`excluded.sent_at`,
      createdBy: sql`excluded.created_by`,
      updatedAt: new Date(),
    },
  });

  await db.insert(campaignLogs).values(
    finalSeededCustomers
      .filter((customer) => customer.segment === "premium")
      .slice(0, 5)
      .map((customer, index) => ({
        id: stableUuid(`seed-campaign-log:${campaignRows[0]?.id ?? "spring"}:${customer.email}`),
        campaignId: campaignRows[0]?.id ?? stableUuid("seed-campaign:Spring Activation"),
        email: customer.email,
        status: "sent",
        messageId: `ses-${index + 1}`,
        sentAt: new Date(),
      })),
  ).onConflictDoUpdate({
    target: campaignLogs.id,
    set: {
      campaignId: sql`excluded.campaign_id`,
      email: sql`excluded.email`,
      status: sql`excluded.status`,
      messageId: sql`excluded.message_id`,
      sentAt: sql`excluded.sent_at`,
    },
  });

  await db.insert(documents).values([
    {
      id: stableUuid("seed-document:refund-policy"),
      actorId: adminUserId,
      key: "docs/refund-policy.pdf",
      url: "https://example-bucket.s3.amazonaws.com/docs/refund-policy.pdf",
      fileName: "refund-policy.pdf",
      fileSize: 128_000,
      chunkCount: 12,
      inContext: true,
    },
    {
      id: stableUuid("seed-document:retention-playbook"),
      actorId: managerUserId,
      key: "docs/retention-playbook.pdf",
      url: "https://example-bucket.s3.amazonaws.com/docs/retention-playbook.pdf",
      fileName: "retention-playbook.pdf",
      fileSize: 96_000,
      chunkCount: 9,
      inContext: true,
    },
  ]).onConflictDoUpdate({
    target: documents.key,
    set: {
      actorId: sql`excluded.actor_id`,
      url: sql`excluded.url`,
      fileName: sql`excluded.file_name`,
      fileSize: sql`excluded.file_size`,
      chunkCount: sql`excluded.chunk_count`,
      inContext: sql`excluded.in_context`,
    },
  });

  await db.insert(userMemory).values(
    [
      {
        userId: adminUserId,
        preferredTone: "professional",
        businessType: "saas",
        typicalCampaigns: ["reactivation", "upsell"],
        reportingPrefs: { cadence: "weekly" },
        customContext: "Seeded context for Looply Admin",
      },
      {
        userId: managerUserId,
        preferredTone: "friendly",
        businessType: "saas",
        typicalCampaigns: ["reactivation", "upsell"],
        reportingPrefs: { cadence: "weekly" },
        customContext: "Seeded context for Looply Manager",
      },
      {
        userId: viewerUserId,
        preferredTone: "friendly",
        businessType: "retail",
        typicalCampaigns: ["reactivation", "upsell"],
        reportingPrefs: { cadence: "weekly" },
        customContext: "Seeded context for Looply Viewer",
      },
    ],
  ).onConflictDoUpdate({
    target: userMemory.userId,
    set: {
      preferredTone: sql`excluded.preferred_tone`,
      businessType: sql`excluded.business_type`,
      typicalCampaigns: sql`excluded.typical_campaigns`,
      reportingPrefs: sql`excluded.reporting_prefs`,
      customContext: sql`excluded.custom_context`,
      updatedAt: new Date(),
    },
  });

  await db.insert(conversationMessages).values([
    {
      id: stableUuid("seed-conversation:seed-session-1:user"),
      sessionId: "seed-session-1",
      role: "user",
      content: "Who are my top customers?",
      createdAt: new Date(),
    },
    {
      id: stableUuid("seed-conversation:seed-session-1:assistant"),
      sessionId: "seed-session-1",
      role: "assistant",
      content: "I can help with that using your recent revenue data.",
      createdAt: new Date(),
    },
  ]).onConflictDoUpdate({
    target: conversationMessages.id,
    set: {
      sessionId: sql`excluded.session_id`,
      role: sql`excluded.role`,
      content: sql`excluded.content`,
      createdAt: sql`excluded.created_at`,
    },
  });

  await db.insert(auditLogs).values([
    {
      id: stableUuid("seed-audit:seed.completed"),
      actorId: adminUserId,
      event: "seed.completed",
      resourceType: "database",
      resourceId: null,
      metadata: { users: seedUsers.length, customers: finalSeededCustomers.length },
      ipAddress: "127.0.0.1",
      userAgent: "seed-script",
      timestamp: new Date(),
    },
    {
      id: stableUuid("seed-audit:campaign.sent"),
      actorId: managerUserId,
      event: "campaign.sent",
      resourceType: "campaign",
      resourceId: campaignRows[0]?.id ?? null,
      metadata: { recipients: campaignRows[0]?.recipientCount ?? 0 },
      ipAddress: "127.0.0.1",
      userAgent: "seed-script",
      timestamp: new Date(),
    },
  ]).onConflictDoUpdate({
    target: auditLogs.id,
    set: {
      actorId: sql`excluded.actor_id`,
      event: sql`excluded.event`,
      resourceType: sql`excluded.resource_type`,
      resourceId: sql`excluded.resource_id`,
      metadata: sql`excluded.metadata`,
      ipAddress: sql`excluded.ip_address`,
      userAgent: sql`excluded.user_agent`,
      timestamp: sql`excluded.timestamp`,
    },
  });
}

void seedDatabase()
  .then(() => {
    process.stdout.write("Database seeded successfully.\n");
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
