import { Link, useLoaderData } from "react-router";
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { dashboardForShop } from "../models/convertpop.server";

type ShopResponse = { data?: { shop?: { name?: string; myshopifyDomain?: string } }; errors?: Array<{ message?: string }> };

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const [dashboard, response] = await Promise.all([
    dashboardForShop(session.shop),
    admin.graphql(`#graphql\n      query ConvertPopShop { shop { name myshopifyDomain } }\n    `),
  ]);
  const payload = await response.json() as ShopResponse;
  return {
    ...dashboard,
    merchantName: payload.data?.shop?.name ?? session.shop,
    shopDomain: payload.data?.shop?.myshopifyDomain ?? session.shop,
    connected: !payload.errors?.length,
  };
};

function percent(numerator: number, denominator: number) {
  return denominator ? `${((numerator / denominator) * 100).toFixed(1)}%` : "—";
}

export default function Dashboard() {
  const { merchantName, shopDomain, connected, campaigns, impressions, conversions, planLimit, shop } = useLoaderData<typeof loader>();
  const active = campaigns.filter((campaign) => campaign.status === "LIVE" || campaign.status === "SCHEDULED").length;
  const usage = Math.min(100, Math.round((impressions / planLimit) * 100));

  return (
    <s-page heading="Dashboard">
      <s-section slot="primary-action">
        <s-button href="/app/campaigns/new" variant="primary">Create campaign</s-button>
      </s-section>
      <s-section>
        <s-stack gap="base">
          <s-heading>Welcome back, {merchantName}</s-heading>
          <s-paragraph>Measure storefront attention, activate conversion campaigns, and keep order-confirmation workflows connected to {shopDomain}.</s-paragraph>
          <s-stack direction="inline" gap="base">
            <s-badge tone={connected ? "success" : "warning"}>{connected ? "Connected" : "Connection needs attention"}</s-badge>
            <s-badge tone="info">{shop.planCode} plan</s-badge>
          </s-stack>
        </s-stack>
      </s-section>
      <s-grid gridTemplateColumns="repeat(2, minmax(0, 1fr))" gap="base">
        <s-section heading="Campaign performance">
          <s-stack gap="base">
            <s-grid gridTemplateColumns="repeat(2, minmax(0, 1fr))" gap="base">
              <s-section heading="Impressions"><s-heading>{impressions.toLocaleString()}</s-heading><s-paragraph>Current billing period</s-paragraph></s-section>
              <s-section heading="Conversion rate"><s-heading>{percent(conversions, impressions)}</s-heading><s-paragraph>{conversions.toLocaleString()} attributed outcomes</s-paragraph></s-section>
            </s-grid>
            <s-section heading="Usage"><s-paragraph>{impressions.toLocaleString()} of {planLimit.toLocaleString()} included impressions</s-paragraph><s-progress-bar value={usage} aria-label="Plan impression usage" /></s-section>
          </s-stack>
        </s-section>
        <s-section heading="Campaign status">
          {campaigns.length ? (
            <s-stack gap="base">
              <s-paragraph>{active} active or scheduled campaign{active === 1 ? "" : "s"}.</s-paragraph>
              {campaigns.slice(0, 4).map((campaign) => <s-box key={campaign.id} padding="base" border="base"><s-stack direction="inline" justifyContent="space-between"><s-paragraph>{campaign.name}</s-paragraph><s-badge tone={campaign.status === "LIVE" ? "success" : "info"}>{campaign.status}</s-badge></s-stack></s-box>)}
              <Link to="/app/campaigns">View all campaigns</Link>
            </s-stack>
          ) : (
            <s-stack gap="base"><s-paragraph>Publish your first announcement bar, popup, banner, or COD confirmation campaign.</s-paragraph><s-button href="/app/campaigns/new">Create campaign</s-button></s-stack>
          )}
        </s-section>
      </s-grid>
      <s-section heading="Get live with confidence">
        <s-unordered-list>
          <s-list-item>Create the campaign and select the pages and devices where it belongs.</s-list-item>
          <s-list-item>Enable ConvertPop in the theme editor’s App embeds section with one secure deep link.</s-list-item>
          <s-list-item>Watch impressions and attributed outcomes here as the storefront widget serves visitors.</s-list-item>
        </s-unordered-list>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);
