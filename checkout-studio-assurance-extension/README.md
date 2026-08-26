# Checkout Studio Assurance

This folder is the **customer-facing Shopify Checkout UI extension**, not the existing Manus dashboard. Open this folder in **Visual Studio Code** after downloading and unzipping it.

## What it does

The extension renders a small, Shopify-native assurance panel at a merchant-selectable Checkout block location. It deliberately does **not** process payments, change payment methods, or use unsupported checkout HTML/CSS overrides.

## Before you start

Install Node.js LTS, Visual Studio Code, and Shopify CLI. In the Shopify Dev Dashboard, your app must use the current configuration scopes:

```text
read_checkout_and_accounts_configurations,write_checkout_and_accounts_configurations
```

## Open the project

1. Download the ZIP file and unzip it anywhere on your computer, such as Desktop.
2. Open **Visual Studio Code**.
3. Select **File → Open Folder**.
4. Select the unzipped `checkout-studio-assurance-extension` folder.
5. Open the integrated terminal in Visual Studio Code and run the commands below.

```bash
npm install
shopify auth login
shopify app config link
shopify app dev
```

The current verified local project is linked to **checkout-studio-assurance** in the Melanina organization. This was a successful development test. The final product app has now been selected as **checkout styles**. Do not relink while the embedded dashboard connection is still being completed.

### Final production relink: checkout styles

When the unified Checkout Studio app handoff is ready, relink this extension on the Mac so the merchant workspace and native extension belong to one app:

1. Make a copy of the current `shopify.app.toml` file as a backup.
2. In the Visual Studio Code terminal, run `shopify app config link`.
3. Choose the **Melanina** organization.
4. Choose **No, connect it to an existing app**.
5. Select **checkout styles**.
6. Run `shopify app dev --reset` and approve the App URL update.

After that relink, the app’s **Manage app** action opens the full Checkout Studio workspace in Shopify Admin, and the same app owns Checkout Studio Assurance. Do not run `shopify app deploy` until the live dashboard connection has been verified.

### Updating an already-linked local project

If you already ran `shopify app config link` successfully, preserve your existing `shopify.app.toml` file because it now contains your linked Shopify application ID. From this starter package, copy only these corrected files into the existing local project:

```text
package.json
extensions/checkout-studio-assurance/shopify.extension.toml
extensions/checkout-studio-assurance/src/Checkout.tsx
extensions/checkout-studio-assurance/src/ThankYou.tsx
```

Then run `npm install` and `shopify app dev` again. Do not replace your linked `shopify.app.toml` with the starter placeholder.

### Fixing the “Example Domain” page

The **Manage app** button opened `https://example.com` because the linked copy on the Mac still uses Shopify's starter placeholder URL. In Visual Studio Code, open the root file named `shopify.app.toml`. Keep the existing `client_id`, but replace only the URL lines so they match the following values:

```toml
application_url = "https://checkoutapp-slsdybjx.manus.space"

[auth]
redirect_urls = ["https://checkoutapp-slsdybjx.manus.space/api/shopify/auth/callback"]
```

Save the file. Stop the running development command with `Ctrl + C`, then run `shopify app dev --reset`. The CLI will ask to update the app URLs; approve that update. The full secure callback is being implemented in the Checkout Studio dashboard, so do not test the Connect Shopify button until that work is complete.

## Deploy the extension

After you have tested it on an eligible development or Shopify Plus store:

```bash
shopify app deploy
```

Release the generated app version in Shopify Dev Dashboard. Then activate the checkout block in Shopify Admin:

1. Go to **Settings → Checkout → Customize**.
2. Select a Checkout configuration.
3. Choose **Add app block**.
4. Select **Checkout Studio Assurance**.
5. Move it to an allowed block location and click **Save**.

### Testing on a non-Plus development store

The `purchase.checkout.block.render` target is for the Shopify Plus checkout stage. This starter also includes a `purchase.thank-you.block.render` target, so you can prove the real extension works on a regular development store.

1. Run `shopify app dev`.
2. In Checkout and Accounts editor, choose **Thank you** from the page dropdown at the top.
3. Select **Add app block** and choose **Checkout Studio Assurance**.
4. Save the configuration, then complete a test checkout to see the confirmation panel.

### Edit the assurance message directly in Shopify

Once the block is selected in the Checkout editor, use the **App block settings** panel on the right. You can edit the section title, message heading, message body, support note, and Shopify-approved message style. Click **Save** to publish those fields for this checkout configuration.

The embedded Checkout Studio dashboard remains the workspace for the full theme library, device previews, saved drafts, scheduling, and future verified checkout-configuration controls. Shopify's native block editor controls only the approved fields exposed by this app block; it cannot replace payment methods or freely redesign Shopify's protected checkout UI.

## Important boundary

This extension is native checkout UI. It is not a storefront theme app embed and not a payment gateway. Styling must be applied separately through the Checkout and Accounts Configuration API after the merchant’s Shopify session and store capability have been verified.

## Files to edit

| File | Purpose |
|---|---|
| `extensions/checkout-studio-assurance/src/Checkout.tsx` | The assurance panel customers see during checkout |
| `extensions/checkout-studio-assurance/src/ThankYou.tsx` | The confirmation panel customers see on Thank you pages |
| `extensions/checkout-studio-assurance/shopify.extension.toml` | Checkout target and extension identity |
| `shopify.app.toml` | Local Shopify CLI app configuration; link it to the merchant’s app before deployment |

## References

- [Shopify Checkout UI extensions](https://shopify.dev/docs/api/checkout-ui-extensions/latest)
- [Shopify CLI](https://shopify.dev/docs/api/shopify-cli)
