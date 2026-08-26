import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { syncSubscription } from "../services/billing.server";
import { claimWebhookDelivery } from "../services/webhook-delivery.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, payload, webhookId, topic } = await authenticate.webhook(request);
  if (!(await claimWebhookDelivery(shop, webhookId, topic))) return new Response();
  const data = payload as { app_subscription?: { admin_graphql_api_id?: string; name?: string; status?: string; current_period_end?: string | null } };
  await syncSubscription(shop, { id: data.app_subscription?.admin_graphql_api_id, name: data.app_subscription?.name, status: data.app_subscription?.status, currentPeriodEnd: data.app_subscription?.current_period_end });
  return new Response();
};
