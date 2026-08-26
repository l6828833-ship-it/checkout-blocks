# Validation Status

The managed preview server is configured to use a local-only Shopify development fallback when the real Shopify environment variables are unavailable. This prevents a blank `appUrl` from blocking local compilation while the production document loader still rejects incomplete Shopify configuration.

The preview fallback is not an OAuth or App Bridge substitute. Live embedded installation, storefront rendering, billing confirmation, and webhook delivery remain blocked until the final Shopify app is configured with its real API key, secret, public HTTPS domain, allowed redirect URI, PostgreSQL datastore, and required Storefront API capability.
