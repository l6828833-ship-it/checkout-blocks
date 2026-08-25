CREATE TABLE "auditLogs" (
	"id" serial PRIMARY KEY NOT NULL,
	"storeId" integer NOT NULL,
	"actorOpenId" varchar(128),
	"action" varchar(120) NOT NULL,
	"entityType" varchar(80) NOT NULL,
	"entityId" varchar(80),
	"detail" jsonb NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brandKits" (
	"id" serial PRIMARY KEY NOT NULL,
	"storeId" integer NOT NULL,
	"name" varchar(120) NOT NULL,
	"logoUrl" text,
	"primaryColor" varchar(16) NOT NULL,
	"accentColor" varchar(16) NOT NULL,
	"typeDirection" varchar(16) DEFAULT 'modern' NOT NULL,
	"cornerStyle" varchar(16) DEFAULT 'soft' NOT NULL,
	"isDefault" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checkoutModules" (
	"id" serial PRIMARY KEY NOT NULL,
	"storeId" integer NOT NULL,
	"merchantStyleId" integer,
	"moduleType" varchar(80) NOT NULL,
	"title" varchar(160) NOT NULL,
	"content" jsonb NOT NULL,
	"placement" varchar(120) NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"requiresCapability" varchar(120),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "featureCapabilities" (
	"id" serial PRIMARY KEY NOT NULL,
	"storeId" integer NOT NULL,
	"capability" varchar(120) NOT NULL,
	"availability" varchar(16) DEFAULT 'unknown' NOT NULL,
	"reason" text,
	"fallback" text,
	"source" varchar(80) DEFAULT 'manual' NOT NULL,
	"checkedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "merchantStyles" (
	"id" serial PRIMARY KEY NOT NULL,
	"storeId" integer NOT NULL,
	"presetSlug" varchar(100),
	"name" varchar(160) NOT NULL,
	"status" varchar(16) DEFAULT 'draft' NOT NULL,
	"tokens" jsonb NOT NULL,
	"capabilitySnapshot" jsonb NOT NULL,
	"appliedAt" timestamp with time zone,
	"createdByOpenId" varchar(128) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scheduledCampaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"storeId" integer NOT NULL,
	"merchantStyleId" integer NOT NULL,
	"restoreStyleVersionId" integer,
	"name" varchar(160) NOT NULL,
	"startAt" timestamp with time zone NOT NULL,
	"endAt" timestamp with time zone NOT NULL,
	"timezone" varchar(80) NOT NULL,
	"status" varchar(16) DEFAULT 'scheduled' NOT NULL,
	"scheduleCronTaskUid" varchar(65),
	"lastDiagnostic" text,
	"createdByOpenId" varchar(128) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shopifyInstallations" (
	"id" serial PRIMARY KEY NOT NULL,
	"storeId" integer NOT NULL,
	"shopDomain" varchar(255) NOT NULL,
	"staffUserId" varchar(128) NOT NULL,
	"accessTokenCiphertext" text NOT NULL,
	"refreshTokenCiphertext" text,
	"tokenExpiresAt" timestamp with time zone,
	"grantedScopes" text NOT NULL,
	"status" varchar(16) DEFAULT 'active' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stores" (
	"id" serial PRIMARY KEY NOT NULL,
	"shopDomain" varchar(255) NOT NULL,
	"displayName" varchar(255) NOT NULL,
	"ownerOpenId" varchar(128) NOT NULL,
	"planName" varchar(120),
	"status" varchar(16) DEFAULT 'demo' NOT NULL,
	"timezone" varchar(80) DEFAULT 'America/Los_Angeles' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stores_shopDomain_unique" UNIQUE("shopDomain")
);
--> statement-breakpoint
CREATE TABLE "stylePresets" (
	"id" serial PRIMARY KEY NOT NULL,
	"storeId" integer,
	"slug" varchar(100) NOT NULL,
	"name" varchar(120) NOT NULL,
	"descriptor" varchar(255) NOT NULL,
	"category" varchar(80) NOT NULL,
	"tokens" jsonb NOT NULL,
	"isSystem" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "styleVersions" (
	"id" serial PRIMARY KEY NOT NULL,
	"storeId" integer NOT NULL,
	"merchantStyleId" integer NOT NULL,
	"versionNumber" integer NOT NULL,
	"name" varchar(160) NOT NULL,
	"note" text,
	"tokens" jsonb NOT NULL,
	"changeSummary" jsonb NOT NULL,
	"authorOpenId" varchar(128) NOT NULL,
	"isStable" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(128) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" varchar(16) DEFAULT 'user' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
CREATE INDEX "audit_logs_store_created_idx" ON "auditLogs" USING btree ("storeId","createdAt");--> statement-breakpoint
CREATE INDEX "brand_kits_store_idx" ON "brandKits" USING btree ("storeId");--> statement-breakpoint
CREATE INDEX "checkout_modules_store_idx" ON "checkoutModules" USING btree ("storeId");--> statement-breakpoint
CREATE UNIQUE INDEX "capabilities_store_key_unique" ON "featureCapabilities" USING btree ("storeId","capability");--> statement-breakpoint
CREATE INDEX "merchant_styles_store_status_idx" ON "merchantStyles" USING btree ("storeId","status");--> statement-breakpoint
CREATE INDEX "scheduled_campaigns_store_status_idx" ON "scheduledCampaigns" USING btree ("storeId","status");--> statement-breakpoint
CREATE INDEX "scheduled_campaigns_task_uid_idx" ON "scheduledCampaigns" USING btree ("scheduleCronTaskUid");--> statement-breakpoint
CREATE UNIQUE INDEX "shopify_installations_store_unique" ON "shopifyInstallations" USING btree ("storeId");--> statement-breakpoint
CREATE UNIQUE INDEX "shopify_installations_domain_unique" ON "shopifyInstallations" USING btree ("shopDomain");--> statement-breakpoint
CREATE INDEX "stores_owner_idx" ON "stores" USING btree ("ownerOpenId");--> statement-breakpoint
CREATE UNIQUE INDEX "style_presets_scope_slug_unique" ON "stylePresets" USING btree ("storeId","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "style_versions_style_number_unique" ON "styleVersions" USING btree ("merchantStyleId","versionNumber");