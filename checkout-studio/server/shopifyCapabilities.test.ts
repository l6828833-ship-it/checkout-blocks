import { describe, expect, it } from "vitest";
import { classifyCheckoutConfigurationResponse } from "./shopifyCapabilities";

describe("Shopify checkout capability response classification", () => {
  it("only reports ready when Shopify returns a configuration", () => {
    const result = classifyCheckoutConfigurationResponse({
      data: { checkoutAndAccountsConfigurations: { nodes: [{ id: "gid://shopify/CheckoutAndAccountsConfiguration/1", name: "Default", isPublished: true }] } },
    });
    expect(result).toMatchObject({ state: "ready", checkoutBrandingAvailable: true });
    expect(result.configurationIds).toEqual(["gid://shopify/CheckoutAndAccountsConfiguration/1"]);
  });

  it("does not guess eligibility when Shopify returns an access error or no configuration", () => {
    expect(classifyCheckoutConfigurationResponse({ errors: [{ message: "Access denied" }] })).toMatchObject({ state: "denied", checkoutBrandingAvailable: false });
    expect(classifyCheckoutConfigurationResponse({ data: { checkoutAndAccountsConfigurations: { nodes: [] } } })).toMatchObject({ state: "denied", checkoutBrandingAvailable: false });
  });

  it("keeps a GraphQL access denial distinct from a locally cached installation scope", () => {
    const result = classifyCheckoutConfigurationResponse({ errors: [{ message: "Access denied for checkoutAndAccountsConfigurations" }] });
    expect(result).toMatchObject({ state: "denied", checkoutBrandingAvailable: false });
    expect(result.message).toContain("Access denied");
  });
});
