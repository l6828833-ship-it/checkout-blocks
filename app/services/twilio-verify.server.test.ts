import { afterEach, describe, expect, it, vi } from "vitest";
import { checkTwilioVerification, sendTwilioVerification } from "./twilio-verify.server";

const credentials = { apiKeySid: "SK123", apiKeySecret: "provider-secret", verifyServiceSid: "VA123" };
afterEach(() => vi.unstubAllGlobals());

describe("Twilio Verify integration", () => {
  it("sends an SMS verification using HTTP Basic authentication without logging the phone number", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: "pending" }), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    await sendTwilioVerification("+15551234567", credentials);
    expect(fetchMock).toHaveBeenCalledWith("https://verify.twilio.com/v2/Services/VA123/Verifications", expect.objectContaining({ method: "POST", headers: expect.objectContaining({ Authorization: `Basic ${Buffer.from("SK123:provider-secret").toString("base64")}` }) }));
  });

  it("accepts only a provider-approved verification check", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: "approved", valid: true }), { status: 200 })));
    await expect(checkTwilioVerification("+15551234567", "123456", credentials)).resolves.toBe(true);
  });
});
