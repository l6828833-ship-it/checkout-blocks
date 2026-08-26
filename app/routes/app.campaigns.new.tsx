import { Form, redirect, useActionData } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { createCampaign, updateCampaign } from "../models/convertpop.server";
import type { CampaignKind } from "@prisma/client";

const kinds = ["ANNOUNCEMENT_BAR", "POPUP", "BANNER", "COD_FORM"] as const;

function checked(form: FormData, key: string) { return form.get(key) === "on"; }

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const form = await request.formData();
  const kind = String(form.get("kind") ?? "") as CampaignKind;
  const name = String(form.get("name") ?? "").trim();
  if (!name || !kinds.includes(kind)) return { error: "Choose a campaign type and enter a name." };
  const startAt = String(form.get("startsAt") ?? "");
  const endAt = String(form.get("endsAt") ?? "");
  const campaign = await createCampaign(session.shop, {
    name,
    kind,
    content: { message: String(form.get("message") ?? ""), heading: String(form.get("heading") ?? ""), body: String(form.get("body") ?? ""), cta: String(form.get("cta") ?? ""), consent: String(form.get("consent") ?? ""), sticky: checked(form, "sticky"), dismissible: checked(form, "dismissible"), freeShippingThreshold: Number(form.get("freeShippingThreshold") || 0) || undefined },
    targeting: { paths: String(form.get("paths") ?? "/").split(",").map((path) => path.trim()).filter(Boolean), device: String(form.get("device") ?? "all"), visitor: String(form.get("visitor") ?? "all") },
    schedule: { delaySeconds: Math.max(0, Number(form.get("delaySeconds") || 0)), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
  });
  if (startAt || endAt) {
    // The temporal fields are intentionally entered in the merchant's local time and stored as UTC dates by the server.
    await updateCampaign(session.shop, campaign.id, { startsAt: startAt ? new Date(startAt) : null, endsAt: endAt ? new Date(endAt) : null, status: startAt ? "SCHEDULED" : "DRAFT" });
  }
  return redirect("/app/campaigns");
};

export default function CampaignBuilder() {
  const actionData = useActionData<typeof action>();
  return (
    <s-page heading="Create campaign">
      <Form method="post">
        <s-grid gridTemplateColumns="minmax(0, 2fr) minmax(280px, 1fr)" gap="base">
          <s-stack gap="base">
            <s-section heading="Campaign details">
              <s-stack gap="base">
                <s-text-field label="Campaign name" name="name" required />
                <s-select label="Campaign type" name="kind"><s-option value="ANNOUNCEMENT_BAR">Announcement bar</s-option><s-option value="POPUP">Popup</s-option><s-option value="BANNER">Embedded banner</s-option><s-option value="COD_FORM">COD confirmation form</s-option></s-select>
              </s-stack>
            </s-section>
            <s-section heading="Content">
              <s-stack gap="base">
                <s-text-field label="Message" name="message" help-text="For announcement bars and banners." />
                <s-text-field label="Heading" name="heading" help-text="For popups and COD forms." />
                <s-text-area label="Body" name="body" />
                <s-text-field label="Call-to-action" name="cta" />
                <s-checkbox label="Make the announcement bar sticky" name="sticky" /><s-checkbox label="Allow visitors to dismiss it" name="dismissible" />
                <s-text-field label="Free-shipping threshold" name="freeShippingThreshold" help-text="Enter an amount. ConvertPop retrieves the live cart subtotal before rendering progress." />
              </s-stack>
            </s-section>
            <s-section heading="Targeting">
              <s-stack gap="base">
                <s-text-field label="Page paths" name="paths" value="/" help-text="Comma-separated path prefixes, such as /collections,/products." />
                <s-select label="Device" name="device"><s-option value="all">All devices</s-option><s-option value="desktop">Desktop only</s-option><s-option value="mobile">Mobile only</s-option></s-select>
                <s-select label="Visitor type" name="visitor"><s-option value="all">All visitors</s-option><s-option value="new">New visitors</s-option><s-option value="returning">Returning visitors</s-option></s-select>
                <s-text-field label="Display delay in seconds" name="delaySeconds" value="0" />
              </s-stack>
            </s-section>
            <s-section heading="Schedule"><s-stack gap="base" direction="inline"><s-text-field label="Start (local ISO date/time)" name="startsAt" help-text="Example: 2026-08-31T09:00" /><s-text-field label="End (local ISO date/time)" name="endsAt" help-text="Example: 2026-09-01T09:00" /></s-stack></s-section>
          </s-stack>
          <s-stack gap="base">
            <s-section heading="Live preview"><s-box padding="base" background="subdued"><s-stack gap="base"><s-paragraph>Representative storefront</s-paragraph><s-box padding="base" background="base" border="base"><s-badge tone="info">Announcement preview</s-badge><s-heading>Campaign message appears here</s-heading><s-paragraph>Targeting and schedule are evaluated in the lightweight storefront runtime.</s-paragraph><s-button>Preview call to action</s-button></s-box></s-stack></s-box></s-section>
            <s-section heading="Activation"><s-paragraph>Save as a draft, review in the theme preview, then activate from the Campaigns resource list.</s-paragraph><s-button type="submit" variant="primary">Save draft</s-button>{actionData?.error ? <s-banner tone="critical">{actionData.error}</s-banner> : null}</s-section>
          </s-stack>
        </s-grid>
      </Form>
    </s-page>
  );
}
