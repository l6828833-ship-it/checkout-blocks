import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMock = vi.hoisted(() => ({
  findOrCreateDemoStore: vi.fn(),
  getStoreByOwnerOpenId: vi.fn(),
  listMerchantStyles: vi.fn(),
  createMerchantStyle: vi.fn(),
  listScheduledCampaigns: vi.fn(),
  createBlockedCampaign: vi.fn(),
}));

const capabilityMock = vi.hoisted(() => ({
  getCheckoutCapabilityStatus: vi.fn(),
}));

vi.mock("./db", () => dbMock);
vi.mock("./shopifyCapabilities", () => capabilityMock);

import { studioRouter } from "./routers/studio";
import { THEME_ATELIER } from "../shared/checkoutStudio";

const validTokens = THEME_ATELIER[0].tokens;

const ctx = {
  user: {
    id: 1, openId: "merchant-1", name: "Aster & Bloom", email: null,
    loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
  },
} as unknown as TrpcContext;

beforeEach(() => {
  vi.resetAllMocks();
  dbMock.getStoreByOwnerOpenId.mockResolvedValue(null);
  dbMock.findOrCreateDemoStore.mockResolvedValue({ id: 42, status: "demo", shopDomain: "pending.merchant.local" });
  capabilityMock.getCheckoutCapabilityStatus.mockResolvedValue({
    state: "ready", title: "Checkout configuration verified", message: "Shopify returned a configuration.", checkoutBrandingAvailable: true, configurationIds: ["gid://shopify/CheckoutAndAccountsConfiguration/1"],
  });
});

describe("studio router", () => {
  it("returns a merchant-scoped workspace with a safe not-connected capability state", async () => {
    const result = await studioRouter.createCaller(ctx).workspace();
    expect(dbMock.findOrCreateDemoStore).toHaveBeenCalledWith("merchant-1", "Aster & Bloom");
    expect(result.connection.state).toBe("not_connected");
    expect(result.capabilities).toHaveLength(3);
  });

  it("uses the persisted Shopify store and reports a verified capability result", async () => {
    dbMock.getStoreByOwnerOpenId.mockResolvedValue({ id: 77, status: "connected", shopDomain: "store-plugins.myshopify.com" });
    const result = await studioRouter.createCaller(ctx).workspace();
    expect(dbMock.findOrCreateDemoStore).not.toHaveBeenCalled();
    expect(result.store.id).toBe(77);
    expect(result.connection.state).toBe("ready");
    expect(result.capabilities.find(capability => capability.key === "checkout_branding")?.availability).toBe("available");
    expect(capabilityMock.getCheckoutCapabilityStatus).toHaveBeenCalledWith("merchant-1");
  });

  it("saves style drafts to the current merchant store", async () => {
    dbMock.createMerchantStyle.mockResolvedValue({ id: 9, name: "Soft Luxury" });
    const result = await studioRouter.createCaller(ctx).styles.saveDraft({
      name: "Soft Luxury", presetSlug: "soft-luxury", tokens: validTokens,
    });
    expect(result).toMatchObject({ id: 9, name: "Soft Luxury" });
    expect(dbMock.createMerchantStyle).toHaveBeenCalledWith(expect.objectContaining({ storeId: 42, createdByOpenId: "merchant-1" }));
  });

  it("rejects an invalid or missing logo treatment before persisting a draft", async () => {
    await expect(studioRouter.createCaller(ctx).styles.saveDraft({
      name: "Invalid treatment", tokens: { ...validTokens, logoTreatment: "Floating badge" },
    } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(studioRouter.createCaller(ctx).styles.saveDraft({
      name: "Missing treatment", tokens: { ...validTokens, logoTreatment: undefined },
    } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(dbMock.createMerchantStyle).not.toHaveBeenCalled();
  });

  it("persists an authorized-later campaign as blocked rather than attempting a live action", async () => {
    dbMock.createBlockedCampaign.mockResolvedValue({ id: 7, status: "blocked" });
    const result = await studioRouter.createCaller(ctx).campaigns.create({
      merchantStyleId: 9,
      name: "Holiday chapter",
      startAt: new Date("2026-12-01T17:00:00Z"),
      endAt: new Date("2026-12-30T07:59:00Z"),
      timezone: "America/Los_Angeles",
    });
    expect(result).toMatchObject({ status: "blocked" });
    expect(dbMock.createBlockedCampaign).toHaveBeenCalledWith(expect.objectContaining({ storeId: 42, createdByOpenId: "merchant-1" }));
  });
});
