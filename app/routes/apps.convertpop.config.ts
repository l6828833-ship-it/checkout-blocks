import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { publicCampaigns } from "../models/convertpop.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.public.appProxy(request);
  if (!session?.shop) {
    return Response.json({ campaigns: [] }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  const { campaigns } = await publicCampaigns(session.shop);
  return Response.json(
    { campaigns },
    { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300", Vary: "Accept" } },
  );
};
