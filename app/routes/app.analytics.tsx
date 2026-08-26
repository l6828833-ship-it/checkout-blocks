import { useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import { ensureShop } from "../models/convertpop.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await ensureShop(session.shop);
  const [events, campaigns] = await Promise.all([
    prisma.eventAttribution.groupBy({ by: ["eventType"], where: { shopId: shop.id }, _count: { _all: true } }),
    prisma.campaign.findMany({ where: { shopId: shop.id }, select: { id: true, name: true, events: { select: { eventType: true } } } }),
  ]);
  return { events, campaigns: campaigns.map((campaign) => ({ ...campaign, impressions: campaign.events.filter((event) => event.eventType === "IMPRESSION").length, conversions: campaign.events.filter((event) => event.eventType === "CONVERSION" || event.eventType === "SUBMISSION").length })) };
};

export default function Analytics() {
  const { events, campaigns } = useLoaderData<typeof loader>();
  return (
    <s-page heading="Analytics">
      <s-section heading="Attributed events"><s-grid gridTemplateColumns="repeat(3, minmax(0, 1fr))" gap="base">{events.length ? events.map((event) => <s-section key={event.eventType} heading={event.eventType.replaceAll("_", " ")}><s-heading>{event._count._all.toLocaleString()}</s-heading></s-section>) : <s-paragraph>No storefront events have been attributed yet.</s-paragraph>}</s-grid></s-section>
      <s-section heading="Campaign outcomes">{campaigns.length ? <s-stack gap="base">{campaigns.map((campaign) => <s-box key={campaign.id} padding="base" border="base"><s-stack direction="inline" justifyContent="space-between"><s-paragraph>{campaign.name}</s-paragraph><s-paragraph>{campaign.impressions.toLocaleString()} impressions · {campaign.conversions.toLocaleString()} outcomes</s-paragraph></s-stack></s-box>)}</s-stack> : <s-paragraph>Activate a campaign to collect server-metered storefront impressions and conversion outcomes.</s-paragraph>}</s-section>
    </s-page>
  );
}
