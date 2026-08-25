import { beforeEach, describe, expect, it, vi } from "vitest";

const ordered = vi.hoisted(() => vi.fn());
const values = vi.hoisted(() => vi.fn());
const fakeDb = vi.hoisted(() => ({
  select: vi.fn(() => ({
    from: vi.fn(() => ({
      where: vi.fn(() => ({ orderBy: ordered })),
    })),
  })),
  insert: vi.fn(() => ({ values })),
}));

vi.mock("drizzle-orm/postgres-js", () => ({ drizzle: vi.fn(() => fakeDb) }));
vi.mock("postgres", () => ({ default: vi.fn(() => ({})) }));

process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/checkout_studio";

import { createBlockedCampaign, createMerchantStyle, listStyleVersions } from "./db";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Checkout Studio database helpers", () => {
  it("creates a merchant draft and its initial version in the same merchant scope", async () => {
    ordered.mockResolvedValueOnce([{ id: 12, storeId: 7, name: "Soft Luxury" }]);
    const result = await createMerchantStyle({
      storeId: 7, name: "Soft Luxury", presetSlug: "soft-luxury", tokens: { primary: "#3E3933" }, createdByOpenId: "merchant-1",
    });
    expect(result).toMatchObject({ id: 12, storeId: 7 });
    expect(fakeDb.insert).toHaveBeenCalledTimes(2);
    expect(values).toHaveBeenNthCalledWith(1, expect.objectContaining({ storeId: 7, status: "draft" }));
    expect(values).toHaveBeenNthCalledWith(2, expect.objectContaining({ merchantStyleId: 12, versionNumber: 1, storeId: 7 }));
  });

  it("records a campaign as blocked until Shopify authorization and capability validation exist", async () => {
    ordered.mockResolvedValueOnce([{ id: 33, storeId: 7, status: "blocked" }]);
    const result = await createBlockedCampaign({
      storeId: 7, merchantStyleId: 12, name: "Holiday chapter", startAt: new Date("2026-12-01T17:00:00Z"),
      endAt: new Date("2026-12-30T07:59:00Z"), timezone: "America/Los_Angeles", createdByOpenId: "merchant-1",
    });
    expect(result).toMatchObject({ id: 33, status: "blocked" });
    expect(values).toHaveBeenCalledWith(expect.objectContaining({ status: "blocked", storeId: 7 }));
  });

  it("lists versions only through a requested merchant store scope", async () => {
    ordered.mockResolvedValueOnce([{ id: 2, storeId: 7, versionNumber: 1 }]);
    await expect(listStyleVersions(7)).resolves.toEqual([{ id: 2, storeId: 7, versionNumber: 1 }]);
  });
});
