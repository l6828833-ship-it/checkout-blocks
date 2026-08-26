import type { Request, Response } from "express";
import { getCampaignByTaskUid, updateCampaignDiagnostic } from "./db";
import { sdk } from "./_core/sdk";
import { UnconnectedShopifyCheckoutGateway } from "./checkoutGateway";

/**
 * Platform-managed scheduler callback. It identifies a campaign only by the
 * authenticated task UID, never a request body field, and leaves checkout
 * untouched when the store has not yet authorized Shopify access.
 */
export async function scheduledCampaignHandler(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only" });
    }
    const campaign = await getCampaignByTaskUid(user.taskUid);
    if (!campaign) return res.json({ ok: true, skipped: "orphan" });

    const result = await new UnconnectedShopifyCheckoutGateway().publish({
      styleId: campaign.merchantStyleId,
      tokens: {} as never,
      moduleIds: [],
    });
    await updateCampaignDiagnostic(campaign.id, "blocked", result.diagnostic);
    return res.json({ ok: true, status: "blocked", diagnostic: result.diagnostic });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({
      error: message,
      context: { url: req.originalUrl },
      timestamp: new Date().toISOString(),
    });
  }
}
