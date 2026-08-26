import { describe, expect, it } from "vitest";
import { hasPlanFeature, mayServeNextImpression } from "./entitlements";

describe("impression entitlement enforcement", () => {
  it("permits the last entitled impression and fails closed at the plan cap", () => {
    expect(mayServeNextImpression("FREE", 1499)).toBe(true);
    expect(mayServeNextImpression("FREE", 1500)).toBe(false);
    expect(mayServeNextImpression("PRO", -1)).toBe(false);
  });

  it("requires the paid entitlement server-side for COD and advanced campaign features", () => {
    expect(hasPlanFeature("FREE", "COD")).toBe(false);
    expect(hasPlanFeature("PLUS", "ADVANCED_TARGETING")).toBe(false);
    expect(hasPlanFeature("PRO", "COD")).toBe(true);
    expect(hasPlanFeature("MAX", "SCHEDULING")).toBe(true);
  });
});
