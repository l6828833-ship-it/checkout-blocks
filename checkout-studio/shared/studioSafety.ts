export type ConnectionState = "not_connected" | "checking" | "ready" | "error" | "denied";

export type PublishReview = {
  canPublish: boolean;
  reasons: string[];
  changeSummary: string[];
};

export function buildPublishReview(input: {
  connectionState: ConnectionState;
  checkoutBrandingAvailable: boolean;
  qualityWarnings: number;
  activeModules: number;
  styleName: string;
}): PublishReview {
  const reasons: string[] = [];
  if (input.connectionState !== "ready") {
    reasons.push("Connect and authorize a Shopify store before a live checkout action is available.");
  }
  if (!input.checkoutBrandingAvailable) {
    reasons.push("Shopify has not confirmed an eligible checkout branding configuration for this store.");
  }
  if (input.qualityWarnings > 0) {
    reasons.push("Resolve the quality checks marked for review before publishing.");
  }
  return {
    canPublish: reasons.length === 0,
    reasons,
    changeSummary: [
      `Style: ${input.styleName}`,
      "Checkout branding: colors, typography, form controls, and button tokens",
      `${input.activeModules} content block${input.activeModules === 1 ? "" : "s"} configured`,
    ],
  };
}

export function describeConnectionState(state: ConnectionState) {
  const states: Record<ConnectionState, { title: string; message: string; tone: "neutral" | "warn" | "good" }> = {
    not_connected: { title: "Shopify not connected", message: "Design and save drafts now. Live store checks remain unavailable until a merchant installation is authorized.", tone: "warn" },
    checking: { title: "Checking store capabilities", message: "Checkout Studio is retrieving the store plan, checkout profile, and supported targets.", tone: "neutral" },
    ready: { title: "Store capabilities ready", message: "Only Shopify-supported controls appear publishable. A fresh validation still runs at release time.", tone: "good" },
    error: { title: "Capability check could not finish", message: "The live checkout configuration has not changed. Review the connection and try again.", tone: "warn" },
    denied: { title: "Permission is not granted", message: "The live checkout configuration has not changed. An authorized merchant must grant the required app access.", tone: "warn" },
  };
  return states[state];
}
