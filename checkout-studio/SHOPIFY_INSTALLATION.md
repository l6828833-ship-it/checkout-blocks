# Checkout Studio: Shopify Installation and Authorization Guide

Checkout Studio is designed to be installed as an **embedded Shopify Admin app**. Until the app has been installed by a merchant and Shopify has granted the required permissions, Checkout Studio intentionally keeps live publish, Shopify preview, and campaign activation controls disabled. The workspace remains useful for exploring style systems, saving drafts, previewing representative checkout states, and preparing future campaigns.

> **Important:** The preview in Checkout Studio is a design simulation. It is not a rendering of a merchant’s live Shopify checkout and must never be represented as one.

## What this project currently does

The completed workspace includes merchant-scoped style records, saved draft versions, campaign records, content-block configurations, contrast checks, an explicitly simulated checkout preview, and safe unavailable-state messaging. It does **not** submit a Shopify checkout branding mutation until the app is installed through a merchant-owned Shopify app configuration and the required capability checks return a supported result.

| Capability | Current state | What enables it |
|---|---:|---|
| Style exploration, preview, and quality guidance | Available | No Shopify connection required. |
| Merchant-scoped drafts and versions | Available | Project authentication and database. |
| Campaign preparation | Available | Saved as blocked until connection validation. |
| Checkout Branding API publish | Safely gated | Shopify app installation, approved access scope, compatible checkout configuration, and Shopify Plus eligibility. |
| Checkout UI extension content blocks | Safely gated | Shopify app extension deployment, Shopify Plus eligibility for information/shipping/payment targets, and eligible extension target availability. |
| Automatic campaign activation and restoration | Safely gated | Deployed app callback, authorized store capability check, and an active scheduling configuration. |

## Final app identity

The merchant has selected **checkout styles** as the one final Shopify app identity. Its App Home URL will open the full **Checkout Studio** merchant workspace inside Shopify Admin. The **Checkout Studio Assurance** extension must be relinked to this same app before production deployment; the currently linked `checkout-studio-assurance` development app is only a successful test vehicle and is not the final product identity.

The embedded app and native extension have different approved roles. Checkout Studio provides the full merchant workflow—theme selection, simulated device previews, saved drafts, release review, and validated capability status—inside Shopify Admin. The Assurance extension is a separate, customer-facing UI component rendered only in the Shopify Checkout and Accounts editor at supported targets. This separation is Shopify’s supported architecture; it does not make the merchant workspace a widget.

## Recommended merchant installation path

Create and own the Shopify application in the Shopify Dev Dashboard. Configure it as an embedded app, set its application URL to the published Checkout Studio URL, and use a production HTTPS redirect URL that is handled by the application’s Shopify OAuth server. Do not reuse the failed connector URL or manually reuse a previous OAuth state value.

| Step | Merchant or app-owner action | Checkout Studio behavior afterward |
|---|---|---|
| 1 | Use the existing **checkout styles** app in the Dev Dashboard and keep **Embed app in Shopify admin** enabled. | Establishes the single merchant-owned app identity and client credentials. |
| 2 | Publish this project from the Manus interface, then set the published HTTPS address as the app’s URL. | Gives Shopify a stable location for the embedded workspace. |
| 3 | Set the App URL to `https://checkoutapp-slsdybjx.manus.space` and configure the dedicated callback `https://checkoutapp-slsdybjx.manus.space/api/shopify/auth/callback`. | Gives Shopify a stable embedded location and an explicit production callback boundary. |
| 4 | Declare the minimum scopes required for the verified implementation. Use optional scopes only for features that are genuinely optional. | Allows Checkout Studio to inspect only the configuration data it needs. |
| 5 | Install the app from the merchant’s Shopify Admin. Approve the requested permissions. | Creates a merchant-scoped installation and lets the app retrieve actual capability context. |
| 6 | Query the app installation’s approved scopes and retrieve checkout configuration/profile context. | Replaces every `unknown` capability status with an explicit available, limited, or unavailable state. |
| 7 | Enable live review, Shopify preview, apply, and scheduling controls only when validation succeeds. | Prevents unavailable checkout features from ever appearing publishable. |

## Shopify-supported boundaries

Shopify documents checkout styling through checkout profiles and the Checkout Branding API. Current documentation states that checkout styling customizations are available only to Shopify Plus merchants. Shopify also documents that Checkout UI extensions on the information, shipping, and payment steps require Shopify Plus. The app must therefore treat plan and target eligibility as runtime checks rather than a promise made in the interface.[1] [2]

Checkout Studio should limit live styling to Shopify-supported design-system and customization fields. It must not inject scripts, edit `checkout.liquid`, scrape a checkout page, attempt to modify page-specific styles where Shopify does not support that, or bypass merchant plan restrictions. Shopify’s checkout styling documentation also notes that styling is not currently customized per individual checkout page and that SVG is not a supported styling image type.[1]

| Feature area | Permit in live mode only when verified | Otherwise show |
|---|---|---|
| Global checkout branding | An eligible checkout profile and supported branding fields are available. | Saved tokens, representative preview, and a capability explanation. |
| Layout controls | Shopify reports the specific configuration field as available. | Disabled control with a safe fallback description. |
| Content blocks | The deployed UI extension has an eligible target and merchant placement is permitted. | Module preview and placement guidance only. |
| Shopify-controlled elements | Never. | A clear “Shopify-controlled” label with no publish control. |
| Publish and rollback | Capability validation and a successful review summary. | A disabled action that says why it cannot run. |

## Scope discipline

Shopify advises declaring scopes through the app configuration, Dev Dashboard version, or authorization URL depending on the application architecture. An app can only use a scope after Shopify approves it for the store.[3] Checkout Studio should request the smallest scope set that supports the implemented release and should avoid customer, order, fulfillment, and storefront-checkout scopes unless a verified product feature actually needs them.

> The failed authorization flow should not be treated as a Checkout Studio publish failure. It is an installation/authorization problem at the Shopify app or connector layer. Create or correct the merchant-owned app configuration first, then authorize the merchant through a fresh install path.

## Production handoff checklist

Before enabling any live checkout mutation, confirm the app uses Shopify’s current embedded-app authentication architecture; server-side session storage; a verified redirect URL; encrypted storage for merchant access tokens; webhook verification for uninstall, shop updates, and scope updates; idempotency keys and audit logging for publish operations; and an Admin GraphQL mutation adapter that performs a fresh capability check immediately before calling Shopify. The publish adapter must record Shopify user errors and leave the live configuration unchanged on failure.

For scheduled styles, create platform-managed callbacks only after the app is deployed. Persist the resulting task identifier against the campaign record, look up campaign state by that task identifier in an idempotent callback, re-check store eligibility before activation, and retain the last stable configuration for restoration. The existing workspace persists blocked campaign records until those prerequisites are complete.

## References

[1]: https://shopify.dev/docs/apps/build/checkout/styling "Shopify: About checkout styling"
[2]: https://shopify.dev/docs/api/checkout-ui-extensions/latest "Shopify: Checkout UI extensions"
[3]: https://shopify.dev/docs/apps/build/authentication-authorization/manage-access-scopes "Shopify: Manage access scopes"
