import { describe, expect, it } from "vitest";
import { buildPublishReview, describeConnectionState, describeLiveApplyBlock } from "../shared/studioSafety";

describe("Checkout Studio publish safety", () => {
  it("prevents publishing before a merchant has connected Shopify", () => {
    const review = buildPublishReview({
      connectionState: "not_connected", checkoutBrandingAvailable: false, qualityWarnings: 0,
      liveApplyImplemented: false,
      activeModules: 2, styleName: "Soft Luxury",
    });
    expect(review.canPublish).toBe(false);
    expect(review.reasons[0]).toContain("Connect and authorize");
  });

  it("allows a publish review only when connection, capability, and quality checks pass", () => {
    const review = buildPublishReview({
      connectionState: "ready", checkoutBrandingAvailable: true, qualityWarnings: 0,
      liveApplyImplemented: true,
      activeModules: 3, styleName: "Nordic Calm",
    });
    expect(review.canPublish).toBe(true);
    expect(review.changeSummary).toContain("3 content blocks configured");
  });

  it("uses a safe permission-denied explanation that confirms the live checkout is unchanged", () => {
    const state = describeConnectionState("denied");
    expect(state.message).toContain("live checkout configuration has not changed");
  });

  it("keeps live checkout unchanged when Shopify eligibility exists but no reviewed update pipeline is implemented", () => {
    const review = buildPublishReview({
      connectionState: "ready", checkoutBrandingAvailable: true, liveApplyImplemented: false,
      qualityWarnings: 0, activeModules: 3, styleName: "Soft Luxury",
    });
    expect(review.canPublish).toBe(false);
    expect(review.reasons.some(reason => reason.includes("rollback pipeline"))).toBe(true);
  });

  it("shows the Shopify capability denial rather than incorrectly telling a connected merchant to connect again", () => {
    expect(describeLiveApplyBlock({
      connectionState: "denied",
      capabilityMessage: "The active Shopify authorization does not include checkout configuration read access.",
    })).toContain("does not include checkout configuration read access");
  });
});
