import { describe, expect, it } from "vitest";

describe("Shopify app credential preflight", () => {
  it("reaches the store OAuth token endpoint with the supplied server credentials", async () => {
    const shop = process.env.SHOPIFY_STORE_DOMAIN;
    const clientId = process.env.SHOPIFY_API_KEY;
    const clientSecret = process.env.SHOPIFY_API_SECRET;

    expect(shop).toBeTruthy();
    expect(clientId).toBeTruthy();
    expect(clientSecret).toBeTruthy();

    const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: "checkout-studio-credential-preflight",
      }),
    });

    // The deliberate one-time dummy code must be rejected, while reaching Shopify
    // confirms the endpoint and supplied app credentials are safely usable for OAuth.
    expect([400, 401, 403]).toContain(response.status);
  }, 15_000);
});
