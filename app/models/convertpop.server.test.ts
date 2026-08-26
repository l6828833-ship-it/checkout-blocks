import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  shop: { upsert: vi.fn() },
  campaign: { create: vi.fn() },
}));

vi.mock("../db.server", () => ({ default: { shop: mocks.shop, campaign: mocks.campaign } }));
import { createCampaign } from "./convertpop.server";

describe("server-side plan entitlements", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.campaign.create.mockResolvedValue({ id: "campaign-1" }); });

  it("rejects COD campaigns for the Free plan before creating a campaign", async () => {
    mocks.shop.upsert.mockResolvedValue({ id: "shop-1", planCode: "FREE" });
    await expect(createCampaign("merchant.myshopify.com", { name: "COD", kind: "COD_FORM", content: {}, targeting: { device: "all", visitor: "all" }, schedule: { delaySeconds: 0 } })).rejects.toMatchObject({ status: 403 });
    expect(mocks.campaign.create).not.toHaveBeenCalled();
  });

  it("rejects advanced targeting for Plus before campaign persistence", async () => {
    mocks.shop.upsert.mockResolvedValue({ id: "shop-1", planCode: "PLUS" });
    await expect(createCampaign("merchant.myshopify.com", { name: "Mobile", kind: "POPUP", content: {}, targeting: { device: "mobile", visitor: "all" }, schedule: { delaySeconds: 0 } })).rejects.toMatchObject({ status: 403 });
    expect(mocks.campaign.create).not.toHaveBeenCalled();
  });

  it("rejects scheduling before persistence unless the merchant is on Max", async () => {
    mocks.shop.upsert.mockResolvedValue({ id: "shop-1", planCode: "PRO" });
    await expect(createCampaign("merchant.myshopify.com", { name: "Scheduled", kind: "POPUP", content: {}, targeting: { device: "all", visitor: "all" }, schedule: { delaySeconds: 30 } })).rejects.toMatchObject({ status: 403 });
    expect(mocks.campaign.create).not.toHaveBeenCalled();
  });
});
