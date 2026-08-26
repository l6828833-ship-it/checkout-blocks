import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  ensureShop: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
  sendTwilioVerification: vi.fn(),
}));

vi.mock("../models/convertpop.server", () => ({ ensureShop: mocks.ensureShop }));
vi.mock("../db.server", () => ({ default: { smsProviderConfig: { findUnique: mocks.findUnique }, codSubmission: { create: mocks.create } } }));
vi.mock("./twilio-verify.server", () => ({ sendTwilioVerification: mocks.sendTwilioVerification, checkTwilioVerification: vi.fn() }));
import { beginCodVerification } from "./cod.server";

describe("COD initiation entitlement", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects a lower-tier shop before reading provider credentials or sending an OTP", async () => {
    mocks.ensureShop.mockResolvedValue({ id: "shop-1", planCode: "PLUS" });
    await expect(beginCodVerification("merchant.myshopify.com", { fullName: "Test Buyer", phone: "+15551234567", address1: "123 Example St", city: "Example", items: [{ variantId: 1, quantity: 1 }] })).rejects.toMatchObject({ status: 403 });
    expect(mocks.findUnique).not.toHaveBeenCalled();
    expect(mocks.sendTwilioVerification).not.toHaveBeenCalled();
  });
});
