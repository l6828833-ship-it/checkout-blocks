import { Form, useActionData, useLoaderData } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { BILLING_PLANS, billingTestMode, syncSubscription } from "../services/billing.server";
import { saveTwilioConfiguration } from "../services/cod.server";
import { ensureShop } from "../models/convertpop.server";
import { MAX_PLAN, PLUS_PLAN, PRO_PLAN } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, billing } = await authenticate.admin(request);
  const [check, shop] = await Promise.all([billing.check(), ensureShop(session.shop)]);
  const subscription = check.appSubscriptions[0];
  await syncSubscription(session.shop, subscription);
  return { shop, subscription, plans: Object.entries(BILLING_PLANS) };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, billing } = await authenticate.admin(request);
  const form = await request.formData();
  const intent = String(form.get("intent") ?? "");
  if (intent === "select-plan") {
    const selected = String(form.get("plan") ?? "");
    const paidPlan = selected === "PLUS" ? PLUS_PLAN : selected === "PRO" ? PRO_PLAN : selected === "MAX" ? MAX_PLAN : null;
    if (!paidPlan) return { error: "Choose a paid ConvertPop plan." };
    await billing.request({ plan: paidPlan, isTest: billingTestMode() });
  }
  if (intent === "cancel-plan") {
    const check = await billing.check();
    const active = check.appSubscriptions[0];
    if (!active?.id) return { error: "No active Shopify subscription is available to cancel." };
    const cancelled = await billing.cancel({ subscriptionId: active.id, isTest: billingTestMode(), prorate: true });
    await syncSubscription(session.shop, { id: cancelled.id, name: cancelled.name, status: cancelled.status, currentPeriodEnd: cancelled.currentPeriodEnd });
    return { cancelled: true };
  }
  if (intent === "save-twilio") {
    await saveTwilioConfiguration(session.shop, { apiKeySid: String(form.get("apiKeySid") ?? ""), apiKeySecret: String(form.get("apiKeySecret") ?? ""), verifyServiceSid: String(form.get("verifyServiceSid") ?? "") }, form.get("recoveryEnabled") === "on");
    return { saved: true };
  }
  return { error: "Unsupported settings action." };
};

export default function Settings() {
  const { shop, subscription, plans } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  return (
    <s-page heading="Settings">
      <s-section heading="Plan and billing"><s-stack gap="base"><s-paragraph>{subscription?.name ?? "ConvertPop Free"} {subscription?.status ? `· ${subscription.status}` : ""}</s-paragraph>{subscription?.id ? <Form method="post"><input type="hidden" name="intent" value="cancel-plan"/><s-button type="submit" tone="critical">Cancel subscription</s-button></Form> : null}{actionData?.cancelled ? <s-banner tone="success">Subscription cancellation submitted to Shopify.</s-banner> : null}<s-grid gridTemplateColumns="repeat(2, minmax(0, 1fr))" gap="base">{plans.map(([key, plan]) => <s-section key={key} heading={plan.label}><s-paragraph>{plan.amount ? `$${plan.amount}/month` : "Free"}</s-paragraph><s-paragraph>{plan.impressions.toLocaleString()} impressions per month</s-paragraph>{key !== "FREE" ? <Form method="post"><input type="hidden" name="intent" value="select-plan"/><input type="hidden" name="plan" value={key}/><s-button type="submit">Choose {key}</s-button></Form> : null}</s-section>)}</s-grid></s-stack></s-section>
      <s-section heading="SMS verification provider"><s-paragraph>ConvertPop encrypts these merchant-supplied Twilio Verify credentials before persistence. They are used only to send and verify COD confirmation codes.</s-paragraph><Form method="post"><input type="hidden" name="intent" value="save-twilio"/><s-stack gap="base"><s-text-field label="Twilio API key SID" name="apiKeySid" required/><s-text-field label="Twilio API key secret" name="apiKeySecret" required/><s-text-field label="Twilio Verify Service SID" name="verifyServiceSid" required/><s-checkbox label="Enable recovery messaging only after explicit merchant review" name="recoveryEnabled"/><s-button type="submit" variant="primary">Save encrypted provider connection</s-button></s-stack></Form>{actionData?.saved ? <s-banner tone="success">Provider connection saved.</s-banner> : null}{actionData?.error ? <s-banner tone="critical">{actionData.error}</s-banner> : null}</s-section>
      <s-section heading="Privacy"><s-paragraph>COD phone numbers, addresses, and merchant messaging credentials are encrypted at rest. Customer data requests and redaction webhooks are handled server-side and never exposed in client logs.</s-paragraph></s-section>
    </s-page>
  );
}
