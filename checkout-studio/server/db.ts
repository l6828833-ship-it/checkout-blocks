import { createHash } from "crypto";
import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { auditLogs, featureCapabilities, InsertUser, merchantStyles, scheduledCampaigns, shopifyInstallations, stores, styleVersions, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _client: ReturnType<typeof postgres> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // Supabase recommends the connection pooler for hosted applications. Disabling
      // prepared statements keeps this client compatible with transaction-pool mode.
      _client = postgres(process.env.DATABASE_URL, { prepare: false, max: 5 });
      _db = drizzle(_client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: { ...updateSet, updatedAt: new Date() },
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function findOrCreateDemoStore(ownerOpenId: string, displayName: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");

  const current = await db.select().from(stores).where(eq(stores.ownerOpenId, ownerOpenId)).limit(1);
  if (current[0]) return current[0];

  await db.insert(stores).values({
    ownerOpenId,
    displayName,
    shopDomain: `pending-${ownerOpenId.slice(0, 28)}.checkout-studio.local`,
    status: "demo",
    timezone: "America/Los_Angeles",
  });
  const created = await db.select().from(stores).where(eq(stores.ownerOpenId, ownerOpenId)).limit(1);
  if (!created[0]) throw new Error("Unable to create demo store");
  return created[0];
}

/** Returns the merchant store already established by a verified Shopify ID token. */
export async function getStoreByOwnerOpenId(ownerOpenId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const records = await db.select().from(stores).where(eq(stores.ownerOpenId, ownerOpenId)).limit(1);
  return records[0] ?? null;
}

function embeddedShopifyOwnerId(shopDomain: string, staffUserId: string) {
  const shopHash = createHash("sha256").update(shopDomain).digest("hex").slice(0, 20);
  const staffHash = createHash("sha256").update(staffUserId).digest("hex").slice(0, 20);
  return `shopify:${shopHash}:${staffHash}`;
}

export async function findOrCreateShopifyStore(input: {
  shopDomain: string;
  staffUserId: string;
  displayName?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");

  const ownerOpenId = embeddedShopifyOwnerId(input.shopDomain, input.staffUserId);
  const existing = await db.select().from(stores).where(eq(stores.shopDomain, input.shopDomain)).limit(1);
  if (existing[0]) {
    await db.update(stores).set({ ownerOpenId, displayName: input.displayName ?? existing[0].displayName, status: "connected" }).where(eq(stores.id, existing[0].id));
    return { ...existing[0], ownerOpenId, displayName: input.displayName ?? existing[0].displayName, status: "connected" as const };
  }

  await db.insert(stores).values({
    ownerOpenId,
    displayName: input.displayName ?? input.shopDomain.replace(".myshopify.com", ""),
    shopDomain: input.shopDomain,
    status: "connected",
    timezone: "America/Los_Angeles",
  });
  const created = await db.select().from(stores).where(eq(stores.shopDomain, input.shopDomain)).limit(1);
  if (!created[0]) throw new Error("Unable to create Shopify store");
  return created[0];
}

export async function getShopifyInstallationByShopDomain(shopDomain: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const records = await db.select().from(shopifyInstallations).where(eq(shopifyInstallations.shopDomain, shopDomain)).limit(1);
  return records[0] ?? null;
}

export async function saveShopifyInstallation(input: {
  storeId: number;
  shopDomain: string;
  staffUserId: string;
  accessTokenCiphertext: string;
  refreshTokenCiphertext?: string | null;
  tokenExpiresAt?: Date | null;
  grantedScopes: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");

  await db.insert(shopifyInstallations).values({
    ...input,
    refreshTokenCiphertext: input.refreshTokenCiphertext ?? null,
    tokenExpiresAt: input.tokenExpiresAt ?? null,
    status: "active",
  }).onConflictDoUpdate({
    target: shopifyInstallations.shopDomain,
    set: {
      staffUserId: input.staffUserId,
      accessTokenCiphertext: input.accessTokenCiphertext,
      refreshTokenCiphertext: input.refreshTokenCiphertext ?? null,
      tokenExpiresAt: input.tokenExpiresAt ?? null,
      grantedScopes: input.grantedScopes,
      status: "active",
      updatedAt: new Date(),
    },
  });
}

export async function upsertFeatureCapability(input: {
  storeId: number;
  capability: string;
  availability: "available" | "limited" | "unavailable" | "unknown";
  reason: string;
  fallback: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await db.insert(featureCapabilities).values({
    ...input,
    source: "shopify-admin-graphql",
    checkedAt: new Date(),
  }).onConflictDoUpdate({
    target: [featureCapabilities.storeId, featureCapabilities.capability],
    set: {
      availability: input.availability,
      reason: input.reason,
      fallback: input.fallback,
      source: "shopify-admin-graphql",
      checkedAt: new Date(),
    },
  });
}

export async function listMerchantStyles(storeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  return db.select().from(merchantStyles).where(eq(merchantStyles.storeId, storeId)).orderBy(desc(merchantStyles.updatedAt));
}

export async function getMerchantStyleForStore(storeId: number, styleId: number) {
  const records = await listMerchantStyles(storeId);
  return records.find(style => style.id === styleId) ?? null;
}

export async function listStyleVersions(storeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  return db.select().from(styleVersions)
    .where(eq(styleVersions.storeId, storeId))
    .orderBy(desc(styleVersions.createdAt));
}

export async function createMerchantStyle(input: {
  storeId: number;
  name: string;
  presetSlug?: string;
  tokens: Record<string, unknown>;
  createdByOpenId: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await db.insert(merchantStyles).values({
    ...input,
    presetSlug: input.presetSlug ?? null,
    capabilitySnapshot: { state: "not_connected", checkedAt: new Date().toISOString() },
    status: "draft",
  });
  const records = await listMerchantStyles(input.storeId);
  const style = records[0] ?? null;
  if (!style) return null;

  await db.insert(styleVersions).values({
    storeId: input.storeId,
    merchantStyleId: style.id,
    versionNumber: 1,
    name: input.name,
    tokens: input.tokens,
    changeSummary: ["Initial draft created"],
    authorOpenId: input.createdByOpenId,
    isStable: false,
  });
  return style;
}

export async function recordReviewedShopifyPublish(input: {
  storeId: number;
  merchantStyleId: number;
  actorOpenId: string;
  configurationId: string;
  previousConfiguration: Record<string, unknown>;
  appliedConfiguration: Record<string, unknown>;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const appliedAt = new Date();
  await db.update(merchantStyles).set({
    status: "published",
    appliedAt,
    capabilitySnapshot: { state: "ready", configurationId: input.configurationId, checkedAt: appliedAt.toISOString() },
  }).where(eq(merchantStyles.id, input.merchantStyleId));
  await db.update(styleVersions).set({ isStable: true })
    .where(eq(styleVersions.merchantStyleId, input.merchantStyleId));
  await db.insert(auditLogs).values({
    storeId: input.storeId,
    actorOpenId: input.actorOpenId,
    action: "shopify.configuration.publish",
    entityType: "checkout_and_accounts_configuration",
    entityId: input.configurationId,
    detail: {
      merchantStyleId: input.merchantStyleId,
      previousConfiguration: input.previousConfiguration,
      appliedConfiguration: input.appliedConfiguration,
      reviewedAt: appliedAt.toISOString(),
    },
  });
}

export async function getLatestShopifyPublishAudit(storeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const records = await db.select().from(auditLogs)
    .where(eq(auditLogs.storeId, storeId))
    .orderBy(desc(auditLogs.createdAt));
  return records.find(record => record.action === "shopify.configuration.publish") ?? null;
}

export async function recordShopifyConfigurationRollback(input: {
  storeId: number;
  actorOpenId: string;
  configurationId: string;
  restoredFromAuditId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await db.insert(auditLogs).values({
    storeId: input.storeId,
    actorOpenId: input.actorOpenId,
    action: "shopify.configuration.rollback",
    entityType: "checkout_and_accounts_configuration",
    entityId: input.configurationId,
    detail: { restoredFromAuditId: input.restoredFromAuditId, restoredAt: new Date().toISOString() },
  });
}

export async function createBlockedCampaign(input: {
  storeId: number;
  merchantStyleId: number;
  name: string;
  startAt: Date;
  endAt: Date;
  timezone: string;
  createdByOpenId: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await db.insert(scheduledCampaigns).values({
    ...input,
    status: "blocked",
    lastDiagnostic: "Waiting for authorized Shopify connection and capability validation before a schedule can be activated.",
  });
  const campaigns = await db.select().from(scheduledCampaigns)
    .where(eq(scheduledCampaigns.storeId, input.storeId))
    .orderBy(desc(scheduledCampaigns.createdAt));
  return campaigns[0] ?? null;
}

export async function listScheduledCampaigns(storeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  return db.select().from(scheduledCampaigns)
    .where(eq(scheduledCampaigns.storeId, storeId))
    .orderBy(desc(scheduledCampaigns.startAt));
}

export async function getCampaignByTaskUid(taskUid: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const campaigns = await db.select().from(scheduledCampaigns)
    .where(eq(scheduledCampaigns.scheduleCronTaskUid, taskUid));
  return campaigns[0] ?? null;
}

export async function updateCampaignDiagnostic(
  campaignId: number,
  status: "blocked" | "active" | "completed" | "paused" | "cancelled",
  diagnostic: string,
) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await db.update(scheduledCampaigns).set({ status, lastDiagnostic: diagnostic })
    .where(eq(scheduledCampaigns.id, campaignId));
}
