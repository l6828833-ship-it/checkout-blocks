import { describe, expect, it } from "vitest";
import { buildShopifyConfigurationInput } from "./shopifyPublish";
import { hasCheckoutConfigurationReadScope, hasCheckoutConfigurationWriteScope } from "./shopifyEmbedded";

const tokens = {
  background: "#F9F7F3",
  surface: "#FFFFFF",
  text: "#1E1A16",
  mutedText: "#71675C",
  primary: "#422F21",
  primaryText: "#FFFFFF",
  border: "#D4C8BA",
  focus: "#635BCE",
  error: "#B42318",
  success: "#16794B",
  secondary: "#B98257",
  secondaryText: "#2D1C11",
  borderWidth: 1 as const,
  surfaceTreatment: "solid" as const,
  logoTreatment: "Wordmark" as const,
  font: "Sans" as const,
  radius: 12,
  density: "balanced" as const,
};

describe("reviewed Shopify configuration publishing", () => {
  it("maps only supported color and corner-radius values into the unified configuration input", () => {
    const input = buildShopifyConfigurationInput(tokens);
    expect(input.branding.designTokens.colors.palette).toMatchObject({
      color1: tokens.background,
      color5: tokens.primary,
      color6: tokens.primaryText,
      color12: tokens.secondaryText,
    });
    expect(input.branding.designTokens.cornerRadius).toEqual({ small: 6, base: 12, large: 18 });
    expect(input.branding.surfaces.checkout.components.main.colors.base).toEqual({
      background: tokens.background,
      text: tokens.text,
    });
  });

  it("requires the write scope while treating it as sufficient for read access", () => {
    expect(hasCheckoutConfigurationWriteScope("read_checkout_and_accounts_configurations")).toBe(false);
    expect(hasCheckoutConfigurationWriteScope("write_checkout_and_accounts_configurations")).toBe(true);
    expect(hasCheckoutConfigurationReadScope("write_checkout_and_accounts_configurations")).toBe(true);
  });
});
