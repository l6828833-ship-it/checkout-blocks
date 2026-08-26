import { CampaignKind, CampaignStatus, PlanCode, Prisma } from "@prisma/client";
import prisma from "../db.server";
import { hasPlanFeature, IMPRESSION_LIMITS, mayServeNextImpression } from "../lib/entitlements";

export const PLAN_LIMITS: Record<PlanCode, number> = IMPRESSION_LIMITS;

export async function ensureShop(shopDomain: string) {
  return prisma.shop.upsert({
    where: { domain: shopDomain },
    create: { domain: shopDomain },
    update: { uninstalledAt: null },
  });
}

export async function dashboardForShop(shopDomain: string) {
  const shop = await ensureShop(shopDomain);
  const periodStart = shop.usagePeriodStart ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const [campaigns, impressions, conversions] = await Promise.all([
    prisma.campaign.findMany({ where: { shopId: shop.id }, orderBy: { updatedAt: "desc" }, take: 8 }),
    prisma.eventAttribution.count({ where: { shopId: shop.id, eventType: "IMPRESSION", createdAt: { gte: periodStart } } }),
    prisma.eventAttribution.count({ where: { shopId: shop.id, eventType: { in: ["SUBMISSION", "CONVERSION"] }, createdAt: { gte: periodStart } } }),
  ]);
  return { shop, campaigns, impressions, conversions, planLimit: PLAN_LIMITS[shop.planCode] };
}

export async function campaignList(shopDomain: string) {
  const shop = await ensureShop(shopDomain);
  return prisma.campaign.findMany({ where: { shopId: shop.id }, orderBy: { updatedAt: "desc" } });
}

export async function createCampaign(shopDomain: string, values: {
  name: string; kind: CampaignKind; content: Prisma.InputJsonValue; targeting: Prisma.InputJsonValue; schedule: Prisma.InputJsonValue;
}) {
  const shop = await ensureShop(shopDomain);
  const targeting = values.targeting as { device?: unknown; visitor?: unknown };
  const schedule = values.schedule as { delaySeconds?: unknown };
  const requiresAdvancedTargeting = targeting.device === "desktop" || targeting.device === "mobile" || targeting.visitor === "new" || targeting.visitor === "returning";
  if (values.kind === "COD_FORM" && !hasPlanFeature(shop.planCode, "COD")) throw new Response("COD confirmation requires ConvertPop Pro or Max.", { status: 403 });
  if (requiresAdvancedTargeting && !hasPlanFeature(shop.planCode, "ADVANCED_TARGETING")) throw new Response("Device and visitor targeting requires ConvertPop Pro or Max.", { status: 403 });
  if (Number(schedule.delaySeconds ?? 0) > 0 && !hasPlanFeature(shop.planCode, "SCHEDULING")) throw new Response("Scheduled campaign triggers require ConvertPop Max.", { status: 403 });
  return prisma.campaign.create({ data: { shopId: shop.id, ...values, status: CampaignStatus.DRAFT } });
}

export async function campaignById(shopDomain: string, campaignId: string) {
  const shop = await ensureShop(shopDomain);
  const campaign = await prisma.campaign.findFirst({ where: { id: campaignId, shopId: shop.id }, include: { events: { select: { eventType: true, createdAt: true } } } });
  if (!campaign) throw new Response("Campaign not found", { status: 404 });
  return campaign;
}

export async function updateCampaign(shopDomain: string, campaignId: string, values: Prisma.CampaignUpdateInput) {
  const shop = await ensureShop(shopDomain);
  const campaign = await prisma.campaign.findFirst({ where: { id: campaignId, shopId: shop.id } });
  if (!campaign) throw new Response("Campaign not found", { status: 404 });
  return prisma.campaign.update({ where: { id: campaignId }, data: values });
}

export async function publicCampaigns(shopDomain: string) {
  const shop = await prisma.shop.findFirst({ where: { domain: shopDomain, uninstalledAt: null } });
  if (!shop || !mayServeNextImpression(shop.planCode, shop.usageImpressions)) return { shop: null, campaigns: [] };
  const now = new Date();
  const campaigns = await prisma.campaign.findMany({
    where: { shopId: shop.id, status: CampaignStatus.LIVE, OR: [{ startsAt: null }, { startsAt: { lte: now } }], AND: [{ OR: [{ endsAt: null }, { endsAt: { gt: now } }] }] },
    select: { id: true, kind: true, content: true, targeting: true, schedule: true },
  });
  return { shop, campaigns };
}

export async function recordImpression(shopDomain: string, campaignId: string, visitorHash: string) {
  const shop = await prisma.shop.findFirst({ where: { domain: shopDomain, uninstalledAt: null } });
  if (!shop || !mayServeNextImpression(shop.planCode, shop.usageImpressions)) return false;
  const campaign = await prisma.campaign.findFirst({ where: { id: campaignId, shopId: shop.id, status: CampaignStatus.LIVE } });
  if (!campaign) return false;
  await prisma.$transaction([
    prisma.eventAttribution.create({ data: { shopId: shop.id, campaignId, eventType: "IMPRESSION", visitorHash } }),
    prisma.shop.update({ where: { id: shop.id }, data: { usageImpressions: { increment: 1 } } }),
  ]);
  return true;
}
