import { afterEach, describe, expect, it } from "vitest";
import { decryptMerchantSecret, encryptMerchantSecret } from "./crypto.server";

const priorKey = process.env.CONVERTPOP_ENCRYPTION_KEY;
afterEach(() => { process.env.CONVERTPOP_ENCRYPTION_KEY = priorKey; });

describe("merchant credential encryption", () => {
  it("round-trips encrypted provider credentials without keeping plaintext in storage", () => {
    process.env.CONVERTPOP_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
    const encrypted = encryptMerchantSecret("merchant-provider-secret");
    expect(encrypted).not.toContain("merchant-provider-secret");
    expect(decryptMerchantSecret(encrypted)).toBe("merchant-provider-secret");
  });
});
