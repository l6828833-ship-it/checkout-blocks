# Checkout Studio React Router Rebuild Architecture

## Official scaffold

This rebuild is based on Shopify’s official React Router app template. It provides embedded admin authentication through `@shopify/shopify-app-react-router`, Prisma-backed session storage, App Bridge integration, and server-authenticated Admin GraphQL loaders. The template’s recommended initialization command is:

```bash
shopify app init --template=https://github.com/Shopify/shopify-app-template-react-router
```

The isolated source workspace was cloned from the official template so the existing Checkout Studio implementation remains available as a migration reference.

## Secure foundations included

The scaffold configuration declares the final `checkout styles` identity, the Fly.io application URL, Checkout and Accounts Configuration read/write scopes, `app/uninstalled`, `app/scopes_update`, and all three mandatory privacy compliance topics. The server-side overview route authenticates with `authenticate.admin(request)` before reading Shopify Admin GraphQL. It never exposes an access token to the browser.

The default SQLite session store was converted to Prisma PostgreSQL configuration for the merchant’s existing Supabase deployment. A production migration remains intentionally pending until the final Shopify CLI client identity and Fly environment values are configured.

## Live safety

The scaffold performs only read-only configuration discovery. It does not apply checkout styling, modify payments, inject scripts, or change checkout data. A separate, reviewed update-and-rollback implementation is required before live configuration actions can be enabled.

## Official sources

1. https://github.com/Shopify/shopify-app-template-react-router
2. https://shopify.dev/docs/apps/build/build?framework=reactRouter
3. https://shopify.dev/docs/api/shopify-app-react-router/latest/guide-webhooks
