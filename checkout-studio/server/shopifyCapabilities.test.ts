import { describe, expect, it } from "vitest";
import { classifyCheckoutConfigurationResponse, missingCheckoutConfigurationScopeStatus } from "./shopifyCapabilities";

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

  it("identifies a missing configuration scope as a Plus eligibility limitation while preserving the connected workspace", () => {
    const result = missingCheckoutConfigurationScopeStatus();
    expect(result).toMatchObject({ state: "denied", checkoutBrandingAvailable: false });
    expect(result.message).toContain("Shopify Plus");
    expect(result.message).toContain("Thank you page extension");
  });
});
