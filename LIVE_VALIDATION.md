# Live Shopify Validation Protocol

ConvertPop must not be described as App Store-ready until each item in this protocol is executed against a real Shopify development store and permanent HTTPS deployment. Preserve screenshots, console excerpts, webhook delivery results, and order IDs in the release evidence folder, excluding phone numbers, addresses, OTP values, API secrets, and access tokens.

| Check | Expected evidence |
|---|---|
| Fresh install | Shopify Admin opens the embedded application; `window.shopify.idToken` is available and the Dashboard reports the real shop domain as connected. |
| App embed | The Theme Editor lists **ConvertPop campaigns** in App embeds. Enabling and disabling it visibly changes the preview. |
| Campaign render | An activated campaign appears on the live storefront on desktop and mobile after normal cache propagation. |
| Free shipping | Adding an item to cart changes the remaining free-shipping message without a page reload. |
| Metering | Ten eligible campaign renders generate ten server-attributed impression records, subject to documented deduplication. |
| Billing | Selecting a paid plan opens Shopify’s subscription approval experience; the application reflects trial, active, and cancelled states. |
| COD | A real SMS OTP arrives through the merchant’s Twilio Verify service; only an approved code creates a tagged Shopify draft order visible in Admin. |
| Webhooks | Shopify webhook test tooling shows valid HMAC acceptance for uninstall, privacy, and subscription updates. A corrupted signature is rejected by the Shopify SDK before handler execution. |
| Uninstall | Uninstall pauses campaigns, deletes offline sessions, and the storefront app-proxy configuration endpoint returns no campaigns. |

## Required production smoke checks

Run the invalid-code token endpoint smoke check with the real deployment credentials and a deliberately invalid one-time code, asserting a 400, 401, or 403 response. Confirm startup crashes rather than serving a blank Shopify API key if any required production OAuth variable is absent. The generated storefront runtime currently measures 2,998 bytes gzip, below the 30 KB budget. Capture embedded-admin LCP after production deployment and retain the reports with the release evidence.
