import "@shopify/ui-extensions/preact";
import { createElement, render } from "preact";

type AssuranceSettings = Record<string, string | undefined>;

declare const shopify: {
  settings: { value: AssuranceSettings };
};

/**
 * Non-Plus development fallback. This target lets the merchant validate the
 * live extension after successful checkout completion. The pre-payment block
 * remains reserved for Shopify Plus checkout configurations.
 */
export default function extension() {
  render(createElement(CheckoutStudioThankYou, null), document.body);
}

function CheckoutStudioThankYou() {
  const settings = shopify.settings.value;
  const sectionTitle = settings.section_title ?? "Checkout Studio";
  const bannerHeading = settings.banner_heading ?? "Thank you for your order";
  const bannerBody =
    settings.banner_body ??
    "This merchant uses Checkout Studio to keep checkout information clear, consistent, and reassuring.";
  const supportNote =
    settings.support_note ??
    "Your confirmation details are ready below. Contact the merchant if you need order support.";
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
