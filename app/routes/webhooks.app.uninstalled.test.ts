import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  webhook: vi.fn(), claim: vi.fn(), deleteMany: vi.fn(), upsert: vi.fn(), update: vi.fn(), updateMany: vi.fn(), transaction: vi.fn(),
}));
vi.mock("../shopify.server", () => ({ authenticate: { webhook: mocks.webhook } }));
vi.mock("../services/webhook-delivery.server", () => ({ claimWebhookDelivery: mocks.claim }));
vi.mock("../db.server", () => ({ default: { session: { deleteMany: mocks.deleteMany }, shop: { upsert: mocks.upsert, update: mocks.update }, campaign: { updateMany: mocks.updateMany }, $transaction: mocks.transaction } }));
import { action } from "./webhooks.app.uninstalled";

describe("uninstall webhook", () => {
  beforeEach(() => { vi.clearAllMocks(); });
  it("propagates Shopify authentication failures without cleanup", async () => {
    mocks.webhook.mockRejectedValue(new Response("Invalid HMAC", { status: 401 }));
    await expect(action({ request: new Request("https://app.example/webhooks/app/uninstalled", { method: "POST" }) } as never)).rejects.toMatchObject({ status: 401 });
    expect(mocks.claim).not.toHaveBeenCalled();
  });
  it("acknowledges duplicate deliveries without deleting session or campaign data twice", async () => {
    mocks.webhook.mockResolvedValue({ shop: "merchant.myshopify.com", topic: "APP_UNINSTALLED", webhookId: "delivery-1", session: null }); mocks.claim.mockResolvedValue(false);
    const response = await action({ request: new Request("https://app.example/webhooks/app/uninstalled", { method: "POST" }) } as never);
    expect(response.status).toBe(200); expect(mocks.deleteMany).not.toHaveBeenCalled(); expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
