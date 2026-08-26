# ConvertPop App Store Review Package

## Listing copy

**App name:** ConvertPop — campaigns & COD confirmation

**One-line pitch:** Create announcement bars, targeted popups, cart-aware offers, and SMS-verified COD confirmation from Shopify Admin.

ConvertPop helps merchants convert storefront attention into attributable outcomes. Merchants can publish announcement bars, popups, embedded banners, and Cash on Delivery confirmation forms without editing theme code. The Theme App Extension app embed keeps storefront integration native to Online Store 2.0 themes.

| Benefit | Evidence in product |
|---|---|
| Reduce fake COD orders | The COD workflow requests an SMS OTP through a merchant-configured Twilio Verify service and creates a Shopify draft order only after approval. |
| Keep offers relevant | Campaign targeting supports page path, device, visitor state, timing, and schedule configuration. |
| Show meaningful shipping progress | The storefront runtime retrieves the current Shopify cart subtotal and calculates the remaining free-shipping value. |
| Measure campaign impact | Impressions are submitted to a Shopify-signed app-proxy endpoint and stored with shop and campaign attribution. |

## Categories and pricing

The primary category is **Marketing and conversion**. The secondary category is **Orders and shipping**, reflecting COD confirmation and Shopify draft-order creation.

| Plan | Price | Included impressions | Entitlement |
|---|---:|---:|---|
| Free | $0 | 1,500/month | One active campaign per campaign type |
| Plus | $9.99/month | 10,000/month | Multi-message and unlimited active campaigns |
| Pro | $17.99/month | 50,000/month | Advanced targeting and COD confirmation |
| Max | $31.99/month | 150,000/month | Scheduling, advanced analytics, and merchant-reviewed recovery messaging |

Paid plans receive a seven-day trial through Shopify subscription billing. The app stops serving new campaigns at the server-confirmed impression cap and prompts a merchant to upgrade rather than overserving or degrading a storefront page.

## Requested data access

| Scope | Use |
|---|---|
| Read shop details | Identify the installed shop and evaluate its subscription context. |
| Read products | Resolve cart and product context for storefront campaigns. |
| Read and write discounts | Show existing Shopify discount codes and create merchant-requested codes for a campaign. |
| Read orders; write draft orders | Create a merchant-visible COD draft order only after SMS verification. |
| Read customer data | Process name, phone, and address strictly for COD confirmation and data subject requests. |
| Unauthenticated product listings | Support Shopify-approved storefront configuration and product context. |

The app does not request product-write or fulfillment access. It does not ingest customer content such as reviews or testimonials.

## Screenshot plan

Capture the following screenshots from an installed real development store after the live validation protocol has passed: Dashboard with a connected state and usage, Campaign Builder with primary/secondary preview layout, COD Forms with OTP provider status, and Analytics with actual impression/outcome data. Do not include fabricated merchant, conversion, or review data in screenshots.
