import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

type CapabilityResult = {
  status: "ready" | "unavailable";
  detail: string;
  configurationCount: number;
};

type OverviewResponse = {
  data?: {
    shop?: { name: string; myshopifyDomain: string; plan?: { displayName?: string } };
    checkoutAndAccountsConfigurations?: { nodes?: Array<{ id: string; name: string; isPublished: boolean }> };
  };
  errors?: Array<{ message?: string }>;
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const response = await admin.graphql(`#graphql
    query CheckoutStudioOverview {
      shop { name myshopifyDomain plan { displayName } }
      checkoutAndAccountsConfigurations(first: 10) { nodes { id name isPublished } }
    }
  `);
  const payload = await response.json() as unknown as OverviewResponse;
  const errors = payload.errors;
  const configurations = payload.data?.checkoutAndAccountsConfigurations?.nodes ?? [];
  const capability: CapabilityResult = errors?.length
    ? { status: "unavailable", detail: errors.map((error) => error.message ?? "Shopify denied access").join(" "), configurationCount: 0 }
    : { status: configurations.length ? "ready" : "unavailable", detail: configurations.length ? "Shopify returned configuration records for this store." : "Shopify did not return a checkout configuration for this store.", configurationCount: configurations.length };

  return {
    shop: payload.data?.shop ?? { name: session.shop, myshopifyDomain: session.shop, plan: { displayName: "Unknown" } },
    capability,
  };
};

export default function Index() {
  const { shop, capability } = useLoaderData<typeof loader>();
  return (
    <s-page heading="Checkout Studio">
      <s-section heading={`Welcome, ${shop.name}`}>
        <s-paragraph>Build, save, and review checkout visual systems inside Shopify Admin using only supported Shopify configuration APIs and Checkout UI extensions.</s-paragraph>
        <s-stack direction="inline" gap="base">
          <s-badge tone="info">{shop.plan?.displayName ?? "Plan unavailable"}</s-badge>
          <s-badge tone={capability.status === "ready" ? "success" : "warning"}>{capability.status === "ready" ? "Connected" : "Action required"}</s-badge>
        </s-stack>
      </s-section>
      <s-section heading={capability.status === "ready" ? "Checkout configuration detected" : "Checkout configuration unavailable"}>
        <s-paragraph>{capability.detail}</s-paragraph>
        <s-paragraph>{capability.status === "ready" ? `${capability.configurationCount} configuration record${capability.configurationCount === 1 ? "" : "s"} are available for read-only review. Applying changes remains disabled until Checkout Studio’s separate update-and-rollback pipeline is complete.` : "Saved design drafts and the Checkout Studio Assurance Thank you page extension can continue independently. No checkout setting has been changed."}</s-paragraph>
      </s-section>
      <s-section heading="Safe release path">
        <s-unordered-list>
          <s-list-item>Design and save a merchant draft in Style Studio.</s-list-item>
          <s-list-item>Review supported checkout configuration through the server-side Admin GraphQL session.</s-list-item>
          <s-list-item>Use the Assurance extension on supported checkout or Thank you page targets.</s-list-item>
          <s-list-item>Apply remains intentionally locked until a reviewed mutation and rollback implementation is in place.</s-list-item>
        </s-unordered-list>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);
