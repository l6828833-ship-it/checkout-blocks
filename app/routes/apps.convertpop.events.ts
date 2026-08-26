import crypto from "node:crypto";
import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { recordImpression } from "../models/convertpop.server";

function visitorHash(visitorId: string) {
  const salt = process.env.CONVERTPOP_VISITOR_HMAC_KEY;
  if (!salt) throw new Error("[Metering] CONVERTPOP_VISITOR_HMAC_KEY is required to record storefront events.");
  return crypto.createHmac("sha256", salt).update(visitorId).digest("hex");
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.public.appProxy(request);
  if (!session?.shop) return Response.json({ recorded: false }, { status: 401 });

  const body = await request.json().catch(() => null) as { campaignId?: unknown; visitorId?: unknown; event?: unknown } | null;
  if (!body || body.event !== "impression" || typeof body.campaignId !== "string" || typeof body.visitorId !== "string") {
    return Response.json({ recorded: false }, { status: 400 });
  }
  if (body.campaignId.length > 128 || body.visitorId.length > 128) return Response.json({ recorded: false }, { status: 400 });

  const recorded = await recordImpression(session.shop, body.campaignId, visitorHash(body.visitorId));
  return Response.json({ recorded }, { headers: { "Cache-Control": "no-store" } });
};
