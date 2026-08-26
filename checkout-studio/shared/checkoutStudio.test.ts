import { describe, expect, it } from "vitest";
import { THEME_ATELIER } from "./checkoutStudio";

describe("Theme Atelier", () => {
  it("contains the twelve distinct premium funnel families", () => {
    expect(THEME_ATELIER).toHaveLength(12);
    expect(new Set(THEME_ATELIER.map(theme => theme.slug)).size).toBe(12);
  });

  it("provides complete presentation tokens and a safe funnel direction for every theme", () => {
    for (const theme of THEME_ATELIER) {
      expect(theme.tokens.secondary).toMatch(/^#/);
      expect(theme.tokens.secondaryText).toMatch(/^#/);
      expect([1, 2]).toContain(theme.tokens.borderWidth);
      expect(["solid", "soft-gradient", "textured"]).toContain(theme.tokens.surfaceTreatment);
      expect(theme.logoTreatment).toBeTruthy();
      expect(theme.funnelMode).toBeTruthy();
      expect(theme.recommendedModules.length).toBeGreaterThan(0);
    }
  });
});
