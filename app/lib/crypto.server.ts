import crypto from "node:crypto";

const algorithm = "aes-256-gcm";

function key() {
  const raw = process.env.CONVERTPOP_ENCRYPTION_KEY;
  if (!raw) throw new Error("[Encryption] CONVERTPOP_ENCRYPTION_KEY is required before storing merchant provider credentials.");
  const material = Buffer.from(raw, raw.match(/^[a-f0-9]{64}$/i) ? "hex" : "base64");
  if (material.length !== 32) throw new Error("[Encryption] CONVERTPOP_ENCRYPTION_KEY must decode to exactly 32 bytes.");
  return material;
}

export function encryptMerchantSecret(plaintext: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, key(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptMerchantSecret(ciphertext: string) {
  const payload = Buffer.from(ciphertext, "base64");
  const iv = payload.subarray(0, 12);
  const tag = payload.subarray(12, 28);
  const encrypted = payload.subarray(28);
  const decipher = crypto.createDecipheriv(algorithm, key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}
