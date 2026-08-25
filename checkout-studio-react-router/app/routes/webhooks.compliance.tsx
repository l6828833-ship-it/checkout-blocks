import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

/** Verifies mandatory public-app privacy webhooks without exposing their data to a browser. */
export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop } = await authenticate.webhook(request);
  switch (topic) {
    case "CUSTOMERS_DATA_REQUEST":
    case "CUSTOMERS_REDACT":
      // The scaffold currently stores Shopify app sessions only, not customer
      // profiles or checkout data. Keep the response fast and do not log the
      // request payload, which can contain personal information.
      console.info(`[Shopify webhook] ${topic} acknowledged for ${shop}`);
      return new Response(null, { status: 200 });
    case "SHOP_REDACT":
      await db.session.deleteMany({ where: { shop } });
      console.info(`[Shopify webhook] ${topic} completed for ${shop}`);
      return new Response(null, { status: 200 });
    default:
      return new Response("Unhandled webhook topic", { status: 404 });
  }
};
