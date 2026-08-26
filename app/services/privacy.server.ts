import prisma from "../db.server";

export async function redactShop(domain: string) {
  const shop = await prisma.shop.findUnique({ where: { domain } });
  if (!shop) return;
  await prisma.$transaction([
    prisma.codSubmission.deleteMany({ where: { shopId: shop.id } }),
    prisma.eventAttribution.deleteMany({ where: { shopId: shop.id } }),
    prisma.campaign.deleteMany({ where: { shopId: shop.id } }),
    prisma.subscription.deleteMany({ where: { shopId: shop.id } }),
    prisma.webhookDelivery.deleteMany({ where: { shopId: shop.id } }),
    prisma.session.deleteMany({ where: { shop: domain } }),
    prisma.shop.delete({ where: { id: shop.id } }),
  ]);
}
