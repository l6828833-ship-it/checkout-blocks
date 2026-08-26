import { Form, Link, useLoaderData } from "react-router";
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { campaignList, updateCampaign } from "../models/convertpop.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  return { campaigns: await campaignList(session.shop) };
};

export const action = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const form = await request.formData();
  const campaignId = String(form.get("campaignId") ?? "");
  const intent = String(form.get("intent") ?? "");
  if (!campaignId || !["activate", "pause"].includes(intent)) return new Response("Invalid campaign action", { status: 400 });
  await updateCampaign(session.shop, campaignId, { status: intent === "activate" ? "LIVE" : "PAUSED" });
  return Response.json({ ok: true });
};

export default function Campaigns() {
  const { campaigns } = useLoaderData<typeof loader>();
  return (
    <s-page heading="Campaigns">
      <s-section slot="primary-action"><s-button href="/app/campaigns/new" variant="primary">Create campaign</s-button></s-section>
      <s-section heading="All campaigns">
        {campaigns.length ? (
          <s-stack gap="base">
            {campaigns.map((campaign) => (
              <s-box key={campaign.id} border="base" padding="base">
                <s-stack direction="inline" justifyContent="space-between" alignItems="center">
                  <s-stack gap="base"><Link to={`/app/campaigns/${campaign.id}`}>{campaign.name}</Link><s-paragraph>{campaign.kind.replaceAll("_", " ")}</s-paragraph></s-stack>
                  <s-stack direction="inline" gap="base" alignItems="center">
                    <s-badge tone={campaign.status === "LIVE" ? "success" : campaign.status === "PAUSED" ? "warning" : "info"}>{campaign.status}</s-badge>
                    <Form method="post"><input type="hidden" name="campaignId" value={campaign.id} /><input type="hidden" name="intent" value={campaign.status === "LIVE" ? "pause" : "activate"} /><s-button type="submit">{campaign.status === "LIVE" ? "Pause" : "Activate"}</s-button></Form>
                  </s-stack>
                </s-stack>
              </s-box>
            ))}
          </s-stack>
        ) : <s-empty-state heading="Create a conversion campaign" image=""><s-paragraph>Start with an announcement bar, popup, embedded banner, or COD confirmation form.</s-paragraph><s-button href="/app/campaigns/new" variant="primary">Create campaign</s-button></s-empty-state>}
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);
