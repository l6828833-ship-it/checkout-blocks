# Deploy Checkout Studio to Fly.io

This project is ready for deployment as a Node.js application on Fly.io. Fly routes public HTTPS traffic to the Express server, which serves the React workspace and its backend from the same app. The `/healthz` endpoint is intentionally public and returns a `200` response for Fly’s service health check.

> **Do not use the former Manus URL in the Shopify App URL after you deploy.** Shopify must point to the final HTTPS Fly.io hostname (or your custom domain) for Checkout Studio to open inside Shopify Admin.

## Before you begin

You need a Fly.io account, the Fly CLI (`flyctl`), and a Supabase PostgreSQL project. Use the **Shared Pooler (session mode)** connection string from Supabase's **Connect** panel, because it works from IPv4 Fly Machines. Checkout Studio uses PostgreSQL for merchant workspace records and encrypted Shopify installation credentials.

| Requirement | Why it is needed |
|---|---|
| Fly.io app name | Becomes the default `https://<app-name>.fly.dev` hostname. |
| Supabase PostgreSQL `DATABASE_URL` | Stores merchant drafts, capabilities, and encrypted Shopify token records. |
| `JWT_SECRET` | Derives the server-side encryption key for stored Shopify credentials. Keep it stable after production launch. |
| Shopify client ID and secret | Validates App Bridge ID tokens and exchanges them server-side for Shopify API access tokens. |

## Deploy

From the root `checkout-studio` folder in Visual Studio Code Terminal, run the following commands. Replace `YOUR_FLY_APP_NAME` with a unique lower-case Fly app name.

```bash
cp fly.toml.example fly.toml
```

Open `fly.toml` and replace only this value:

```toml
app = "YOUR_FLY_APP_NAME"
```

Then sign in and create the Fly app without deploying yet:

```bash
fly auth login
fly apps create YOUR_FLY_APP_NAME
```

Set the production secrets. Replace each placeholder with the real value; do not put the values in `fly.toml` or commit them to Git.

```bash
fly secrets set \
  DATABASE_URL='YOUR_SUPABASE_POSTGRESQL_CONNECTION_STRING' \
  JWT_SECRET='YOUR_LONG_RANDOM_SECRET' \
  SHOPIFY_API_KEY='YOUR_SHOPIFY_CLIENT_ID' \
  SHOPIFY_API_SECRET='YOUR_SHOPIFY_CLIENT_SECRET'
```

Deploy the project:

```bash
fly deploy
```

After deployment, confirm that this URL responds with JSON showing `status: "ok"`:

```text
https://YOUR_FLY_APP_NAME.fly.dev/healthz
```

## Connect Supabase before updating Shopify

In Supabase, create a project and open **Connect**. Copy the **Shared Pooler — Session mode** URI, replace its password placeholder with your database password, then set that full URI as Fly's `DATABASE_URL` secret. After the secret is set, run `fly deploy` so the PostgreSQL migration release command creates Checkout Studio's tables.

## Update the Shopify app only after Fly is healthy

In **Shopify Dev Dashboard → Melanina → checkout styles → Versions → Create version**, use these final values. Replace `YOUR_FLY_APP_NAME` with your actual Fly app name.

| Shopify field | Value |
|---|---|
| App URL | `https://YOUR_FLY_APP_NAME.fly.dev` |
| Embed app in Shopify admin | Enabled |
| Allowed redirect URL | `https://YOUR_FLY_APP_NAME.fly.dev/api/shopify/auth/callback` |
| Required scopes | `read_checkout_and_accounts_configurations,write_checkout_and_accounts_configurations` |

Release that version. Shopify will then load Checkout Studio from the **Apps** section in Shopify Admin, rather than asking you to visit the Fly.io URL yourself.

## Relink the native Assurance extension

After the `checkout styles` version is released, open the `checkout-studio-assurance-extension` project in Visual Studio Code and run:

```bash
shopify app config link
```

Choose **Melanina**, then choose **connect to an existing app**, and select **checkout styles**. Run `shopify app dev --reset` after the link completes. This moves the verified Thank you page test block away from the temporary `checkout-studio-assurance` app and into the final Checkout Studio app.

## Operational boundaries

Checkout Studio’s full merchant editor is embedded in Shopify Admin. The Assurance component is a separate native Checkout UI extension that appears only at Shopify-supported Checkout and Accounts editor targets. The regular development-store proof target is **Thank you**; checkout information, shipping, and payment-stage targets remain subject to Shopify Plus availability. Checkout Studio does not replace Shopify Payments, alter payment methods, inject checkout scripts, or edit `checkout.liquid`.

## References

[1]: https://fly.io/docs/js/the-basics/dockerfiles/ "Fly.io: Dockerfiles for JavaScript applications"
[2]: https://fly.io/docs/reference/configuration/ "Fly.io: App configuration"
[3]: https://fly.io/docs/reference/health-checks/ "Fly.io: Health checks"
