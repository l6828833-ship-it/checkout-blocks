import crypto from "node:crypto";
import prisma from "../db.server";
import { decryptMerchantSecret, encryptMerchantSecret } from "../lib/crypto.server";
import { ensureShop } from "../models/convertpop.server";
import { hasPlanFeature } from "../lib/entitlements";
import { checkTwilioVerification, sendTwilioVerification } from "./twilio-verify.server";
import type { authenticate } from "../shopify.server";

type CodLine = { variantId: string | number; quantity: number };
type CodPayload = { fullName: string; phone: string; address1: string; city: string; postalCode?: string; countryCode?: string; customerId?: string; items: CodLine[] };
type SmsConfig = { apiKeySid: string; apiKeySecret: string; verifyServiceSid: string };
type AppProxyAdmin = Awaited<ReturnType<typeof authenticate.public.appProxy>>["admin"];

function hmac(value: string, keyName: "CONVERTPOP_PII_HMAC_KEY" | "CONVERTPOP_VISITOR_HMAC_KEY") {
  const key = process.env[keyName];
  if (!key) throw new Error(`[Privacy] ${keyName} is required for PII-safe lookup.`);
  return crypto.createHmac("sha256", key).update(value).digest("hex");
}

function validatePayload(input: unknown): CodPayload {
  if (!input || typeof input !== "object") throw new Response("Invalid COD submission", { status: 400 });
  const value = input as Record<string, unknown>;
  const string = (key: string, required = true) => {
    const item = typeof value[key] === "string" ? value[key].trim() : "";
    if (required && !item) throw new Response("Missing required COD field", { status: 400 });
    return item;
  };
  const items = Array.isArray(value.items) ? value.items.filter((item): item is CodLine => Boolean(item && typeof item === "object" && typeof (item as CodLine).variantId !== "undefined" && Number((item as CodLine).quantity) > 0)) : [];
  if (!items.length || items.length > 50) throw new Response("A valid cart is required", { status: 400 });
  const phone = string("phone");
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) throw new Response("Phone number must use E.164 format", { status: 400 });
  return { fullName: string("fullName"), phone, address1: string("address1"), city: string("city"), postalCode: string("postalCode", false), countryCode: string("countryCode", false), customerId: string("customerId", false), items };
}

async function configForShop(shopId: string) {
  const config = await prisma.smsProviderConfig.findUnique({ where: { shopId } });
  if (!config || config.provider !== "twilio-verify") throw new Response("Merchant has not configured an OTP provider", { status: 503 });
  return { config, credentials: JSON.parse(decryptMerchantSecret(config.encryptedCredentials)) as SmsConfig };
}

export async function saveTwilioConfiguration(shopDomain: string, values: SmsConfig, recoveryEnabled: boolean) {
  if (!values.apiKeySid || !values.apiKeySecret || !values.verifyServiceSid) throw new Response("All Twilio Verify credentials are required", { status: 400 });
  const shop = await ensureShop(shopDomain);
  await prisma.smsProviderConfig.upsert({
    where: { shopId: shop.id },
    create: { shopId: shop.id, provider: "twilio-verify", encryptedCredentials: encryptMerchantSecret(JSON.stringify(values)), senderIdentity: "Twilio Verify", recoveryEnabled },
    update: { provider: "twilio-verify", encryptedCredentials: encryptMerchantSecret(JSON.stringify(values)), senderIdentity: "Twilio Verify", recoveryEnabled },
  });
}

export async function beginCodVerification(shopDomain: string, payload: unknown) {
  const safe = validatePayload(payload);
  const shop = await ensureShop(shopDomain);
  if (!hasPlanFeature(shop.planCode, "COD")) throw new Response("COD confirmation requires ConvertPop Pro or Max.", { status: 403 });
  const { credentials } = await configForShop(shop.id);
  await sendTwilioVerification(safe.phone, credentials);
  const submission = await prisma.codSubmission.create({
    data: { shopId: shop.id, status: "OTP_PENDING", customerHash: safe.customerId ? hmac(safe.customerId, "CONVERTPOP_PII_HMAC_KEY") : null, phoneCipher: encryptMerchantSecret(safe.phone), payloadCipher: encryptMerchantSecret(JSON.stringify(safe)) },
  });
  return { submissionId: submission.id };
}

export async function confirmCodVerification(shopDomain: string, submissionId: string, code: string, admin: AppProxyAdmin) {
  if (!/^\d{4,10}$/.test(code)) throw new Response("Invalid verification code", { status: 400 });
  const shop = await ensureShop(shopDomain);
  const submission = await prisma.codSubmission.findFirst({ where: { id: submissionId, shopId: shop.id, status: "OTP_PENDING" } });
  if (!submission) throw new Response("COD submission not found", { status: 404 });
  const payload = JSON.parse(decryptMerchantSecret(submission.payloadCipher)) as CodPayload;
  const { credentials } = await configForShop(shop.id);
  if (!(await checkTwilioVerification(payload.phone, code, credentials))) return { verified: false };
  if (!admin) throw new Response("The Shopify session is unavailable; no order was created.", { status: 503 });
  const [firstName, ...remainder] = payload.fullName.split(/\s+/);
  const response = await admin.graphql(`#graphql
    mutation ConvertPopCreateDraftOrder($input: DraftOrderInput!) {
      draftOrderCreate(input: $input) { draftOrder { id } userErrors { field message } }
    }
  `, { variables: { input: { lineItems: payload.items.map((item) => ({ variantId: String(item.variantId).startsWith("gid://") ? String(item.variantId) : `gid://shopify/ProductVariant/${item.variantId}`, quantity: Math.floor(Number(item.quantity)) })), shippingAddress: { firstName, lastName: remainder.join(" "), address1: payload.address1, city: payload.city, zip: payload.postalCode || undefined, countryCode: payload.countryCode || undefined, phone: payload.phone }, tags: ["convertpop-cod", "cash-on-delivery"], note: "Customer confirmed this COD order by SMS OTP through ConvertPop." } } });
  const result = await response.json() as { data?: { draftOrderCreate?: { draftOrder?: { id?: string }; userErrors?: Array<{ message?: string }> } } };
  const outcome = result.data?.draftOrderCreate;
  if (!outcome?.draftOrder?.id || outcome.userErrors?.length) throw new Response("Shopify could not create the draft order.", { status: 422 });
  await prisma.codSubmission.update({ where: { id: submission.id }, data: { status: "CONFIRMED", verifiedAt: new Date(), draftOrderId: outcome.draftOrder.id } });
  return { verified: true, draftOrderId: outcome.draftOrder.id };
}

export async function redactCustomerCodData(shopDomain: string, customerId: string) {
  const shop = await prisma.shop.findUnique({ where: { domain: shopDomain } });
  if (!shop) return;
  await prisma.codSubmission.deleteMany({ where: { shopId: shop.id, customerHash: hmac(customerId, "CONVERTPOP_PII_HMAC_KEY") } });
}
