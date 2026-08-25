import { describe, expect, it } from "vitest";
import {
  decryptShopifyCredential,
  encryptShopifyCredential,
  hasCheckoutConfigurationReadScope,
  ShopifyEmbeddedAuthError,
  verifyShopifyIdToken,
} from "./shopifyEmbedded";

describe("Shopify embedded session boundary", () => {
  it("encrypts credentials before persistence and decrypts them only server-side", () => {
    const plaintext = "shpat_test_credential";
    const ciphertext = encryptShopifyCredential(plaintext);

    expect(ciphertext).not.toContain(plaintext);
    expect(decryptShopifyCredential(ciphertext)).toBe(plaintext);
  });

  it("rejects an invalid embedded ID token before token exchange", async () => {
    await expect(verifyShopifyIdToken("not-a-jwt")).rejects.toBeInstanceOf(ShopifyEmbeddedAuthError);
  });

  it("does not treat a stored authorization without checkout configuration read access as reusable", () => {
    expect(hasCheckoutConfigurationReadScope("read_products,write_products")).toBe(false);
    expect(hasCheckoutConfigurationReadScope("read_products,read_checkout_and_accounts_configurations")).toBe(true);
  });
});
