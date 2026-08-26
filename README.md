# ConvertPop

ConvertPop is an embedded Shopify application for creating, operating, and measuring onsite conversion campaigns. It ships a Shopify-native embedded admin, a Theme App Extension app embed, server-side impression attribution, Shopify subscription billing, and SMS-verified cash-on-delivery confirmation that creates Shopify draft orders only after successful verification.

## Product scope

The merchant-facing admin uses Shopify App Bridge and current Polaris web components. The dashboard uses an equal-width two-column layout for performance and campaign status. The campaign builder uses a primary/secondary editor layout so configuration and a representative storefront preview remain visible together. Storefront campaigns are delivered through a Theme App Extension and Shopify App Proxy; ConvertPop never asks a merchant to edit theme files.

| Area | Implemented behavior |
|---|---|
| Embedded install | Shopify React Router authentication, Prisma offline-session persistence, server-rendered API-key meta tag, and a production configuration guard |
| Campaigns | Announcement bars, popups, banners, and COD forms with merchant-scoped content, targeting, scheduling, and activation state |
| Storefront | App embed fetches signed app-proxy configuration, evaluates lightweight targeting, retrieves cart subtotal for free-shipping progress, and fails closed when configuration is unavailable |
| Attribution | Server-side app-proxy impression endpoint records campaign and shop attribution, and blocks serving once the confirmed plan cap is met |
| Billing | Shopify recurring subscription configuration for Plus, Pro, and Max with a seven-day trial, plan synchronization, and server-side feature/usage gates |
| COD | Merchant-encrypted Twilio Verify configuration; OTP-approved submissions create Shopify draft orders tagged for cash on delivery |
| Compliance | Verified Shopify webhook handlers for uninstall, data request, customer redaction, shop redaction, and subscription updates |

## Required production configuration

Do not commit any secrets. The deployed service must provide the following environment variables. `SHOPIFY_APP_URL` must be a stable public HTTPS URL and match the configured App URL, redirect URI, and app-proxy target.

| Variable | Purpose |
|---|---|
| `SHOPIFY_API_KEY` | Shopify app client identifier, rendered into the embedded document |
| `SHOPIFY_API_SECRET` | Server-only Shopify app secret used for OAuth and webhook verification |
| `SHOPIFY_APP_URL` | Permanent public HTTPS application URL |
| `SCOPES` | Exact approved OAuth scope list matching `shopify.app.toml` |
| `DATABASE_URL` | Production PostgreSQL connection string |
| `CONVERTPOP_ENCRYPTION_KEY` | Base64-encoded 32-byte key for merchant SMS credentials and COD PII |
| `CONVERTPOP_PII_HMAC_KEY` | HMAC key used for customer-level redaction lookup without persisting raw identifiers |
| `CONVERTPOP_VISITOR_HMAC_KEY` | HMAC key used to attribute anonymous storefront events without storing raw visitor IDs |
| `SHOPIFY_BILLING_TEST_MODE` | Set to `true` only for development-store billing validation |

## Deploy and configure

First, provision PostgreSQL and apply the reviewed migration with `pnpm prisma migrate deploy`. Configure the app’s actual client ID, permanent URL, redirect URI, app proxy, and approved minimal scopes through Shopify CLI and the Dev Dashboard. Deploy the Theme App Extension with the application. In the merchant’s theme editor, enable the **ConvertPop campaigns** app embed; a direct theme-editor deep link should be provided in the final embedded onboarding experience.

The Shopify configuration is set to `https://checkout-studio.fly.dev`. Configure this exact URL as the App URL in the Shopify Dev Dashboard, retain `https://checkout-studio.fly.dev/auth/callback` as the allowed OAuth redirect, and confirm the deployed Fly.io service serves the same URL over HTTPS before installation.

## Development and validation

Run `pnpm check` for strict TypeScript verification and `npm test` for the security and storefront-runtime unit tests. The local preview Vite server uses a non-production URL fallback only to compile the application. It cannot authenticate a real merchant or substitute for Shopify CLI development. Use `pnpm shopify:dev` after configuring a real Shopify app and PostgreSQL datastore.

## Security and privacy

COD phone numbers, addresses, and merchant-provided SMS credentials are encrypted at rest. Raw OTP codes are never stored, and the implementation does not log COD PII. Customer redaction uses a non-reversible HMAC reference when a Shopify customer identifier is available. Shop redaction deletes all sessions, campaigns, attribution, subscriptions, COD submissions, and webhook delivery records for the shop.

## References

[Shopify App Home and Polaris web components](https://shopify.dev/docs/api/app-home)

[Shopify Theme App Extensions](https://shopify.dev/docs/apps/build/online-store/theme-app-extensions/configuration)

[Shopify app proxy authentication](https://shopify.dev/docs/api/shopify-app-react-router/latest/authenticate/public/app-proxy)

[Shopify React Router billing](https://shopify.dev/docs/api/shopify-app-react-router/latest/apis/billing)
