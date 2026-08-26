import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { beginCodVerification } from "../services/cod.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.public.appProxy(request);
  if (!session?.shop) return Response.json({ error: "Store is not connected" }, { status: 401 });
  const submission = await beginCodVerification(session.shop, await request.json().catch(() => null));
  return Response.json(submission, { headers: { "Cache-Control": "no-store" } });
};
