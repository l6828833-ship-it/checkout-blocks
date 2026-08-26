import type { StyleTokens } from "../shared/checkoutStudio";

export type CheckoutCapability = {
  key: "checkout_branding" | "checkout_ui_extensions" | "checkout_preview";
  availability: "available" | "limited" | "unavailable" | "unknown";
  reason: string;
  fallback: string;
};

export type CheckoutConnectionContext = {
  state: "not_connected" | "connected";
  merchantDomain?: string;
  capabilities: CheckoutCapability[];
};

export type PublishInput = {
  styleId: number;
  tokens: StyleTokens;
  moduleIds: number[];
};

export type PublishResult = {
  status: "published" | "blocked";
  diagnostic: string;
};

/**
 * Safe integration seam for the post-install Shopify Admin adapter. The
 * standalone workspace only uses the unconnected implementation; it never
 * performs a checkout mutation or exposes unverified controls as publishable.
 */
export interface ShopifyCheckoutGateway {
  getContext(): Promise<CheckoutConnectionContext>;
  publish(input: PublishInput): Promise<PublishResult>;
}

export class UnconnectedShopifyCheckoutGateway implements ShopifyCheckoutGateway {
  async getContext(): Promise<CheckoutConnectionContext> {
    return {
      state: "not_connected",
      capabilities: [
        { key: "checkout_branding", availability: "unknown", reason: "No merchant-authorized Shopify installation is available.", fallback: "Explore styles and save a draft." },
        { key: "checkout_ui_extensions", availability: "unknown", reason: "Checkout extension targets have not been read from an authorized store.", fallback: "Configure the content block in the representative preview." },
        { key: "checkout_preview", availability: "unknown", reason: "A live Shopify checkout preview cannot be opened before connection.", fallback: "Use the labeled simulation to inspect checkout states." },
      ],
    };
  }

  async publish(_input: PublishInput): Promise<PublishResult> {
    return {
      status: "blocked",
      diagnostic: "No live checkout configuration changed. Install and authorize the merchant-owned Shopify app before capability validation and publishing can begin.",
    };
  }
}
