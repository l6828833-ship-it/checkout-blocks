import { describe, expect, it } from "vitest";
import { THEME_ATELIER } from "../shared/checkoutStudio";

describe("Theme Atelier", () => {
  it("contains twelve distinct premium funnel families", () => {
    expect(THEME_ATELIER).toHaveLength(12);
    expect(new Set(THEME_ATELIER.map(theme => theme.slug)).size).toBe(12);
  });

  it("provides full action, border, logo, surface, and funnel metadata", () => {
    for (const theme of THEME_ATELIER) {
      expect(theme.tokens.secondary).toMatch(/^#/);
      expect(theme.tokens.secondaryText).toMatch(/^#/);
      expect([1, 2]).toContain(theme.tokens.borderWidth);
      expect(["solid", "soft-gradient", "textured"]).toContain(theme.tokens.surfaceTreatment);
      expect(theme.tokens.logoTreatment).toBe(theme.logoTreatment);
      expect(theme.logoTreatment).toBeTruthy();
      expect(theme.funnelMode).toBeTruthy();
      expect(theme.recommendedModules.length).toBeGreaterThan(0);
    }
  });
});
