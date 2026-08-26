import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  shop: { upsert: vi.fn() },
  webhookDelivery: { create: vi.fn() },
}));

vi.mock("../db.server", () => ({ default: { shop: mocks.shop, webhookDelivery: mocks.webhookDelivery } }));
import { claimWebhookDelivery } from "./webhook-delivery.server";

describe("webhook delivery idempotency", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.shop.upsert.mockResolvedValue({ id: "shop-1" }); });

  it("claims a new Shopify delivery before lifecycle side effects", async () => {
    mocks.webhookDelivery.create.mockResolvedValue({ id: "record-1" });
    await expect(claimWebhookDelivery("merchant.myshopify.com", "delivery-1", "APP_UNINSTALLED")).resolves.toBe(true);
    expect(mocks.webhookDelivery.create).toHaveBeenCalledWith({ data: { shopId: "shop-1", webhookId: "delivery-1", topic: "APP_UNINSTALLED" } });
  });

  it("rejects repeated delivery IDs without re-running lifecycle work", async () => {
    mocks.webhookDelivery.create.mockRejectedValue({ code: "P2002" });
    await expect(claimWebhookDelivery("merchant.myshopify.com", "delivery-1", "APP_UNINSTALLED")).resolves.toBe(false);
  });
});
