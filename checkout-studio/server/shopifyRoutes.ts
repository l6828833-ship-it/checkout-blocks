import type { Express } from "express";

/**
 * Checkout Studio authenticates its Shopify Admin App Home using App Bridge ID
 * token exchange. The Dev Dashboard still requires a stable callback URL, so
 * this route provides an explicit, safe diagnostic rather than leaving a 404.
 */
export function registerShopifyRoutes(app: Express) {
  app.get("/api/shopify/auth/callback", (_req, res) => {
    res.status(400).type("text/plain").send(
      "Checkout Studio uses Shopify Admin embedded authentication. Return to Shopify Admin and open the Checkout Studio app."
    );
  });
}
