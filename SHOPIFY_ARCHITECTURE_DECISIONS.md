# Shopify Architecture Decisions

## Embedded Admin

ConvertPop uses Shopify App Bridge and Shopify’s current Polaris web components for the embedded-admin experience. The app will use Shopify navigation, page, section, grid, form, and resource primitives rather than reproducing Shopify Admin chrome through custom CSS or copied color values. This approach follows Shopify’s App Home guidance.[1]

## Application Server

The application uses `@shopify/shopify-app-react-router`, Prisma-backed offline Shopify session storage, `AppDistribution.AppStore`, and expiring offline tokens. It does not use the generic scaffold’s unrelated authentication model. The embedded document will carry the Shopify API key rendered by the server and fail loudly when required production configuration is incomplete.

## Storefront Rendering

Storefront widgets are delivered through a Theme App Extension app embed; no theme-code installation workflow is permitted. Shopify requires an appropriate unauthenticated Storefront API capability or channel status before it will issue a storefront access token. The existing 403 token-creation result is therefore a configuration blocker for real storefront verification, not a reason to create a simulated storefront connection.[2]

## Persistence and Deployment Configuration

The ConvertPop PostgreSQL migration creates only new enums, tables, indexes, and foreign keys; it contains no destructive statements. It has not been applied to the managed template database because that database is not the configured production PostgreSQL datastore for this Shopify application. The legacy application configuration has an unrelated identity, scopes, and URLs and will be replaced with final ConvertPop values only after the Shopify app credentials and permanent HTTPS domain are supplied.

## References

[1] [Shopify: App Home iframe apps](https://shopify.dev/docs/api/app-home)

[2] [Shopify: Theme app extension configuration](https://shopify.dev/docs/apps/build/online-store/theme-app-extensions/configuration)
