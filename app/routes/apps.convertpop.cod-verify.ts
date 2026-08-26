import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { confirmCodVerification } from "../services/cod.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const context = await authenticate.public.appProxy(request);
  if (!context.session?.shop) return Response.json({ error: "Store is not connected" }, { status: 401 });
  const body = await request.json().catch(() => null) as { submissionId?: unknown; code?: unknown } | null;
  if (!body || typeof body.submissionId !== "string" || typeof body.code !== "string") return Response.json({ error: "Invalid confirmation request" }, { status: 400 });
  const result = await confirmCodVerification(context.session.shop, body.submissionId, body.code, context.admin);
  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
};
