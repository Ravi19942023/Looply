/* eslint-disable max-lines -- Seed script is intentionally data-heavy. */
import { createHash } from "node:crypto";

import { config } from "dotenv";
import { eq, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import {
  campaign,
  campaignLog,
  customer,
  customerMetric,
  knowledgeDocument,
  product,
  transaction,
  user,
  userMemory,
} from "./schema";
import { generateHashedPassword } from "./utils";

config({ path: ".env.local" });
config({ path: ".env" });

type SeedUser = {
  email: string;
  id: string;
  name: string;
  role: "admin" | "manager" | "viewer";
};

type SeedCustomer = {
  email: string;
  id: string;
  name: string;
  phone: string | null;
  segment: string;
  tags: string[];
};

type SeedProduct = {
  category: string;
  currency: string;
  id: string;
  name: string;
  price: string;
};

const ADMIN_PASSWORD = "password123";

const seedUsers: SeedUser[] = [
  {
    id: stableUuid("seed-user:admin@looply.ai"),
    email: "admin@looply.ai",
    name: "Looply Admin",
    role: "admin",
  },
  {
    id: stableUuid("seed-user:manager@looply.ai"),
    email: "manager@looply.ai",
    name: "Looply Manager",
    role: "manager",
  },
  {
    id: stableUuid("seed-user:viewer@looply.ai"),
    email: "viewer@looply.ai",
    name: "Looply Viewer",
    role: "viewer",
  },
];

const segments = [
  "general",
  "premium",
  "enterprise",
  "inactive",
  "growth",
] as const;

const baseCustomerProfiles = [
  ["Ava Thompson", "Northstar Wellness"],
  ["Liam Carter", "BrightPath Logistics"],
  ["Mia Rodriguez", "Harbor and Pine Studio"],
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
  ["James Perry", "Oak and Ash Builders"],
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
  ["Levi Rivera", "Fable Books and Gifts"],
] as const;

const syntheticFirstNames = [
  "Adrian",
  "Bianca",
  "Caleb",
  "Daphne",
  "Elias",
  "Freya",
  "Gavin",
  "Hazel",
  "Ian",
  "Jasmine",
  "Kai",
  "Lucia",
  "Miles",
  "Naomi",
  "Orion",
  "Priya",
  "Quinn",
  "Rafael",
  "Selena",
  "Theo",
];

const syntheticLastNames = [
  "Alvarez",
  "Bishop",
  "Cross",
  "Donovan",
  "Ellis",
  "Farrell",
  "Gupta",
  "Hale",
  "Ibarra",
  "Jordan",
  "Khan",
  "Lopez",
  "Madden",
  "Norris",
  "Owens",
  "Pierce",
  "Quintero",
  "Reese",
  "Sato",
  "Vargas",
];

const syntheticCompanies = [
  "Northfield Advisory",
  "Juniper Clinical Group",
  "Mariner Commerce Lab",
  "Summit Freight Network",
  "Cobalt Home Studio",
  "Avenue Dental Care",
  "Vertex Learning Systems",
  "Willow Property Partners",
  "Oakline Manufacturing",
  "Harbor Retail Collective",
  "Pioneer Energy Works",
  "Cedar Wellness Clinic",
  "Signal Media House",
  "Elmwood Vet Partners",
  "Trueform Fitness Lab",
  "Bluecrest Travel Desk",
  "Granite Insurance Group",
  "Aster Bridal Studio",
  "Riverstone Legal Advisors",
  "Morningstar Bakery Co",
  "Sunline Print Works",
  "Peakway Auto Center",
  "Maple Grove Realty",
  "Brightforge Supply Co",
  "Copperfield Events",
  "Sterling Childcare Hub",
  "Openfield Rentals",
  "Everpath Dermatology",
  "Horizon Solar Desk",
  "Monarch Analytics Lab",
];

const productCatalog = [
  ["Looply Inbox Pro", "crm", "89.00", "USD"],
  ["Looply Audience Studio", "crm", "129.00", "USD"],
  ["Looply Revenue Console", "crm", "219.00", "USD"],
  ["Journey Builder", "marketing", "79.00", "USD"],
  ["Campaign Orchestrator", "marketing", "139.00", "USD"],
  ["Retention Intelligence", "analytics", "109.00", "USD"],
  ["Executive Reporting Suite", "analytics", "169.00", "USD"],
  ["Knowledge Cloud", "knowledge", "119.00", "USD"],
  ["Assist Copilot", "ai", "189.00", "USD"],
  ["Lifecycle Automation", "retention", "179.00", "USD"],
  ["Pipeline Forecast Pro", "sales", "149.00", "USD"],
  ["Attribution Explorer", "analytics", "159.00", "USD"],
  ["Customer Health Monitor", "success", "129.00", "USD"],
  ["Offer Personalization Kit", "marketing", "99.00", "USD"],
  ["Renewal Command Center", "retention", "209.00", "USD"],
  ["Voice of Customer Hub", "research", "119.00", "USD"],
  ["Support Workflow Studio", "operations", "109.00", "USD"],
  ["Partner Portal Suite", "b2b", "199.00", "USD"],
  ["Commerce Insight Board", "commerce", "229.00", "USD"],
  ["Growth Experiment Lab", "growth", "149.00", "USD"],
] as const;

function stableUuid(seed: string): string {
  const hash = createHash("sha256").update(seed).digest("hex");
  const part1 = hash.slice(0, 8);
  const part2 = hash.slice(8, 12);
  const part3 = `4${hash.slice(13, 16)}`;
  const variants = ["8", "9", "a", "b"] as const;
  const variant =
    variants[Number.parseInt(hash.slice(16, 18), 16) % variants.length] ?? "8";
  const part4 = `${variant}${hash.slice(17, 20)}`;
  const part5 = hash.slice(20, 32);

  return `${part1}-${part2}-${part3}-${part4}-${part5}`;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildCustomerProfiles(): Array<readonly [string, string]> {
  const syntheticProfiles = syntheticCompanies.map((companyName, index) => {
    const firstName =
      syntheticFirstNames[index % syntheticFirstNames.length] ?? `User${index}`;
    const lastName =
      syntheticLastNames[(index * 3) % syntheticLastNames.length] ?? "Seed";

    return [`${firstName} ${lastName}`, companyName] as const;
  });

  return [...baseCustomerProfiles, ...syntheticProfiles];
}

function buildCustomers(): SeedCustomer[] {
  return buildCustomerProfiles().map(([contactName, companyName], index) => {
    const segment = segments[index % segments.length] ?? "general";
    const emailDomain = `${slugify(companyName)}.com`;
    const businessTags =
      segment === "enterprise"
        ? ["high-value", "b2b", "renewal-priority"]
        : segment === "premium"
          ? ["upsell-ready", "newsletter-engaged"]
          : segment === "inactive"
            ? ["win-back", "at-risk"]
            : segment === "growth"
              ? ["expansion", "beta-friendly"]
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
  return productCatalog.map(([name, category, price, currency]) => ({
    id: stableUuid(`seed-product:${name}`),
    name,
    category,
    price,
    currency,
  }));
}

async function seedDatabase() {
  if (!process.env.POSTGRES_URL) {
    console.log("POSTGRES_URL not defined, skipping seed");
    process.exit(0);
  }

  const connection = postgres(process.env.POSTGRES_URL, { max: 1 });
  const db = drizzle(connection);
  const passwordHash = generateHashedPassword(ADMIN_PASSWORD);

  for (const seedUser of seedUsers) {
    const [existingUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, seedUser.email))
      .limit(1);

    if (existingUser) {
      await db
        .update(user)
        .set({
          name: seedUser.name,
          role: seedUser.role,
          password: passwordHash,
          emailVerified: true,
          isAnonymous: false,
          updatedAt: new Date(),
        })
        .where(eq(user.id, existingUser.id));
    } else {
      await db.insert(user).values({
        id: seedUser.id,
        name: seedUser.name,
        email: seedUser.email,
        role: seedUser.role,
        password: passwordHash,
        emailVerified: true,
        isAnonymous: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  const persistedUsers = await db
    .select({
      id: user.id,
      email: user.email,
      name: user.name,
    })
    .from(user)
    .where(
      inArray(
        user.email,
        seedUsers.map((entry) => entry.email)
      )
    );

  const userByEmail = new Map(
    persistedUsers.map((entry) => [entry.email, entry])
  );
  const adminUser = userByEmail.get("admin@looply.ai");
  const managerUser = userByEmail.get("manager@looply.ai");
  const viewerUser = userByEmail.get("viewer@looply.ai");

  if (!adminUser || !managerUser || !viewerUser) {
    throw new Error("Seed users missing after upsert.");
  }

  await db.execute(sql`
    TRUNCATE TABLE
      "CampaignLog",
      "Campaign",
      "Transaction",
      "CustomerMetric",
      "DocumentEmbedding",
      "KnowledgeDocument",
      "UserMemory",
      "Product",
      "Customer"
    RESTART IDENTITY CASCADE
  `);

  const seededCustomers = buildCustomers();
  const customerCreatedAt = new Date();

  await db.insert(customer).values(
    seededCustomers.map((entry) => ({
      id: entry.id,
      name: entry.name,
      email: entry.email,
      phone: entry.phone,
      segment: entry.segment,
      tags: [...entry.tags],
      createdAt: customerCreatedAt,
      updatedAt: customerCreatedAt,
    }))
  );

  const persistedCustomers = await db
    .select()
    .from(customer)
    .where(
      inArray(
        customer.id,
        seededCustomers.map((entry) => entry.id)
      )
    );

  const seededProducts = buildProducts();
  const productCreatedAt = new Date();

  await db.insert(product).values(
    seededProducts.map((entry) => ({
      id: entry.id,
      name: entry.name,
      category: entry.category,
      price: entry.price,
      currency: entry.currency,
      createdAt: productCreatedAt,
      updatedAt: productCreatedAt,
    }))
  );

  const persistedProducts = await db
    .select()
    .from(product)
    .where(
      inArray(
        product.id,
        seededProducts.map((entry) => entry.id)
      )
    );

  const now = new Date();
  const transactionRows = Array.from({ length: 600 }, (_, index) => {
    const customerRow = persistedCustomers[index % persistedCustomers.length];
    const productRow = persistedProducts[index % persistedProducts.length];

    if (!customerRow || !productRow) {
      throw new Error("Seed prerequisites missing for transactions.");
    }

    const createdAt = new Date(now);
    const segmentAgeOffset =
      customerRow.segment === "inactive"
        ? 120 + (index % 30)
        : customerRow.segment === "enterprise"
          ? index % 20
          : customerRow.segment === "premium"
            ? index % 35
            : index % 75;

    createdAt.setDate(createdAt.getDate() - segmentAgeOffset);
    createdAt.setHours(8 + (index % 11), (index * 11) % 60, 0, 0);

    const segmentMultiplier =
      customerRow.segment === "enterprise"
        ? 4
        : customerRow.segment === "premium"
          ? 2.5
          : customerRow.segment === "growth"
            ? 1.8
            : customerRow.segment === "inactive"
              ? 1.2
              : 1;
    const quantityMultiplier = [1, 1, 1, 2, 2, 3, 4][index % 7] ?? 1;
    const amount = (
      Number(productRow.price) *
      segmentMultiplier *
      quantityMultiplier
    ).toFixed(2);
    const status =
      index % 29 === 0
        ? "failed"
        : index % 17 === 0
          ? "pending"
          : index % 11 === 0
            ? "refunded"
            : "completed";

    return {
      id: stableUuid(
        `seed-transaction:${customerRow.id}:${productRow.id}:${index}`
      ),
      customerId: customerRow.id,
      productId: productRow.id,
      product: productRow.name,
      amount,
      currency: productRow.currency,
      status,
      createdAt,
    };
  });

  await db.insert(transaction).values(transactionRows);

  const metricRows = persistedCustomers.map((customerRow) => {
    const customerTransactions = transactionRows.filter(
      (row) => row.customerId === customerRow.id
    );
    const completedTransactions = customerTransactions.filter(
      (row) => row.status === "completed"
    );
    const totalRevenue = completedTransactions.reduce(
      (sum, row) => sum + Number(row.amount),
      0
    );
    const orderCount = completedTransactions.length;
    const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;
    const lastPurchaseAt =
      completedTransactions
        .map((row) => row.createdAt)
        .sort((left, right) => right.getTime() - left.getTime())[0] ?? null;
    const daysSinceLastPurchase = lastPurchaseAt
      ? Math.max(
          0,
          Math.round(
            (now.getTime() - lastPurchaseAt.getTime()) / (1000 * 60 * 60 * 24)
          )
        )
      : 180;
    const recencyScore = Number(
      Math.max(0, Math.min(1, 1 - daysSinceLastPurchase / 150)).toFixed(2)
    );
    const frequencyScore = Number(Math.min(1, orderCount / 18).toFixed(2));
    const monetaryScore = Number(Math.min(1, totalRevenue / 12_000).toFixed(2));
    const churnRiskScore = Number(
      Math.max(
        0,
        Math.min(
          1,
          1 - (recencyScore * 0.5 + frequencyScore * 0.3 + monetaryScore * 0.2)
        )
      ).toFixed(2)
    );

    return {
      customerId: customerRow.id,
      totalRevenue: totalRevenue.toFixed(2),
      ltv: (totalRevenue * 1.2).toFixed(2),
      orderCount,
      avgOrderValue: avgOrderValue.toFixed(2),
      lastPurchaseAt,
      churnRiskScore: churnRiskScore.toFixed(2),
      recencyScore: recencyScore.toFixed(2),
      frequencyScore: frequencyScore.toFixed(2),
      monetaryScore: monetaryScore.toFixed(2),
      updatedAt: new Date(),
    };
  });

  await db.insert(customerMetric).values(metricRows);

  const campaignRows = [
    {
      id: stableUuid("seed-campaign:Spring Activation"),
      name: "Spring Activation",
      subject: "Reconnect with Looply this season",
      message: "<p>We have new offers for your segment.</p>",
      segment: "premium",
      status: "sent",
      recipientCount: persistedCustomers.filter(
        (entry) => entry.segment === "premium"
      ).length,
      recipients: persistedCustomers
        .filter((entry) => entry.segment === "premium")
        .slice(0, 14)
        .map((entry) => ({ email: entry.email, name: entry.name })),
      createdBy: managerUser.id,
      sentAt: new Date(),
    },
    {
      id: stableUuid("seed-campaign:Enterprise Renewal"),
      name: "Enterprise Renewal",
      subject: "Your enterprise plan review",
      message: "<p>Book your renewal review with our team.</p>",
      segment: "enterprise",
      status: "draft",
      recipientCount: persistedCustomers.filter(
        (entry) => entry.segment === "enterprise"
      ).length,
      recipients: persistedCustomers
        .filter((entry) => entry.segment === "enterprise")
        .slice(0, 12)
        .map((entry) => ({ email: entry.email, name: entry.name })),
      createdBy: managerUser.id,
      sentAt: null,
    },
    {
      id: stableUuid("seed-campaign:Growth Accelerator"),
      name: "Growth Accelerator",
      subject: "New workflow packs for scaling teams",
      message: "<p>See what is new for fast-growing teams.</p>",
      segment: "growth",
      status: "sent",
      recipientCount: persistedCustomers.filter(
        (entry) => entry.segment === "growth"
      ).length,
      recipients: persistedCustomers
        .filter((entry) => entry.segment === "growth")
        .slice(0, 12)
        .map((entry) => ({ email: entry.email, name: entry.name })),
      createdBy: adminUser.id,
      sentAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2),
    },
    {
      id: stableUuid("seed-campaign:Win Back Wave"),
      name: "Win Back Wave",
      subject: "Come back and unlock a tailored success plan",
      message: "<p>We prepared a reactivation path just for you.</p>",
      segment: "inactive",
      status: "draft",
      recipientCount: persistedCustomers.filter(
        (entry) => entry.segment === "inactive"
      ).length,
      recipients: persistedCustomers
        .filter((entry) => entry.segment === "inactive")
        .slice(0, 12)
        .map((entry) => ({ email: entry.email, name: entry.name })),
      createdBy: adminUser.id,
      sentAt: null,
    },
  ] as const;

  await db.insert(campaign).values(
    campaignRows.map((entry) => ({
      ...entry,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))
  );

  const sentCampaigns = campaignRows.filter((entry) => entry.status === "sent");

  for (const activeCampaign of sentCampaigns) {
    for (const [index, recipient] of activeCampaign.recipients
      .slice(0, 8)
      .entries()) {
      const messageId = `${slugify(activeCampaign.name)}-${index + 1}`;
      await db.insert(campaignLog).values({
        id: stableUuid(
          `seed-campaign-log:${activeCampaign.id}:${recipient.email}`
        ),
        campaignId: activeCampaign.id,
        email: recipient.email,
        status: "sent",
        messageId,
        sentAt: new Date(),
      });
    }
  }

  const memoryRows = [
    {
      userId: adminUser.id,
      preferredTone: "professional",
      businessType: "saas",
      typicalCampaigns: ["reactivation", "upsell", "renewal"],
      reportingPrefs: { cadence: "weekly", format: "executive-summary" },
      customContext:
        "Focus on enterprise retention, weekly executive reporting, and sales-ready expansion insights.",
    },
    {
      userId: managerUser.id,
      preferredTone: "friendly",
      businessType: "saas",
      typicalCampaigns: ["reactivation", "upsell", "nurture"],
      reportingPrefs: { cadence: "weekly", format: "team-dashboard" },
      customContext:
        "Marketing manager prefers concise recommendations tied to segment performance and recent campaign outcomes.",
    },
    {
      userId: viewerUser.id,
      preferredTone: "friendly",
      businessType: "retail",
      typicalCampaigns: ["reactivation", "seasonal"],
      reportingPrefs: { cadence: "monthly", format: "snapshot" },
      customContext:
        "Viewer account is read-mostly and often requests high-level customer and revenue summaries.",
    },
  ] as const;

  await db.insert(userMemory).values(
    memoryRows.map((entry) => ({
      userId: entry.userId,
      preferredTone: entry.preferredTone,
      businessType: entry.businessType,
      typicalCampaigns: [...entry.typicalCampaigns],
      reportingPrefs: entry.reportingPrefs,
      customContext: entry.customContext,
      updatedAt: new Date(),
    }))
  );

  const knowledgeEntries = [
    {
      id: stableUuid("seed-knowledge:onboarding-playbook"),
      title: "Onboarding Playbook",
      content:
        "New users should receive a welcome email within 5 minutes, a checklist on day 1, a success review on day 7, and a feature adoption nudge on day 14.",
    },
    {
      id: stableUuid("seed-knowledge:retention-strategy"),
      title: "Retention Strategy",
      content:
        "Customers inactive for more than 90 days should enter the churn-recovery segment and receive a two-step retention campaign with a value reminder and a customer success follow-up.",
    },
    {
      id: stableUuid("seed-knowledge:campaign-approval-policy"),
      title: "Campaign Approval Policy",
      content:
        "High-volume campaigns must be reviewed in chat using an approval card before dispatch. Drafts should never be auto-sent without explicit confirmation.",
    },
    {
      id: stableUuid("seed-knowledge:refund-policy"),
      title: "Refund Policy",
      content:
        "Refund requests are reviewed within 3 business days. Approved refunds are issued back to the original payment method and tagged for finance follow-up.",
    },
    {
      id: stableUuid("seed-knowledge:executive-reporting"),
      title: "Executive Reporting Cadence",
      content:
        "Executive KPI reporting is generated weekly with revenue, orders, customer growth, campaign performance, churn-risk movement, and top account highlights.",
    },
    {
      id: stableUuid("seed-knowledge:premium-upsell-playbook"),
      title: "Premium Upsell Playbook",
      content:
        "Premium customers with rising order frequency should receive expansion offers tied to advanced automation, reporting, and customer health workflows.",
    },
    {
      id: stableUuid("seed-knowledge:enterprise-renewal-script"),
      title: "Enterprise Renewal Script",
      content:
        "Enterprise renewals should lead with quarterly outcomes, forecasted savings, and a proposed roadmap review with account stakeholders.",
    },
    {
      id: stableUuid("seed-knowledge:win-back-framework"),
      title: "Win-Back Framework",
      content:
        "Inactive accounts respond better to a short incentive email followed by a human check-in than to repeated generic promotional blasts.",
    },
    {
      id: stableUuid("seed-knowledge:health-score-guide"),
      title: "Customer Health Score Guide",
      content:
        "Health scoring should combine recency, frequency, monetary value, and recent support sentiment. Escalate accounts with low recency and shrinking order value.",
    },
    {
      id: stableUuid("seed-knowledge:support-automation-notes"),
      title: "Support Automation Notes",
      content:
        "Customers adopting support workflow automation usually expand into lifecycle campaigns within two quarters if onboarding milestones are met.",
    },
  ] as const;

  await db.insert(knowledgeDocument).values(
    knowledgeEntries.map((entry) => ({
      id: entry.id,
      title: entry.title,
      content: entry.content,
      createdBy: adminUser.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))
  );

  const seededEnterpriseCount = persistedCustomers.filter(
    (entry) => entry.segment === "enterprise"
  ).length;
  const seededPremiumCount = persistedCustomers.filter(
    (entry) => entry.segment === "premium"
  ).length;
  const seededInactiveCount = persistedCustomers.filter(
    (entry) => entry.segment === "inactive"
  ).length;

  await connection.end();
  console.log(`Seeded ${persistedCustomers.length} customers`);
  console.log(`Seeded ${persistedProducts.length} products`);
  console.log(`Seeded ${transactionRows.length} transactions`);
  console.log(
    `Segment counts: ${seededEnterpriseCount} enterprise, ${seededPremiumCount} premium, ${seededInactiveCount} inactive`
  );
  console.log(`Login with admin@looply.ai / ${ADMIN_PASSWORD}`);
}

seedDatabase().catch((error) => {
  console.error("Seed failed");
  console.error(error);
  process.exit(1);
});
