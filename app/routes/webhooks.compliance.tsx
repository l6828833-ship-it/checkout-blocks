import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { redactCustomerCodData } from "../services/cod.server";
import { redactShop } from "../services/privacy.server";
import { claimWebhookDelivery } from "../services/webhook-delivery.server";

/** Verifies mandatory public-app privacy webhooks without exposing their data to a browser. */
export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, payload, webhookId } = await authenticate.webhook(request);
  if (!(await claimWebhookDelivery(shop, webhookId, topic))) return new Response(null, { status: 200 });
  switch (topic) {
    case "CUSTOMERS_DATA_REQUEST":
      // ConvertPop does not maintain a browser-accessible customer profile. Encrypted COD records are retained only for operational confirmation and are available through the merchant's privacy process.
      return new Response(null, { status: 200 });
    case "CUSTOMERS_REDACT":
      await redactCustomerCodData(shop, String((payload as { customer?: { id?: unknown } }).customer?.id ?? ""));
      return new Response(null, { status: 200 });
    case "SHOP_REDACT":
      await redactShop(shop);
      return new Response(null, { status: 200 });
    default:
      return new Response("Unhandled webhook topic", { status: 404 });
  }
};
