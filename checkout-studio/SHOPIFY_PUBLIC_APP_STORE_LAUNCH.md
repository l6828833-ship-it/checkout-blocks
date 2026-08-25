# Checkout Studio: Public Shopify App Store Launch Readiness

Checkout Studio is intended to be a **public embedded Shopify app**. Merchants should install it from Shopify, open it through the Shopify Admin **Apps** menu, and receive a separate, encrypted server-side authorization record. The customer-facing Assurance component remains a Shopify Checkout UI extension owned by the same app.

> The Shopify API key (client ID) may be delivered to App Bridge in the browser. The Shopify API secret must remain only in Fly.io secrets and must never be committed, displayed in Checkout Studio, or supplied to merchants.

## Credential boundary

| Setting | Storage location | Public-app purpose |
|---|---|---|
| `SHOPIFY_API_KEY` | Fly.io secret and runtime App Bridge meta tag | Identifies Checkout Studio to Shopify and validates the ID-token audience. |
| `SHOPIFY_API_SECRET` | Fly.io secret only | Verifies Shopify ID-token signatures and performs server-side token exchange. |
| `JWT_SECRET` | Fly.io secret only | Derives the encryption key for stored Shopify installation credentials. |
| `DATABASE_URL` | Fly.io secret only | Stores merchant workspace data and encrypted installation records. |

## Current launch status

The application is embedded in Shopify Admin, has a verified Fly.io HTTPS deployment, uses App Bridge ID-token request handling, and stores Shopify credentials only through an encrypted server-side path. The active `checkout styles` Dev Dashboard version has the Fly.io App URL, matching callback URL, embedded mode, and the configuration scopes needed for Checkout and Accounts Configuration work.

The app is **not ready for App Store submission yet**. It must first receive production Fly.io secrets and database access, complete live configuration-capability reads and safe apply/rollback behavior, support merchant-specific install/reinstall/uninstall handling, publish the Assurance extension under `checkout styles`, and complete the listing, privacy, support, billing (if paid), and review materials described below.

## Shopify App Store requirements relevant to Checkout Studio

Shopify requires embedded public apps to use session tokens rather than relying on third-party cookies or local storage, use Shopify checkout rather than bypassing checkout or payment processing, provide a reliable merchant UI, use current App Bridge, and use the GraphQL Admin API for new public apps.[1] Embedded installation must initiate Shopify authentication immediately, including on reinstall.[1]

Checkout Studio must request only the scopes actually needed for its live functions. It must continue to state eligibility limitations accurately: standard development stores can use the Thank you page extension target, while information, shipping, payment, and live checkout styling capabilities are limited by Shopify plan and API eligibility. The app must not claim a simulation is live, inject checkout scripts, modify `checkout.liquid`, replace Shopify Payments, or fabricate reviews or merchant outcomes.

If Checkout Studio charges merchants, App Store distribution requires Shopify App Pricing or Shopify Billing API rather than off-platform billing.[1] The listing must use accurate claims and provide a privacy policy, support path, review instructions, and an app demonstration suitable for Shopify’s review process.[1] [2]

## Production checklist

- [ ] Add `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `JWT_SECRET`, and `DATABASE_URL` as Fly.io secrets, then run `fly deploy`.
- [ ] Verify a live embedded session can establish a merchant installation record without exposing access tokens to the browser.
- [ ] Implement current configuration reads, eligibility diagnostics, and capability-gated GraphQL Admin API writes with audit and rollback records.
- [ ] Add uninstall and privacy/data-handling lifecycle support appropriate to all data the public app stores.
- [ ] Relink and deploy Checkout Studio Assurance under the final `checkout styles` app identity; retain Thank you page as the non-Plus proof target.
- [ ] Create a factual App Store listing, support contact, privacy policy, and review screencast using the final public app behavior.
- [ ] Implement Shopify billing only if the public app is paid.

## References

[1]: https://shopify.dev/docs/apps/launch/shopify-app-store/app-store-requirements "Shopify: App Store requirements"
[2]: https://shopify.dev/docs/apps/launch/shopify-app-store/best-practices "Shopify: Best practices for apps in the Shopify App Store"
[3]: https://shopify.dev/docs/apps/build/authentication-authorization/implement-token-exchange "Shopify: Authenticate an embedded app without a template"
