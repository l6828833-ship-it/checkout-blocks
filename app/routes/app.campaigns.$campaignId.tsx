import { Form, Link, useLoaderData } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { campaignById, updateCampaign } from "../models/convertpop.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  return { campaign: await campaignById(session.shop, String(params.campaignId ?? "")) };
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const intent = String((await request.formData()).get("intent") ?? "");
  if (intent !== "activate" && intent !== "pause") return new Response("Unsupported campaign action", { status: 400 });
  await updateCampaign(session.shop, String(params.campaignId ?? ""), { status: intent === "activate" ? "LIVE" : "PAUSED" });
  return Response.json({ ok: true });
};

export default function CampaignDetail() {
  const { campaign } = useLoaderData<typeof loader>();
  const impressions = campaign.events.filter((event) => event.eventType === "IMPRESSION").length;
  const outcomes = campaign.events.filter((event) => event.eventType === "CONVERSION" || event.eventType === "SUBMISSION").length;
  return (
    <s-page heading={campaign.name}>
      <s-section slot="secondary-actions"><Link to="/app/campaigns">Campaigns</Link></s-section>
      <s-section slot="primary-action"><Form method="post"><input type="hidden" name="intent" value={campaign.status === "LIVE" ? "pause" : "activate"}/><s-button type="submit" variant={campaign.status === "LIVE" ? "secondary" : "primary"}>{campaign.status === "LIVE" ? "Pause campaign" : "Activate campaign"}</s-button></Form></s-section>
      <s-grid gridTemplateColumns="repeat(2, minmax(0, 1fr))" gap="base">
        <s-section heading="Configuration"><s-stack gap="base"><s-badge tone={campaign.status === "LIVE" ? "success" : "info"}>{campaign.status}</s-badge><s-paragraph>{campaign.kind.replaceAll("_", " ")}</s-paragraph><s-paragraph>Targeting is evaluated in the storefront runtime. Campaign configuration remains merchant-scoped and server-delivered.</s-paragraph></s-stack></s-section>
        <s-section heading="Outcomes"><s-stack direction="inline" gap="base"><s-section heading="Impressions"><s-heading>{impressions}</s-heading></s-section><s-section heading="Outcomes"><s-heading>{outcomes}</s-heading></s-section></s-stack></s-section>
      </s-grid>
      <s-section heading="Campaign content"><s-paragraph>{String((campaign.content as { message?: string; heading?: string; body?: string }).message || (campaign.content as { heading?: string }).heading || (campaign.content as { body?: string }).body || "No customer-facing content has been configured.")}</s-paragraph></s-section>
    </s-page>
  );
}
