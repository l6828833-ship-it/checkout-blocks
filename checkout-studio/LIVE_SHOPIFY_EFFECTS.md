# Checkout Studio: Real Shopify Effects

Checkout Studio can become a real Shopify app that changes approved Shopify surfaces, but each desired effect must use Shopify’s own supported mechanism. The embedded Admin workspace is the merchant control plane; it is not itself the checkout or storefront runtime.

| Merchant goal | Supported Shopify mechanism | Where the real effect appears | Merchant activation |
|---|---|---|---|
| Apply checkout colors, typography, buttons, form controls, logo treatment, and section styling | Checkout and Accounts Configuration API | Shopify checkout, customer accounts, and sign-in | Shopify Plus eligibility plus a verified Admin API session and approved checkout-branding scopes |
| Add a notice, assurance panel, shipping message, survey, or utility in a checkout location | Checkout UI extension | A supported checkout or Thank You page target | Generate and deploy a Checkout UI extension through Shopify CLI; merchant places block targets in the checkout and accounts editor when applicable |
| Add a floating storefront element, visual helper, or site-wide script | Theme app embed | Online storefront theme only; not checkout | Merchant enables the embed in Theme editor → Theme settings → App embeds, optionally from an app-generated deep link |
| Add repositionable inline content to a product or theme section | Theme app block | Compatible Online Store 2.0 theme sections | Merchant adds and orders the block in the theme editor |

## Scope Boundary

Theme app embeds cannot alter Shopify checkout. Checkout UI extensions cannot arbitrarily rewrite checkout markup or ignore available extension targets. Checkout Studio must therefore present only verified configuration fields and extension placements as publishable.

## Recommended Checkout Studio Rollout

1. Make the existing **Apply style** button call the Checkout and Accounts Configuration API after merchant authorization and Plus capability verification.
2. Build a Checkout UI extension named **Checkout Studio Assurance** for one initial checkout block target, then let the merchant place it in Shopify’s checkout editor.
3. Build an optional storefront Theme app embed named **Checkout Studio Continuity** for pre-checkout brand cues only, then deep-link the merchant to activate it in the theme editor.
4. Keep all unavailable targets disabled with a precise explanation, rather than simulating a live effect.

## References

- [Shopify: Checkout UI extensions](https://shopify.dev/docs/api/checkout-ui-extensions/latest)
- [Shopify: Checkout and Accounts Configuration API](https://shopify.dev/docs/apps/build/checkout/styling/checkout-and-accounts-configuration)
- [Shopify: Configure theme app extensions](https://shopify.dev/docs/apps/build/online-store/theme-app-extensions/configuration)
