import { decryptShopifyCredential } from "./shopifyEmbedded";
import * as db from "./db";

const ADMIN_API_VERSION = "2026-07";

type GraphQLError = { message?: string };

type CapabilityQueryResponse = {
  data?: {
    checkoutAndAccountsConfigurations?: {
      nodes?: Array<{ id: string; name: string; isPublished: boolean }>;
    };
  };
  errors?: GraphQLError[];
};

export type CheckoutCapabilityStatus = {
  state: "ready" | "denied" | "error";
  title: string;
  message: string;
  checkoutBrandingAvailable: boolean;
  configurationIds: string[];
};

const CHECKOUT_CONFIGURATION_QUERY = `
  query CheckoutStudioCapabilityCheck {
    checkoutAndAccountsConfigurations(first: 10) {
      nodes { id name isPublished }
    }
  }
`;

function unavailable(message: string, state: "denied" | "error" = "denied"): CheckoutCapabilityStatus {
  return {
    state,
    title: state === "denied" ? "Checkout configuration unavailable" : "Capability check could not finish",
    message,
    checkoutBrandingAvailable: false,
    configurationIds: [],
  };
}

/**
 * Classifies a Shopify Admin GraphQL response without inferring plan eligibility.
 * Only a successful query with at least one configuration is considered ready.
 */
export function classifyCheckoutConfigurationResponse(payload: CapabilityQueryResponse): CheckoutCapabilityStatus {
  const apiMessage = payload.errors?.find(error => error.message)?.message;
  if (apiMessage) {
    return unavailable(`Shopify did not grant access to checkout configuration: ${apiMessage}`);
  }

  const configurations = payload.data?.checkoutAndAccountsConfigurations?.nodes;
  if (!configurations || configurations.length === 0) {
    return unavailable("Shopify did not return an eligible Checkout and Accounts Configuration. This API is available to Shopify Plus stores with the required checkout access.");
  }

  return {
    state: "ready",
    title: "Checkout configuration verified",
    message: "Shopify returned an eligible checkout configuration. Checkout Studio will still require an explicit reviewed action before it changes live checkout settings.",
    checkoutBrandingAvailable: true,
    configurationIds: configurations.map(configuration => configuration.id),
  };
}

/**
 * Reads the merchant's configuration through their encrypted, server-only Admin
 * token. It performs no mutation and never serializes the token to the client.
 */
export async function getCheckoutCapabilityStatus(ownerOpenId: string): Promise<CheckoutCapabilityStatus> {
  const store = await db.getStoreByOwnerOpenId(ownerOpenId);
  if (!store || store.status !== "connected") {
    return unavailable("A verified Shopify store connection is required before Checkout Studio can check checkout capabilities.");
  }

  const installation = await db.getShopifyInstallationByShopDomain(store.shopDomain);
  if (!installation || installation.status !== "active") {
    const result = unavailable("The Shopify authorization is not active. Reopen Checkout Studio from Shopify Admin to refresh the merchant session.");
    await db.upsertFeatureCapability({ storeId: store.id, capability: "checkout_branding", availability: "unavailable", reason: result.message, fallback: "Continue using the labeled simulation while authorization is restored." });
    return result;
  }

  let result: CheckoutCapabilityStatus;
  try {
    const accessToken = decryptShopifyCredential(installation.accessTokenCiphertext);
    const response = await fetch(`https://${store.shopDomain}/admin/api/${ADMIN_API_VERSION}/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: JSON.stringify({ query: CHECKOUT_CONFIGURATION_QUERY }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      result = unavailable(response.status === 401 || response.status === 403
        ? "Shopify did not authorize checkout configuration access for this installation. The live checkout has not changed."
        : `Shopify capability check returned HTTP ${response.status}. The live checkout has not changed.`, response.status >= 500 ? "error" : "denied");
    } else {
      result = classifyCheckoutConfigurationResponse(await response.json() as CapabilityQueryResponse);
    }
  } catch {
    result = unavailable("Checkout Studio could not complete the Shopify capability check. The live checkout has not changed; try refreshing the connection.", "error");
  }

  await db.upsertFeatureCapability({
    storeId: store.id,
    capability: "checkout_branding",
    availability: result.checkoutBrandingAvailable ? "available" : result.state === "error" ? "unknown" : "unavailable",
    reason: result.message,
    fallback: result.checkoutBrandingAvailable
      ? "Review a saved draft before any live configuration action."
      : "Continue using the labeled simulation and Shopify-supported Thank you page extension target.",
  });
  return result;
}
