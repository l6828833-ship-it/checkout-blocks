import type { StyleTokens } from "../shared/checkoutStudio";
import * as db from "./db";
import { decryptShopifyCredential, hasCheckoutConfigurationWriteScope } from "./shopifyEmbedded";

const ADMIN_API_VERSION = "2026-07";
const COLOR_KEYS = [
  "background", "surface", "text", "mutedText", "primary", "primaryText",
  "border", "focus", "error", "success", "secondary", "secondaryText",
] as const;

type ShopifyGraphQLError = { message?: string };
type ConfigurationNode = {
  id: string;
  name: string;
  isPublished: boolean;
  branding?: Record<string, unknown> | null;
};
type ConfigurationListResponse = {
  data?: { checkoutAndAccountsConfigurations?: { nodes?: ConfigurationNode[] } };
  errors?: ShopifyGraphQLError[];
};
type UpdateResponse = {
  data?: {
    checkoutAndAccountsConfigurationUpdate?: {
      configuration?: { id: string; name: string; updatedAt?: string } | null;
      userErrors?: Array<{ field?: string[]; message?: string; code?: string }>;
    };
  };
  errors?: ShopifyGraphQLError[];
};

export class ShopifyPublishError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ShopifyPublishError";
  }
}

const CONFIGURATION_SNAPSHOT_QUERY = `
  query CheckoutStudioPublishConfiguration {
    checkoutAndAccountsConfigurations(first: 10) {
      nodes {
        id
        name
        isPublished
        branding {
          designTokens {
            colors {
              palette {
                color1 color2 color3 color4 color5 color6
                color7 color8 color9 color10 color11 color12
              }
            }
            cornerRadius { small base large }
          }
          components {
            shared {
              colors { accent button control critical info success warning decorative }
            }
          }
          surfaces {
            checkout {
              components {
                header { colors { base { background text accent border icon decorative } } }
                main { colors { base { background text } } }
                orderSummary { colors { base { background text } } }
                footer { colors { base { background text } } }
              }
            }
          }
        }
      }
    }
  }
`;

const UPDATE_CONFIGURATION_MUTATION = `
  mutation CheckoutStudioUpdateConfiguration($id: ID!, $configuration: CheckoutAndAccountsConfigurationInput!) {
    checkoutAndAccountsConfigurationUpdate(id: $id, configuration: $configuration) {
      configuration { id name updatedAt }
      userErrors { field message code }
    }
  }
`;

function firstGraphqlMessage(payload: { errors?: ShopifyGraphQLError[] }) {
  return payload.errors?.find(error => error.message)?.message;
}

function supportedHex(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value);
}

function assertPublishableTokens(tokens: StyleTokens) {
  for (const key of COLOR_KEYS) {
    if (!supportedHex(tokens[key])) {
      throw new ShopifyPublishError(`${key} must be a six-digit hexadecimal color before publishing.`);
    }
  }
  if (!Number.isInteger(tokens.radius) || tokens.radius < 1 || tokens.radius > 48) {
    throw new ShopifyPublishError("Corner radius must be a whole number between 1 and 48 pixels before publishing.");
  }
}

/** Maps only the editor fields that Shopify’s current unified configuration API supports. */
export function buildShopifyConfigurationInput(tokens: StyleTokens) {
  assertPublishableTokens(tokens);
  const radius = tokens.radius;
  return {
    branding: {
      designTokens: {
        colors: {
          palette: {
            color1: tokens.background,
            color2: tokens.surface,
            color3: tokens.text,
            color4: tokens.mutedText,
            color5: tokens.primary,
            color6: tokens.primaryText,
            color7: tokens.border,
            color8: tokens.focus,
            color9: tokens.error,
            color10: tokens.success,
            color11: tokens.secondary,
            color12: tokens.secondaryText,
          },
        },
        cornerRadius: {
          small: Math.max(1, Math.round(radius / 2)),
          base: radius,
          large: Math.max(radius + 1, Math.round(radius * 1.5)),
        },
      },
      components: {
        shared: {
          colors: {
            accent: tokens.focus,
            button: tokens.primary,
            control: tokens.primary,
            critical: tokens.error,
            info: tokens.focus,
            success: tokens.success,
            warning: tokens.secondary,
            decorative: tokens.secondary,
          },
        },
      },
      surfaces: {
        checkout: {
          components: {
            header: {
              colors: {
                base: {
                  background: tokens.surface,
                  text: tokens.text,
                  accent: tokens.primary,
                  border: tokens.border,
                  icon: tokens.text,
                  decorative: tokens.secondary,
                },
              },
            },
            main: { colors: { base: { background: tokens.background, text: tokens.text } } },
            orderSummary: { colors: { base: { background: tokens.surface, text: tokens.text } } },
            footer: { colors: { base: { background: tokens.background, text: tokens.mutedText } } },
          },
        },
      },
    },
  };
}

async function shopifyGraphql<T>(shopDomain: string, accessToken: string, query: string, variables?: Record<string, unknown>): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`https://${shopDomain}/admin/api/${ADMIN_API_VERSION}/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new ShopifyPublishError("Checkout Studio could not reach Shopify. The live checkout has not changed.");
  }

  if (!response.ok) {
    throw new ShopifyPublishError(response.status === 401 || response.status === 403
      ? "Shopify did not authorize the reviewed checkout update. Reopen Checkout Studio from Shopify Admin and confirm checkout settings permissions."
      : `Shopify rejected the checkout update with HTTP ${response.status}. The live checkout has not changed.`);
  }
  return response.json() as Promise<T>;
}

async function getPublishContext(ownerOpenId: string) {
  const store = await db.getStoreByOwnerOpenId(ownerOpenId);
  if (!store || store.status !== "connected") {
    throw new ShopifyPublishError("Open Checkout Studio from Shopify Admin before applying a live checkout change.");
  }
  const installation = await db.getShopifyInstallationByShopDomain(store.shopDomain);
  if (!installation || installation.status !== "active") {
    throw new ShopifyPublishError("The Shopify authorization is not active. Reopen Checkout Studio from Shopify Admin and try again.");
  }
  if (!hasCheckoutConfigurationWriteScope(installation.grantedScopes)) {
    throw new ShopifyPublishError("The installed Shopify app is missing write checkout configuration access. Update scopes and reinstall the checkout styles app.");
  }
  return {
    store,
    accessToken: decryptShopifyCredential(installation.accessTokenCiphertext),
  };
}

async function getPublishedConfiguration(shopDomain: string, accessToken: string) {
  const payload = await shopifyGraphql<ConfigurationListResponse>(shopDomain, accessToken, CONFIGURATION_SNAPSHOT_QUERY);
  const apiError = firstGraphqlMessage(payload);
  if (apiError) throw new ShopifyPublishError(`Shopify did not approve the fresh capability check: ${apiError}`);
  const configuration = payload.data?.checkoutAndAccountsConfigurations?.nodes?.find(node => node.isPublished);
  if (!configuration) {
    throw new ShopifyPublishError("Shopify did not return a published Checkout and Accounts Configuration. The live checkout has not changed.");
  }
  return configuration;
}

function updateErrors(payload: UpdateResponse) {
  const apiError = firstGraphqlMessage(payload);
  if (apiError) return apiError;
  const errors = payload.data?.checkoutAndAccountsConfigurationUpdate?.userErrors ?? [];
  if (errors.length === 0) return null;
  return errors.map(error => error.message ?? error.code ?? "Unknown Shopify configuration error").join(" ");
}

export type ShopifyPublishResult = {
  storeId: number;
  configurationId: string;
  configurationName: string;
  previousConfiguration: ConfigurationNode;
  appliedConfiguration: Record<string, unknown>;
};

/** Performs a fresh read, then applies only the reviewed editor token mapping. */
export async function publishShopifyConfiguration(input: { ownerOpenId: string; tokens: StyleTokens }): Promise<ShopifyPublishResult> {
  const { store, accessToken } = await getPublishContext(input.ownerOpenId);
  const previousConfiguration = await getPublishedConfiguration(store.shopDomain, accessToken);
  const appliedConfiguration = buildShopifyConfigurationInput(input.tokens);
  const payload = await shopifyGraphql<UpdateResponse>(store.shopDomain, accessToken, UPDATE_CONFIGURATION_MUTATION, {
    id: previousConfiguration.id,
    configuration: appliedConfiguration,
  });
  const error = updateErrors(payload);
  if (error) throw new ShopifyPublishError(`Shopify did not apply the reviewed configuration: ${error}`);
  const updated = payload.data?.checkoutAndAccountsConfigurationUpdate?.configuration;
  if (!updated?.id) throw new ShopifyPublishError("Shopify did not confirm the reviewed configuration update. The live checkout has not changed.");
  return {
    storeId: store.id,
    configurationId: updated.id,
    configurationName: updated.name,
    previousConfiguration,
    appliedConfiguration,
  };
}

/** Re-applies the exact snapshot stored immediately before a reviewed publish. */
export async function rollbackShopifyConfiguration(input: { ownerOpenId: string; configurationId: string; previousConfiguration: Record<string, unknown> }) {
  const { store, accessToken } = await getPublishContext(input.ownerOpenId);
  const branding = input.previousConfiguration.branding;
  if (!branding || typeof branding !== "object") {
    throw new ShopifyPublishError("The saved rollback snapshot is incomplete. The live checkout has not changed.");
  }
  const payload = await shopifyGraphql<UpdateResponse>(store.shopDomain, accessToken, UPDATE_CONFIGURATION_MUTATION, {
    id: input.configurationId,
    configuration: { branding },
  });
  const error = updateErrors(payload);
  if (error) throw new ShopifyPublishError(`Shopify did not restore the saved configuration: ${error}`);
  const updated = payload.data?.checkoutAndAccountsConfigurationUpdate?.configuration;
  if (!updated?.id) throw new ShopifyPublishError("Shopify did not confirm the rollback. The live checkout has not changed.");
  return { storeId: store.id, configurationId: updated.id, configurationName: updated.name };
}
