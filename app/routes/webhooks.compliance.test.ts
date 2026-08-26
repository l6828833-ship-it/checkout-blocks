import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  webhook: vi.fn(),
  redactCustomerCodData: vi.fn(),
  redactShop: vi.fn(),
  claimWebhookDelivery: vi.fn(),
}));

vi.mock("../shopify.server", () => ({ authenticate: { webhook: mocks.webhook } }));
vi.mock("../services/cod.server", () => ({ redactCustomerCodData: mocks.redactCustomerCodData }));
vi.mock("../services/privacy.server", () => ({ redactShop: mocks.redactShop }));
vi.mock("../services/webhook-delivery.server", () => ({ claimWebhookDelivery: mocks.claimWebhookDelivery }));

import { action } from "./webhooks.compliance";

describe("Shopify privacy webhook handler", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.claimWebhookDelivery.mockResolvedValue(true); });

  it("runs customer redaction only after Shopify SDK webhook authentication succeeds", async () => {
    mocks.webhook.mockResolvedValue({ topic: "CUSTOMERS_REDACT", shop: "merchant.myshopify.com", payload: { customer: { id: 42 } } });
    const response = await action({ request: new Request("https://app.example/webhooks/compliance", { method: "POST" }) } as never);
    expect(response.status).toBe(200);
    expect(mocks.redactCustomerCodData).toHaveBeenCalledWith("merchant.myshopify.com", "42");
  });

  it("propagates an invalid webhook signature failure without invoking privacy cleanup", async () => {
    mocks.webhook.mockRejectedValue(new Response("Invalid HMAC", { status: 401 }));
    await expect(action({ request: new Request("https://app.example/webhooks/compliance", { method: "POST" }) } as never)).rejects.toMatchObject({ status: 401 });
    expect(mocks.redactCustomerCodData).not.toHaveBeenCalled();
    expect(mocks.redactShop).not.toHaveBeenCalled();
  });

  it("performs shop-level redaction through the isolated privacy service", async () => {
    mocks.webhook.mockResolvedValue({ topic: "SHOP_REDACT", shop: "merchant.myshopify.com", payload: {} });
    const response = await action({ request: new Request("https://app.example/webhooks/compliance", { method: "POST" }) } as never);
    expect(response.status).toBe(200);
    expect(mocks.redactShop).toHaveBeenCalledWith("merchant.myshopify.com");
  });

  it("acknowledges a repeated delivery without repeating privacy side effects", async () => {
    mocks.webhook.mockResolvedValue({ topic: "CUSTOMERS_REDACT", shop: "merchant.myshopify.com", webhookId: "delivery-1", payload: { customer: { id: 42 } } });
    mocks.claimWebhookDelivery.mockResolvedValue(false);
    const response = await action({ request: new Request("https://app.example/webhooks/compliance", { method: "POST" }) } as never);
    expect(response.status).toBe(200);
    expect(mocks.redactCustomerCodData).not.toHaveBeenCalled();
  });
});
