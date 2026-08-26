# Checkout Studio Embedded Shopify Connection Plan

Checkout Studio currently renders successfully inside Shopify Admin, but its connection state is intentionally simulated. The existing **Connect Shopify** control must be replaced with a production embedded-app session flow before the app can query a merchant’s checkout configuration or propose live changes.

## Required Connection Flow

| Layer | Required behavior |
|---|---|
| Shopify Dev Dashboard | Register the published app URL, enable embedded Admin use, declare minimum checkout-branding scopes, and release the version. |
| Browser inside Shopify Admin | Load Shopify App Bridge and obtain a fresh Shopify ID token for the active embedded merchant session. |
| Checkout Studio server | Verify the ID token, exchange it for an Admin API access token, and securely associate it with the verified shop domain. |
| Capability service | Query approved scopes and current checkout configuration, then return available, limited, or unavailable capabilities. |
| Live workflow | Enable review, Shopify preview, apply, rollback, or campaign activation only after the capability service succeeds for the active merchant. |

## Minimum Scope Direction

Checkout Studio does not need the default product or metaobject write scopes for checkout branding. The intended checkout-only scope set is:

```text
read_checkout_branding_settings,write_checkout_branding_settings
```

Shopify’s current documentation states that checkout styling is available only to Shopify Plus merchants. The former `checkoutBrandingUpsert` mutation is deprecated in favor of the Checkout and Accounts Configuration API; the implementation should use the newer API once the merchant session is established.

## Safety Requirements

The app must never treat being visually embedded as proof of authorization. It must retain the current **Not connected** state when any of the following is absent: a verified Shopify ID token, a configured server-side client secret, an installed merchant session, approved checkout-branding scopes, or an eligible Shopify checkout configuration. The existing simulated preview remains available in all of those states.

## Configuration Still Needed

The merchant must provide the Shopify app’s **Client ID** and **Client secret** after creating the app version in the Shopify Dev Dashboard. The app’s public URL must be the published Checkout Studio URL, and a dedicated Shopify authentication endpoint must be registered as an allowed redirect URL. The Manus OAuth callback and prior connector URL are not valid replacements for this Shopify endpoint.

## References

- [Shopify: Authenticate an embedded app without a template](https://shopify.dev/docs/apps/build/authentication-authorization/implement-token-exchange)
- [Shopify: Manage access scopes](https://shopify.dev/docs/apps/build/authentication-authorization/manage-access-scopes)
- [Shopify: Checkout styling](https://shopify.dev/docs/apps/build/checkout/styling)
- [Shopify: Checkout and Accounts Configuration API](https://shopify.dev/docs/apps/build/checkout/styling/checkout-and-accounts-configuration)
