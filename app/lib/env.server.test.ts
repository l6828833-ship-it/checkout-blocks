import { describe, expect, it } from "vitest";
import { requireShopifyEnvironment } from "./env.server";

describe("requireShopifyEnvironment", () => {
  it("normalizes a complete production configuration", () => {
    expect(requireShopifyEnvironment({ SHOPIFY_API_KEY: " key ", SHOPIFY_API_SECRET: "secret", SHOPIFY_APP_URL: "https://app.example.com/" })).toEqual({ SHOPIFY_API_KEY: "key", SHOPIFY_API_SECRET: "secret", SHOPIFY_APP_URL: "https://app.example.com" });
  });

  it("rejects incomplete embedded OAuth configuration instead of serving a blank key", () => {
    expect(() => requireShopifyEnvironment({ SHOPIFY_API_KEY: "", SHOPIFY_API_SECRET: "secret", SHOPIFY_APP_URL: "https://app.example.com" })).toThrow("SHOPIFY_API_KEY");
  });
});
