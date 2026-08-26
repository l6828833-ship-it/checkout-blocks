import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ webhook: vi.fn(), claim: vi.fn(), syncSubscription: vi.fn() }));
vi.mock("../shopify.server", () => ({ authenticate: { webhook: mocks.webhook } }));
vi.mock("../services/webhook-delivery.server", () => ({ claimWebhookDelivery: mocks.claim }));
vi.mock("../services/billing.server", () => ({ syncSubscription: mocks.syncSubscription }));
import { action } from "./webhooks.app.subscriptions-update";

describe("subscription-update webhook", () => {
  beforeEach(() => vi.clearAllMocks());
  it("propagates an invalid signature failure before subscription synchronization", async () => {
    mocks.webhook.mockRejectedValue(new Response("Invalid HMAC", { status: 401 }));
    await expect(action({ request: new Request("https://app.example/webhooks/app/subscriptions-update", { method: "POST" }) } as never)).rejects.toMatchObject({ status: 401 });
    expect(mocks.syncSubscription).not.toHaveBeenCalled();
  });
  it("does not synchronize subscription state twice for a repeated webhook delivery", async () => {
    mocks.webhook.mockResolvedValue({ shop: "merchant.myshopify.com", topic: "APP_SUBSCRIPTIONS_UPDATE", webhookId: "delivery-1", payload: {} }); mocks.claim.mockResolvedValue(false);
    const response = await action({ request: new Request("https://app.example/webhooks/app/subscriptions-update", { method: "POST" }) } as never);
    expect(response.status).toBe(200); expect(mocks.syncSubscription).not.toHaveBeenCalled();
  });
});
