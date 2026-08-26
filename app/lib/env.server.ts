const requiredShopifyVariables = [
  "SHOPIFY_API_KEY",
  "SHOPIFY_API_SECRET",
  "SHOPIFY_APP_URL",
] as const;

export type ShopifyEnvironment = Record<(typeof requiredShopifyVariables)[number], string>;

/**
 * Refuse to serve an embedded production app with a blank API key or a partial
 * OAuth configuration. A blank key causes App Bridge to appear installed while
 * silently failing token exchange, which is unsafe for merchant operations.
 */
export function requireShopifyEnvironment(environment = process.env): ShopifyEnvironment {
  const missing = requiredShopifyVariables.filter((key) => !environment[key]?.trim());
  if (missing.length > 0) {
    throw new Error(`[Shopify configuration] Missing required environment variables: ${missing.join(", ")}`);
  }

  return {
    SHOPIFY_API_KEY: environment.SHOPIFY_API_KEY!.trim(),
    SHOPIFY_API_SECRET: environment.SHOPIFY_API_SECRET!.trim(),
    SHOPIFY_APP_URL: environment.SHOPIFY_APP_URL!.trim().replace(/\/$/, ""),
  };
}

export function assertProductionShopifyEnvironment() {
  if (process.env.NODE_ENV === "production") {
    return requireShopifyEnvironment();
  }
  return null;
}
