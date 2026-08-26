import prisma from "../db.server";

/**
 * Creates a unique delivery record before side effects. A duplicate webhook ID
 * returns false so retries remain safe even when Shopify redelivers a request.
 */
export async function claimWebhookDelivery(shopDomain: string, webhookId: string | undefined, topic: string) {
  const shop = await prisma.shop.upsert({ where: { domain: shopDomain }, create: { domain: shopDomain }, update: {} });
  if (!webhookId) return true;
  try {
    await prisma.webhookDelivery.create({ data: { shopId: shop.id, webhookId, topic } });
    return true;
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && (error as { code?: unknown }).code === "P2002") return false;
    throw error;
  }
}
