import "@shopify/shopify-app-react-router/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  BillingInterval,
  shopifyApp,
} from "@shopify/shopify-app-react-router/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";

const isProduction = process.env.NODE_ENV === "production";
const developmentFallback = isProduction ? "" : "http://localhost:3000";

export const FREE_PLAN = "ConvertPop Free";
export const PLUS_PLAN = "ConvertPop Plus";
export const PRO_PLAN = "ConvertPop Pro";
export const MAX_PLAN = "ConvertPop Max";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY || (isProduction ? undefined : "development-preview-key"),
  apiSecretKey: process.env.SHOPIFY_API_SECRET || (isProduction ? "" : "development-preview-secret"),
  apiVersion: ApiVersion.October25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || developmentFallback,
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  billing: {
    [PLUS_PLAN]: { trialDays: 7, lineItems: [{ amount: 9.99, currencyCode: "USD", interval: BillingInterval.Every30Days }] },
    [PRO_PLAN]: { trialDays: 7, lineItems: [{ amount: 17.99, currencyCode: "USD", interval: BillingInterval.Every30Days }] },
    [MAX_PLAN]: { trialDays: 7, lineItems: [{ amount: 31.99, currencyCode: "USD", interval: BillingInterval.Every30Days }] },
  },
  future: {
    expiringOfflineAccessTokens: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.October25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
