CREATE TABLE `shopifyInstallations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storeId` int NOT NULL,
	`shopDomain` varchar(255) NOT NULL,
	`staffUserId` varchar(128) NOT NULL,
	`accessTokenCiphertext` text NOT NULL,
	`refreshTokenCiphertext` text,
	`tokenExpiresAt` timestamp,
	`grantedScopes` text NOT NULL,
	`status` enum('active','revoked') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shopifyInstallations_id` PRIMARY KEY(`id`),
	CONSTRAINT `shopify_installations_store_unique` UNIQUE(`storeId`),
	CONSTRAINT `shopify_installations_domain_unique` UNIQUE(`shopDomain`)
);
