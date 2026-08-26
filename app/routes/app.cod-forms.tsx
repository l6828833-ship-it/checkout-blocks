import { useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import { ensureShop } from "../models/convertpop.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await ensureShop(session.shop);
  const [provider, forms, outcomes] = await Promise.all([
    prisma.smsProviderConfig.findUnique({ where: { shopId: shop.id }, select: { provider: true, recoveryEnabled: true, updatedAt: true } }),
    prisma.campaign.findMany({ where: { shopId: shop.id, kind: "COD_FORM" }, orderBy: { updatedAt: "desc" } }),
    prisma.codSubmission.groupBy({ by: ["status"], where: { shopId: shop.id }, _count: { _all: true } }),
  ]);
  return { provider, forms, outcomes };
};

export default function CodForms() {
  const { provider, forms, outcomes } = useLoaderData<typeof loader>();
  return (
    <s-page heading="COD forms">
      <s-section slot="primary-action"><s-button href="/app/campaigns/new" variant="primary">Create COD form</s-button></s-section>
      <s-grid gridTemplateColumns="repeat(2, minmax(0, 1fr))" gap="base">
        <s-section heading="OTP verification">
          <s-stack gap="base"><s-badge tone={provider ? "success" : "warning"}>{provider ? "Connected" : "Not connected"}</s-badge><s-paragraph>{provider ? `Twilio Verify is configured${provider.recoveryEnabled ? " with merchant-reviewed recovery messaging enabled" : ""}.` : "Configure an SMS verification provider before publishing a COD form."}</s-paragraph><s-button href="/app/settings">Manage SMS provider</s-button></s-stack>
        </s-section>
        <s-section heading="Confirmation outcomes">
          {outcomes.length ? <s-stack gap="base">{outcomes.map((outcome) => <s-box key={outcome.status} border="base" padding="base"><s-stack direction="inline" justifyContent="space-between"><s-paragraph>{outcome.status.replaceAll("_", " ")}</s-paragraph><s-heading>{outcome._count._all}</s-heading></s-stack></s-box>)}</s-stack> : <s-paragraph>No COD confirmation attempts have been recorded.</s-paragraph>}
        </s-section>
      </s-grid>
      <s-section heading="Configured forms">
        {forms.length ? <s-stack gap="base">{forms.map((form) => <s-box key={form.id} border="base" padding="base"><s-stack direction="inline" justifyContent="space-between"><s-paragraph>{form.name}</s-paragraph><s-badge tone={form.status === "LIVE" ? "success" : "info"}>{form.status}</s-badge></s-stack></s-box>)}</s-stack> : <s-empty-state heading="No COD forms yet" image=""><s-paragraph>Create a COD form campaign, configure required fields and consent copy, then activate it after your SMS provider is connected.</s-paragraph></s-empty-state>}
      </s-section>
      <s-section heading="Safe order creation"><s-paragraph>A Shopify draft order is created only after the provider reports an approved OTP. ConvertPop never records an order from an unverified submission.</s-paragraph></s-section>
    </s-page>
  );
}
