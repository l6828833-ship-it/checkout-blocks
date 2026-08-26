# Performance Report

The production application build completed successfully on 26 August 2026. Strict TypeScript validation completed successfully, and the automated suite reported **7 passing tests across 5 files**.

| Artifact | Result |
|---|---:|
| Theme App Extension storefront runtime, gzip | 2,998 bytes |
| Storefront runtime budget | Less than 30 KB gzip |
| Server production bundle | 81.60 KB before platform compression |
| Admin route modules | Individually code-split by React Router build |

The storefront runtime is below the stated 30 KB gzip target. The final embedded-admin LCP must still be captured on the real production URL while signed in to Shopify Admin; a local preview without a real Shopify app URL and PostgreSQL service cannot establish that measure.
