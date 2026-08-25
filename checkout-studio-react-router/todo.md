# Checkout Studio React Router Rebuild

- [x] Clone Shopify’s official React Router embedded-app template into an isolated rebuild workspace.
- [x] Configure checkout styles identity, checkout configuration scopes, Fly.io URLs, PostgreSQL session storage, APP_UNINSTALLED, scope-update, and mandatory GDPR webhook declarations.
- [x] Replace the sample product mutation with a read-only, server-authenticated Checkout Studio capability overview.
- [x] Implement data-minimization responses for customer privacy requests and delete the shop’s session data on shop-redaction webhooks.
- [x] Install dependencies and generate the PostgreSQL Prisma client.
- [x] Add a Prisma migration for the Shopify session database in Supabase without applying it automatically.
- [ ] Apply the reviewed Prisma session migration to the configured Supabase database only after finalizing the rebuild deployment transition.
- [ ] Configure the final checkout styles client ID through Shopify CLI without committing secrets.
- [x] Correct the official template Docker build so React Router build dependencies remain available before the production runtime starts.
- [x] Implement initial merchant-scoped visual draft persistence in the official scaffold without any live checkout mutation.
- [x] Preserve the fourteen original Checkout Studio visual presets and their safe design-token metadata in the React Router rebuild.
- [x] Port the full safe preset token model for all fourteen Checkout Studio presets, including semantic colors, border treatment, density, surface treatment, logo treatment, and category metadata.
- [x] Persist and display the full migrated preset metadata in the rebuilt Style Studio preview rather than only a reduced color subset.
- [x] Render the remaining preserved semantic token fields and radius in a concise Style Studio token summary.
- [ ] Extend draft persistence with reviewed style versions, audit records, campaign schedules, and Assurance extension state.
- [ ] Add a separately reviewed Checkout and Accounts Configuration update and rollback pipeline.
- [ ] Validate embedded OAuth, GraphQL capability reads, GDPR webhooks, APP_UNINSTALLED cleanup, and Fly.io deployment.
