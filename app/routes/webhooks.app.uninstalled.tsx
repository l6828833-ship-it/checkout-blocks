import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { claimWebhookDelivery } from "../services/webhook-delivery.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, session, webhookId, topic } = await authenticate.webhook(request);
  if (!(await claimWebhookDelivery(shop, webhookId, topic))) return new Response();

  // Webhook requests can trigger multiple times and after an app has already been uninstalled.
  // If this webhook already ran, the session may have been deleted previously.
  if (session) {
    await db.session.deleteMany({ where: { shop } });
  }
  const merchant = await db.shop.upsert({ where: { domain: shop }, create: { domain: shop }, update: {} });
  await db.$transaction([
    db.shop.update({ where: { id: merchant.id }, data: { uninstalledAt: new Date() } }),
    db.campaign.updateMany({ where: { shopId: merchant.id }, data: { status: "PAUSED" } }),
  ]);

  return new Response();
};
