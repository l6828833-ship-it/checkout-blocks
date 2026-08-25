# Shopify Capability Evidence

## Checked August 25, 2026

Shopify documents that the Checkout and Accounts Configuration API, including `checkoutAndAccountsConfigurationUpdate`, is available only to Shopify Plus merchants. A connected non-Plus development store therefore cannot use this API for checkout styling even when the app requests the matching read and write scopes.

Checkout UI extension targets on the information, shipping, and payment steps are also Shopify Plus-only. Thank you and Order status pages can be customized through Checkout UI extensions and remain the supported extension surface to validate in this development-store workflow.

## Sources

1. https://shopify.dev/docs/apps/build/checkout/styling/checkout-and-accounts-configuration
2. https://shopify.dev/docs/api/checkout-ui-extensions/latest
3. https://shopify.dev/docs/apps/build/checkout/thank-you-order-status
