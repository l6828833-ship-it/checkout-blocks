import { describe, expect, it } from "vitest";
import { validateCampaignWindow, validateStyleTokens } from "../shared/studioValidation";
import type { StyleTokens } from "../shared/checkoutStudio";

const baseTokens: StyleTokens = {
  background: "#FFFEFC", surface: "#FFFFFF", text: "#252422", mutedText: "#726E68",
  primary: "#252422", primaryText: "#FFFFFF", border: "#DEDAD4", focus: "#6654E8",
  error: "#B3261E", success: "#147A5B", font: "Sans", radius: 12, density: "balanced",
};

describe("Checkout Studio validation", () => {
  it("passes an accessible primary action pairing", () => {
    const result = validateStyleTokens(baseTokens).find(check => check.id === "button-contrast");
    expect(result?.status).toBe("pass");
  });

  it("explains a weak primary action pairing", () => {
    const result = validateStyleTokens({ ...baseTokens, primary: "#F7F3EB", primaryText: "#FFFFFF" })
      .find(check => check.id === "button-contrast");
    expect(result?.status).toBe("warning");
    expect(result?.message).toContain("Try #FFFFFF");
  });

  it("requires campaigns to end after they start", () => {
    const result = validateCampaignWindow(new Date("2026-12-02T00:00:00Z"), new Date("2026-12-01T00:00:00Z"));
    expect(result.status).toBe("warning");
  });

  it("permits a forward timezone-aware campaign window expressed as UTC instants", () => {
    const result = validateCampaignWindow(new Date("2026-12-01T17:00:00Z"), new Date("2026-12-30T07:59:00Z"));
    expect(result.status).toBe("pass");
  });
});
