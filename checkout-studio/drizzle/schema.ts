import {
  boolean,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/** A merchant installation boundary. All configuration records are scoped to this store. */
export const stores = mysqlTable("stores", {
  id: int("id").autoincrement().primaryKey(),
  shopDomain: varchar("shopDomain", { length: 255 }).notNull().unique(),
  displayName: varchar("displayName", { length: 255 }).notNull(),
  ownerOpenId: varchar("ownerOpenId", { length: 64 }).notNull(),
  planName: varchar("planName", { length: 120 }),
  status: mysqlEnum("status", ["demo", "connected", "uninstalled", "suspended"]).default("demo").notNull(),
  timezone: varchar("timezone", { length: 80 }).default("America/Los_Angeles").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("stores_owner_idx").on(table.ownerOpenId)]);

/**
 * Server-only credentials acquired through Shopify embedded-app token exchange.
 * Token values are encrypted before persistence and are never returned to the client.
 */
export const shopifyInstallations = mysqlTable("shopifyInstallations", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  shopDomain: varchar("shopDomain", { length: 255 }).notNull(),
  staffUserId: varchar("staffUserId", { length: 128 }).notNull(),
  accessTokenCiphertext: text("accessTokenCiphertext").notNull(),
  refreshTokenCiphertext: text("refreshTokenCiphertext"),
  tokenExpiresAt: timestamp("tokenExpiresAt"),
  grantedScopes: text("grantedScopes").notNull(),
  status: mysqlEnum("status", ["active", "revoked"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("shopify_installations_store_unique").on(table.storeId),
  uniqueIndex("shopify_installations_domain_unique").on(table.shopDomain),
]);

export const brandKits = mysqlTable("brandKits", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  logoUrl: text("logoUrl"),
  primaryColor: varchar("primaryColor", { length: 16 }).notNull(),
  accentColor: varchar("accentColor", { length: 16 }).notNull(),
  typeDirection: mysqlEnum("typeDirection", ["modern", "editorial", "friendly", "technical"]).default("modern").notNull(),
  cornerStyle: mysqlEnum("cornerStyle", ["soft", "rounded", "sharp"]).default("soft").notNull(),
  isDefault: boolean("isDefault").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("brand_kits_store_idx").on(table.storeId)]);

export const stylePresets = mysqlTable("stylePresets", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId"),
  slug: varchar("slug", { length: 100 }).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  descriptor: varchar("descriptor", { length: 255 }).notNull(),
  category: varchar("category", { length: 80 }).notNull(),
  tokens: json("tokens").$type<Record<string, unknown>>().notNull(),
  isSystem: boolean("isSystem").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("style_presets_scope_slug_unique").on(table.storeId, table.slug)]);

export const merchantStyles = mysqlTable("merchantStyles", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  presetSlug: varchar("presetSlug", { length: 100 }),
  name: varchar("name", { length: 160 }).notNull(),
  status: mysqlEnum("status", ["draft", "review", "published", "archived"]).default("draft").notNull(),
  tokens: json("tokens").$type<Record<string, unknown>>().notNull(),
  capabilitySnapshot: json("capabilitySnapshot").$type<Record<string, unknown>>().notNull(),
  appliedAt: timestamp("appliedAt"),
  createdByOpenId: varchar("createdByOpenId", { length: 64 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("merchant_styles_store_status_idx").on(table.storeId, table.status)]);

export const styleVersions = mysqlTable("styleVersions", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  merchantStyleId: int("merchantStyleId").notNull(),
  versionNumber: int("versionNumber").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  note: text("note"),
  tokens: json("tokens").$type<Record<string, unknown>>().notNull(),
  changeSummary: json("changeSummary").$type<string[]>().notNull(),
  authorOpenId: varchar("authorOpenId", { length: 64 }).notNull(),
  isStable: boolean("isStable").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [uniqueIndex("style_versions_style_number_unique").on(table.merchantStyleId, table.versionNumber)]);

export const checkoutModules = mysqlTable("checkoutModules", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  merchantStyleId: int("merchantStyleId"),
  moduleType: varchar("moduleType", { length: 80 }).notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  content: json("content").$type<Record<string, unknown>>().notNull(),
  placement: varchar("placement", { length: 120 }).notNull(),
  enabled: boolean("enabled").default(false).notNull(),
  requiresCapability: varchar("requiresCapability", { length: 120 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("checkout_modules_store_idx").on(table.storeId)]);

export const scheduledCampaigns = mysqlTable("scheduledCampaigns", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  merchantStyleId: int("merchantStyleId").notNull(),
  restoreStyleVersionId: int("restoreStyleVersionId"),
  name: varchar("name", { length: 160 }).notNull(),
  startAt: timestamp("startAt").notNull(),
  endAt: timestamp("endAt").notNull(),
  timezone: varchar("timezone", { length: 80 }).notNull(),
  status: mysqlEnum("status", ["scheduled", "active", "completed", "paused", "blocked", "cancelled"]).default("scheduled").notNull(),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  lastDiagnostic: text("lastDiagnostic"),
  createdByOpenId: varchar("createdByOpenId", { length: 64 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("scheduled_campaigns_store_status_idx").on(table.storeId, table.status),
  index("scheduled_campaigns_task_uid_idx").on(table.scheduleCronTaskUid),
]);

export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  actorOpenId: varchar("actorOpenId", { length: 64 }),
  action: varchar("action", { length: 120 }).notNull(),
  entityType: varchar("entityType", { length: 80 }).notNull(),
  entityId: varchar("entityId", { length: 80 }),
  detail: json("detail").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("audit_logs_store_created_idx").on(table.storeId, table.createdAt)]);

export const featureCapabilities = mysqlTable("featureCapabilities", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  capability: varchar("capability", { length: 120 }).notNull(),
  availability: mysqlEnum("availability", ["available", "limited", "unavailable", "unknown"]).default("unknown").notNull(),
  reason: text("reason"),
  fallback: text("fallback"),
  source: varchar("source", { length: 80 }).default("manual").notNull(),
  checkedAt: timestamp("checkedAt").defaultNow().notNull(),
}, (table) => [uniqueIndex("capabilities_store_key_unique").on(table.storeId, table.capability)]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
