import { PlanCode } from "@prisma/client";
import prisma from "../db.server";
import { ensureShop } from "../models/convertpop.server";
import { FREE_PLAN, MAX_PLAN, PLUS_PLAN, PRO_PLAN } from "../shopify.server";

export const BILLING_PLANS = {
  FREE: { label: FREE_PLAN, planCode: PlanCode.FREE, amount: 0, impressions: 1500 },
  PLUS: { label: PLUS_PLAN, planCode: PlanCode.PLUS, amount: 9.99, impressions: 10000 },
  PRO: { label: PRO_PLAN, planCode: PlanCode.PRO, amount: 17.99, impressions: 50000 },
  MAX: { label: MAX_PLAN, planCode: PlanCode.MAX, amount: 31.99, impressions: 150000 },
} as const;

export function billingTestMode() { return process.env.SHOPIFY_BILLING_TEST_MODE === "true"; }

export async function syncSubscription(shopDomain: string, subscription: { id?: string; name?: string; status?: string; currentPeriodEnd?: string | null } | undefined) {
  const shop = await ensureShop(shopDomain);
  const plan = Object.values(BILLING_PLANS).find((item) => item.label === subscription?.name) ?? BILLING_PLANS.FREE;
  const isActive = subscription?.status === "ACTIVE";
  const planCode = isActive ? plan.planCode : PlanCode.FREE;
  await prisma.$transaction([
    prisma.shop.update({ where: { id: shop.id }, data: { planCode, usagePeriodStart: new Date(), usagePeriodEnd: subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null, usageImpressions: 0 } }),
    prisma.subscription.upsert({ where: { shopifySubscriptionId: subscription?.id ?? `free:${shop.id}` }, create: { shopId: shop.id, shopifySubscriptionId: subscription?.id, planCode, status: subscription?.status ?? "FREE", currentPeriodEndsAt: subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null }, update: { planCode, status: subscription?.status ?? "FREE", currentPeriodEndsAt: subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null } }),
  ]);
  return planCode;
}

export function planByBillingName(name: string | undefined) {
  return Object.values(BILLING_PLANS).find((plan) => plan.label === name) ?? BILLING_PLANS.FREE;
}
