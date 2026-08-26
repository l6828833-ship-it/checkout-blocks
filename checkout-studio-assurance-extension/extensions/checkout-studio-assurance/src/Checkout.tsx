import "@shopify/ui-extensions/preact";
import { createElement, render } from "preact";

type AssuranceSettings = Record<string, string | undefined>;

declare const shopify: {
  settings: { value: AssuranceSettings };
};

/**
 * Checkout Studio Assurance
 *
 * Shopify renders this at an approved Checkout block target chosen by the
 * merchant in the Checkout and Accounts editor. Do not use this extension to
 * process payments, intercept payment methods, or inject arbitrary markup.
 */
export default function extension() {
  render(createElement(CheckoutStudioAssurance, null), document.body);
}

function CheckoutStudioAssurance() {
  const settings = shopify.settings.value;
  const sectionTitle = settings.section_title ?? "Checkout Studio";
  const bannerHeading = settings.banner_heading ?? "A refined, secure checkout";
  const bannerBody =
    settings.banner_body ??
    "Your order is protected by Shopify checkout. Store styling and approved assurances are managed by this merchant.";
  const supportNote =
    settings.support_note ??
    "Secure checkout, transparent order details, and merchant-approved support information.";
  const tone = settings.tone ?? "success";

  return createElement(
    "s-section",
    { heading: sectionTitle },
    createElement(
      "s-banner",
      { tone, heading: bannerHeading },
      bannerBody
    ),
    createElement("s-text", null, supportNote)
  );
}
