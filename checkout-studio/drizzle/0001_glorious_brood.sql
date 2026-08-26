CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storeId` int NOT NULL,
	`actorOpenId` varchar(64),
	`action` varchar(120) NOT NULL,
	`entityType` varchar(80) NOT NULL,
	`entityId` varchar(80),
	`detail` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `brandKits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storeId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`logoUrl` text,
	`primaryColor` varchar(16) NOT NULL,
	`accentColor` varchar(16) NOT NULL,
	`typeDirection` enum('modern','editorial','friendly','technical') NOT NULL DEFAULT 'modern',
	`cornerStyle` enum('soft','rounded','sharp') NOT NULL DEFAULT 'soft',
	`isDefault` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brandKits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `checkoutModules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storeId` int NOT NULL,
	`merchantStyleId` int,
	`moduleType` varchar(80) NOT NULL,
	`title` varchar(160) NOT NULL,
	`content` json NOT NULL,
	`placement` varchar(120) NOT NULL,
	`enabled` boolean NOT NULL DEFAULT false,
	`requiresCapability` varchar(120),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `checkoutModules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `featureCapabilities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storeId` int NOT NULL,
	`capability` varchar(120) NOT NULL,
	`availability` enum('available','limited','unavailable','unknown') NOT NULL DEFAULT 'unknown',
	`reason` text,
	`fallback` text,
	`source` varchar(80) NOT NULL DEFAULT 'manual',
	`checkedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `featureCapabilities_id` PRIMARY KEY(`id`),
	CONSTRAINT `capabilities_store_key_unique` UNIQUE(`storeId`,`capability`)
);
--> statement-breakpoint
CREATE TABLE `merchantStyles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storeId` int NOT NULL,
	`presetSlug` varchar(100),
	`name` varchar(160) NOT NULL,
	`status` enum('draft','review','published','archived') NOT NULL DEFAULT 'draft',
	`tokens` json NOT NULL,
	`capabilitySnapshot` json NOT NULL,
	`appliedAt` timestamp,
	`createdByOpenId` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `merchantStyles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scheduledCampaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storeId` int NOT NULL,
	`merchantStyleId` int NOT NULL,
	`restoreStyleVersionId` int,
	`name` varchar(160) NOT NULL,
	`startAt` timestamp NOT NULL,
	`endAt` timestamp NOT NULL,
	`timezone` varchar(80) NOT NULL,
	`status` enum('scheduled','active','completed','paused','blocked','cancelled') NOT NULL DEFAULT 'scheduled',
	`scheduleCronTaskUid` varchar(65),
	`lastDiagnostic` text,
	`createdByOpenId` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scheduledCampaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shopDomain` varchar(255) NOT NULL,
	`displayName` varchar(255) NOT NULL,
	`ownerOpenId` varchar(64) NOT NULL,
	`planName` varchar(120),
	`status` enum('demo','connected','uninstalled','suspended') NOT NULL DEFAULT 'demo',
	`timezone` varchar(80) NOT NULL DEFAULT 'America/Los_Angeles',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stores_id` PRIMARY KEY(`id`),
	CONSTRAINT `stores_shopDomain_unique` UNIQUE(`shopDomain`)
);
--> statement-breakpoint
CREATE TABLE `stylePresets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storeId` int,
	`slug` varchar(100) NOT NULL,
	`name` varchar(120) NOT NULL,
	`descriptor` varchar(255) NOT NULL,
	`category` varchar(80) NOT NULL,
	`tokens` json NOT NULL,
	`isSystem` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stylePresets_id` PRIMARY KEY(`id`),
	CONSTRAINT `style_presets_scope_slug_unique` UNIQUE(`storeId`,`slug`)
);
--> statement-breakpoint
CREATE TABLE `styleVersions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storeId` int NOT NULL,
	`merchantStyleId` int NOT NULL,
	`versionNumber` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`note` text,
	`tokens` json NOT NULL,
	`changeSummary` json NOT NULL,
	`authorOpenId` varchar(64) NOT NULL,
	`isStable` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `styleVersions_id` PRIMARY KEY(`id`),
	CONSTRAINT `style_versions_style_number_unique` UNIQUE(`merchantStyleId`,`versionNumber`)
);
--> statement-breakpoint
CREATE INDEX `audit_logs_store_created_idx` ON `auditLogs` (`storeId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `brand_kits_store_idx` ON `brandKits` (`storeId`);--> statement-breakpoint
CREATE INDEX `checkout_modules_store_idx` ON `checkoutModules` (`storeId`);--> statement-breakpoint
CREATE INDEX `merchant_styles_store_status_idx` ON `merchantStyles` (`storeId`,`status`);--> statement-breakpoint
CREATE INDEX `scheduled_campaigns_store_status_idx` ON `scheduledCampaigns` (`storeId`,`status`);--> statement-breakpoint
CREATE INDEX `scheduled_campaigns_task_uid_idx` ON `scheduledCampaigns` (`scheduleCronTaskUid`);--> statement-breakpoint
CREATE INDEX `stores_owner_idx` ON `stores` (`ownerOpenId`);