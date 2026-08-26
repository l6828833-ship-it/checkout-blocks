import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { jwtVerify } from "jose";
import type { User } from "../drizzle/schema";
import * as db from "./db";
import { ENV } from "./_core/env";

const SHOPIFY_TOKEN_EXCHANGE_GRANT = "urn:ietf:params:oauth:grant-type:token-exchange";
const SHOPIFY_ID_TOKEN_TYPE = "urn:ietf:params:oauth:token-type:id_token";
const SHOPIFY_OFFLINE_TOKEN_TYPE = "urn:shopify:params:oauth:token-type:offline-access-token";

export class ShopifyEmbeddedAuthError extends Error {
  constructor(message: string, public readonly retryWithFreshIdToken = false) {
    super(message);
    this.name = "ShopifyEmbeddedAuthError";
  }
}

export type VerifiedShopifyIdToken = {
  shopDomain: string;
  staffUserId: string;
};

type TokenExchangeResponse = {
  access_token?: string;
  refresh_token?: string;
  scope?: string;
  expires_in?: number;
};

function serverSecretBytes() {
  if (!ENV.cookieSecret) throw new ShopifyEmbeddedAuthError("Server encryption is unavailable");
  return createHash("sha256").update(ENV.cookieSecret).digest();
}

function base64Url(value: Buffer) {
  return value.toString("base64url");
}

export function encryptShopifyCredential(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", serverSecretBytes(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return `${base64Url(iv)}.${base64Url(cipher.getAuthTag())}.${base64Url(ciphertext)}`;
}

export function decryptShopifyCredential(value: string) {
  const [ivValue, authTagValue, ciphertextValue] = value.split(".");
  if (!ivValue || !authTagValue || !ciphertextValue) throw new ShopifyEmbeddedAuthError("Stored Shopify credential is malformed");
  try {
    const decipher = createDecipheriv("aes-256-gcm", serverSecretBytes(), Buffer.from(ivValue, "base64url"));
    decipher.setAuthTag(Buffer.from(authTagValue, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(ciphertextValue, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    throw new ShopifyEmbeddedAuthError("Stored Shopify credential cannot be decrypted");
  }
}

function requiredString(value: unknown, field: string) {
  if (typeof value !== "string" || value.length === 0) {
    throw new ShopifyEmbeddedAuthError(`Shopify ID token is missing ${field}`, true);
  }
  return value;
}

function validShopDomain(value: string) {
  return /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i.test(value);
}

export async function verifyShopifyIdToken(idToken: string): Promise<VerifiedShopifyIdToken> {
  if (!ENV.shopifyApiKey || !ENV.shopifyApiSecret) {
    throw new ShopifyEmbeddedAuthError("Shopify app credentials are not configured");
  }

  try {
    const { payload } = await jwtVerify(idToken, new TextEncoder().encode(ENV.shopifyApiSecret), {
      algorithms: ["HS256"],
      audience: ENV.shopifyApiKey,
    });
    const issuer = new URL(requiredString(payload.iss, "issuer"));
    const destination = new URL(requiredString(payload.dest, "destination"));
    const shopDomain = destination.hostname.toLowerCase();

    if (issuer.hostname.toLowerCase() !== shopDomain || !validShopDomain(shopDomain)) {
      throw new ShopifyEmbeddedAuthError("Shopify ID token store identity is invalid", true);
    }

    return { shopDomain, staffUserId: requiredString(payload.sub, "staff user") };
  } catch (error) {
    if (error instanceof ShopifyEmbeddedAuthError) throw error;
    throw new ShopifyEmbeddedAuthError("Shopify ID token could not be verified", true);
  }
}

async function exchangeIdTokenForOfflineToken(idToken: string, shopDomain: string) {
  const response = await fetch(`https://${shopDomain}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: ENV.shopifyApiKey,
      client_secret: ENV.shopifyApiSecret,
      grant_type: SHOPIFY_TOKEN_EXCHANGE_GRANT,
      subject_token: idToken,
      subject_token_type: SHOPIFY_ID_TOKEN_TYPE,
      requested_token_type: SHOPIFY_OFFLINE_TOKEN_TYPE,
      expiring: "1",
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (response.status === 400) {
    throw new ShopifyEmbeddedAuthError("Shopify rejected the expired or invalid ID token", true);
  }
  if (!response.ok) {
    throw new ShopifyEmbeddedAuthError("Shopify token exchange failed");
  }

  const data = await response.json() as TokenExchangeResponse;
  if (!data.access_token || !data.scope) {
    throw new ShopifyEmbeddedAuthError("Shopify token exchange returned incomplete credentials");
  }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    grantedScopes: data.scope,
    expiresIn: data.expires_in ?? null,
  };
}

/**
 * Resolves the Shopify staff member for a request and persists only encrypted
 * offline credentials. The returned Admin API token is server-only and must not
 * be serialized into tRPC responses.
 */
export async function establishShopifyEmbeddedSession(idToken: string): Promise<{
  user: User;
  shopDomain: string;
  grantedScopes: string;
  adminAccessToken: string;
}> {
  const identity = await verifyShopifyIdToken(idToken);
  const store = await db.findOrCreateShopifyStore({
    shopDomain: identity.shopDomain,
    staffUserId: identity.staffUserId,
  });

  await db.upsertUser({
    openId: store.ownerOpenId,
    name: identity.shopDomain.replace(".myshopify.com", ""),
    loginMethod: "shopify",
    lastSignedIn: new Date(),
  });
  const user = await db.getUserByOpenId(store.ownerOpenId);
  if (!user) throw new ShopifyEmbeddedAuthError("Unable to create the Shopify merchant session");

  const existing = await db.getShopifyInstallationByShopDomain(identity.shopDomain);
  const isReusable = existing?.status === "active"
    && existing.staffUserId === identity.staffUserId
    && (!existing.tokenExpiresAt || existing.tokenExpiresAt.getTime() > Date.now() + 60_000);
  if (isReusable && existing) {
    return {
      user,
      shopDomain: identity.shopDomain,
      grantedScopes: existing.grantedScopes,
      adminAccessToken: decryptShopifyCredential(existing.accessTokenCiphertext),
    };
  }

  const token = await exchangeIdTokenForOfflineToken(idToken, identity.shopDomain);

  const tokenExpiresAt = token.expiresIn && token.expiresIn > 0
    ? new Date(Date.now() + token.expiresIn * 1000)
    : null;
  await db.saveShopifyInstallation({
    storeId: store.id,
    shopDomain: identity.shopDomain,
    staffUserId: identity.staffUserId,
    accessTokenCiphertext: encryptShopifyCredential(token.accessToken),
    refreshTokenCiphertext: token.refreshToken ? encryptShopifyCredential(token.refreshToken) : null,
    tokenExpiresAt,
    grantedScopes: token.grantedScopes,
  });

  return {
    user,
    shopDomain: identity.shopDomain,
    grantedScopes: token.grantedScopes,
    adminAccessToken: token.accessToken,
  };
}
