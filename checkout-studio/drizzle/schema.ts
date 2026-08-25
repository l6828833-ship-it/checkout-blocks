import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

const userRoles = ["user", "admin"] as const;
const storeStatuses = ["demo", "connected", "uninstalled", "suspended"] as const;
const installationStatuses = ["active", "revoked"] as const;
const typeDirections = ["modern", "editorial", "friendly", "technical"] as const;
const cornerStyles = ["soft", "rounded", "sharp"] as const;
const styleStatuses = ["draft", "review", "published", "archived"] as const;
const campaignStatuses = ["scheduled", "active", "completed", "paused", "blocked", "cancelled"] as const;
const capabilityAvailabilities = ["available", "limited", "unavailable", "unknown"] as const;

const updatedAt = () => timestamp("updatedAt", { withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull();
const createdAt = () => timestamp("createdAt", { withTimezone: true }).defaultNow().notNull();

/** Core merchant identity boundary. Shopify embedded users are represented by deterministic open IDs. */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 128 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: varchar("role", { length: 16, enum: userRoles }).default("user").notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
  lastSignedIn: timestamp("lastSignedIn", { withTimezone: true }).defaultNow().notNull(),
});

/** A merchant installation boundary. Every configuration record is scoped to one store. */
export const stores = pgTable("stores", {
  id: serial("id").primaryKey(),
  shopDomain: varchar("shopDomain", { length: 255 }).notNull().unique(),
  displayName: varchar("displayName", { length: 255 }).notNull(),
  ownerOpenId: varchar("ownerOpenId", { length: 128 }).notNull(),
  planName: varchar("planName", { length: 120 }),
  status: varchar("status", { length: 16, enum: storeStatuses }).default("demo").notNull(),
  timezone: varchar("timezone", { length: 80 }).default("America/Los_Angeles").notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [index("stores_owner_idx").on(table.ownerOpenId)]);

/** Server-only encrypted tokens acquired through Shopify embedded-app token exchange. */
export const shopifyInstallations = pgTable("shopifyInstallations", {
  id: serial("id").primaryKey(),
  storeId: integer("storeId").notNull(),
  shopDomain: varchar("shopDomain", { length: 255 }).notNull(),
  staffUserId: varchar("staffUserId", { length: 128 }).notNull(),
  accessTokenCiphertext: text("accessTokenCiphertext").notNull(),
  refreshTokenCiphertext: text("refreshTokenCiphertext"),
  tokenExpiresAt: timestamp("tokenExpiresAt", { withTimezone: true }),
  grantedScopes: text("grantedScopes").notNull(),
  status: varchar("status", { length: 16, enum: installationStatuses }).default("active").notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  uniqueIndex("shopify_installations_store_unique").on(table.storeId),
  uniqueIndex("shopify_installations_domain_unique").on(table.shopDomain),
]);

export const brandKits = pgTable("brandKits", {
  id: serial("id").primaryKey(),
  storeId: integer("storeId").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  logoUrl: text("logoUrl"),
  primaryColor: varchar("primaryColor", { length: 16 }).notNull(),
  accentColor: varchar("accentColor", { length: 16 }).notNull(),
  typeDirection: varchar("typeDirection", { length: 16, enum: typeDirections }).default("modern").notNull(),
  cornerStyle: varchar("cornerStyle", { length: 16, enum: cornerStyles }).default("soft").notNull(),
  isDefault: boolean("isDefault").default(false).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [index("brand_kits_store_idx").on(table.storeId)]);

export const stylePresets = pgTable("stylePresets", {
  id: serial("id").primaryKey(),
  storeId: integer("storeId"),
  slug: varchar("slug", { length: 100 }).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  descriptor: varchar("descriptor", { length: 255 }).notNull(),
  category: varchar("category", { length: 80 }).notNull(),
  tokens: jsonb("tokens").$type<Record<string, unknown>>().notNull(),
  isSystem: boolean("isSystem").default(false).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [uniqueIndex("style_presets_scope_slug_unique").on(table.storeId, table.slug)]);

export const merchantStyles = pgTable("merchantStyles", {
  id: serial("id").primaryKey(),
  storeId: integer("storeId").notNull(),
  presetSlug: varchar("presetSlug", { length: 100 }),
  name: varchar("name", { length: 160 }).notNull(),
  status: varchar("status", { length: 16, enum: styleStatuses }).default("draft").notNull(),
  tokens: jsonb("tokens").$type<Record<string, unknown>>().notNull(),
  capabilitySnapshot: jsonb("capabilitySnapshot").$type<Record<string, unknown>>().notNull(),
  appliedAt: timestamp("appliedAt", { withTimezone: true }),
  createdByOpenId: varchar("createdByOpenId", { length: 128 }).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [index("merchant_styles_store_status_idx").on(table.storeId, table.status)]);

export const styleVersions = pgTable("styleVersions", {
  id: serial("id").primaryKey(),
  storeId: integer("storeId").notNull(),
  merchantStyleId: integer("merchantStyleId").notNull(),
  versionNumber: integer("versionNumber").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  note: text("note"),
  tokens: jsonb("tokens").$type<Record<string, unknown>>().notNull(),
  changeSummary: jsonb("changeSummary").$type<string[]>().notNull(),
  authorOpenId: varchar("authorOpenId", { length: 128 }).notNull(),
  isStable: boolean("isStable").default(false).notNull(),
  createdAt: createdAt(),
}, (table) => [uniqueIndex("style_versions_style_number_unique").on(table.merchantStyleId, table.versionNumber)]);

export const checkoutModules = pgTable("checkoutModules", {
  id: serial("id").primaryKey(),
  storeId: integer("storeId").notNull(),
  merchantStyleId: integer("merchantStyleId"),
  moduleType: varchar("moduleType", { length: 80 }).notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  content: jsonb("content").$type<Record<string, unknown>>().notNull(),
  placement: varchar("placement", { length: 120 }).notNull(),
  enabled: boolean("enabled").default(false).notNull(),
  requiresCapability: varchar("requiresCapability", { length: 120 }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [index("checkout_modules_store_idx").on(table.storeId)]);

export const scheduledCampaigns = pgTable("scheduledCampaigns", {
  id: serial("id").primaryKey(),
  storeId: integer("storeId").notNull(),
  merchantStyleId: integer("merchantStyleId").notNull(),
  restoreStyleVersionId: integer("restoreStyleVersionId"),
  name: varchar("name", { length: 160 }).notNull(),
  startAt: timestamp("startAt", { withTimezone: true }).notNull(),
  endAt: timestamp("endAt", { withTimezone: true }).notNull(),
  timezone: varchar("timezone", { length: 80 }).notNull(),
  status: varchar("status", { length: 16, enum: campaignStatuses }).default("scheduled").notNull(),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  lastDiagnostic: text("lastDiagnostic"),
  createdByOpenId: varchar("createdByOpenId", { length: 128 }).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (table) => [
  index("scheduled_campaigns_store_status_idx").on(table.storeId, table.status),
  index("scheduled_campaigns_task_uid_idx").on(table.scheduleCronTaskUid),
]);

export const auditLogs = pgTable("auditLogs", {
  id: serial("id").primaryKey(),
  storeId: integer("storeId").notNull(),
  actorOpenId: varchar("actorOpenId", { length: 128 }),
  action: varchar("action", { length: 120 }).notNull(),
  entityType: varchar("entityType", { length: 80 }).notNull(),
  entityId: varchar("entityId", { length: 80 }),
  detail: jsonb("detail").$type<Record<string, unknown>>().notNull(),
  createdAt: createdAt(),
}, (table) => [index("audit_logs_store_created_idx").on(table.storeId, table.createdAt)]);

export const featureCapabilities = pgTable("featureCapabilities", {
  id: serial("id").primaryKey(),
  storeId: integer("storeId").notNull(),
  capability: varchar("capability", { length: 120 }).notNull(),
  availability: varchar("availability", { length: 16, enum: capabilityAvailabilities }).default("unknown").notNull(),
  reason: text("reason"),
  fallback: text("fallback"),
  source: varchar("source", { length: 80 }).default("manual").notNull(),
  checkedAt: timestamp("checkedAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex("capabilities_store_key_unique").on(table.storeId, table.capability)]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
