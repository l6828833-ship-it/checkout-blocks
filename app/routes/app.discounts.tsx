import { Form, useActionData, useLoaderData } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

type DiscountResult = { data?: { codeDiscountNodes?: { nodes?: Array<{ id: string; codeDiscount?: { __typename?: string; title?: string; status?: string; codes?: { nodes?: Array<{ code?: string }> } } }> }; discountCodeBasicCreate?: { codeDiscountNode?: { id?: string }; userErrors?: Array<{ message?: string }> } } };

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const response = await admin.graphql(`#graphql
    query ConvertPopDiscounts { codeDiscountNodes(first: 25) { nodes { id codeDiscount { __typename ... on DiscountCodeBasic { title status codes(first: 1) { nodes { code } } } } } } }
  `);
  const payload = await response.json() as DiscountResult;
  return { discounts: payload.data?.codeDiscountNodes?.nodes ?? [], error: payload.data ? null : "Shopify did not return discounts for this shop." };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const form = await request.formData();
  const code = String(form.get("code") ?? "").trim().toUpperCase();
  const title = String(form.get("title") ?? "").trim();
  const percentage = Number(form.get("percentage") ?? 0);
  if (!/^[A-Z0-9_-]{3,40}$/.test(code) || !title || !(percentage > 0 && percentage <= 100)) return { error: "Enter a title, an alphanumeric code, and a percentage from 1 to 100." };
  const response = await admin.graphql(`#graphql
    mutation ConvertPopCreateDiscount($basicCodeDiscount: DiscountCodeBasicInput!) { discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) { codeDiscountNode { id } userErrors { message } } }
  `, { variables: { basicCodeDiscount: { title, code, startsAt: new Date().toISOString(), customerSelection: { all: true }, customerGets: { value: { percentage }, items: { all: true } }, usageLimit: null } } });
  const payload = await response.json() as DiscountResult;
  const errors = payload.data?.discountCodeBasicCreate?.userErrors ?? [];
  return errors.length ? { error: errors.map((item) => item.message).join(" ") } : { saved: true };
};

export default function Discounts() {
  const { discounts, error } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  return (
    <s-page heading="Discounts">
      <s-section heading="Create Shopify discount"><Form method="post"><s-stack direction="inline" gap="base"><s-text-field label="Title" name="title" required/><s-text-field label="Code" name="code" required/><s-text-field label="Percentage off" name="percentage" required/><s-button type="submit" variant="primary">Create discount</s-button></s-stack></Form>{actionData?.saved ? <s-banner tone="success">Discount created in Shopify.</s-banner> : null}{actionData?.error ? <s-banner tone="critical">{actionData.error}</s-banner> : null}</s-section>
      <s-section heading="Existing Shopify discount codes">{error ? <s-banner tone="warning">{error}</s-banner> : discounts.length ? <s-stack gap="base">{discounts.map((discount) => <s-box key={discount.id} padding="base" border="base"><s-stack direction="inline" justifyContent="space-between"><s-paragraph>{discount.codeDiscount?.title ?? "Shopify discount"}</s-paragraph><s-stack direction="inline" gap="base"><s-paragraph>{discount.codeDiscount?.codes?.nodes?.[0]?.code ?? "Code unavailable"}</s-paragraph><s-badge>{discount.codeDiscount?.status ?? "UNKNOWN"}</s-badge></s-stack></s-stack></s-box>)}</s-stack> : <s-paragraph>No Shopify discount codes are available.</s-paragraph>}</s-section>
    </s-page>
  );
}
