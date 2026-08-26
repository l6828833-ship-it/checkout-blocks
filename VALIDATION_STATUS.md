# Validation Status

The managed preview server is configured to use a local-only Shopify development fallback when the real Shopify environment variables are unavailable. This prevents a blank `appUrl` from blocking local compilation while the production document loader still rejects incomplete Shopify configuration.

The preview fallback is not an OAuth or App Bridge substitute. Live embedded installation, storefront rendering, billing confirmation, and webhook delivery remain blocked until the final Shopify app is configured with its real API key, secret, public HTTPS domain, allowed redirect URI, PostgreSQL datastore, and required Storefront API capability.

## Active Dev Dashboard status — 25 August 2026

The active Dev Dashboard app is still named **checkout styles**. Its public App URL is correctly set to `https://checkout-studio.fly.dev`, and its allowed redirect URL has been updated to `https://checkout-studio.fly.dev/auth/callback`. Its configured scopes match ConvertPop’s requested access list. Before release, rename the app to ConvertPop, ensure embedded admin is enabled, configure the app-proxy target as `https://checkout-studio.fly.dev/apps/convertpop`, and use a stable released Webhooks API version rather than the `2026-10` release candidate unless the server SDK and deployed API version are deliberately upgraded together.
