import { createElement, useEffect, useState } from "react";

declare global {
  interface Window {
    shopify?: {
      idToken?: () => Promise<string>;
      toast?: { show: (message: string, options?: { isError?: boolean }) => void };
    };
  }
}

/**
 * Configures native Shopify Admin chrome when the app is opened in an embedded
 * Shopify context. Outside Shopify, the custom elements remain inert and the
 * Checkout Studio workspace continues to work as a regular web application.
 */
export function ShopifyNativeChrome() {
  const [isEmbeddedInShopify, setIsEmbeddedInShopify] = useState(false);
  const [activeArea, setActiveArea] = useState("Overview");

  useEffect(() => {
    const syncPageTitle = () => {
      const area = new URLSearchParams(window.location.search).get("area") ?? "Overview";
      setActiveArea(area);
      document.title = area === "Overview" ? "Checkout Studio" : `${area} · Checkout Studio`;
    };
    syncPageTitle();
    const isEmbedded = window.self !== window.top && new URLSearchParams(window.location.search).has("host");
    setIsEmbeddedInShopify(isEmbedded);
    document.documentElement.dataset.shopifyEmbedded = isEmbedded ? "true" : "false";
    window.addEventListener("popstate", syncPageTitle);

    return () => {
      window.removeEventListener("popstate", syncPageTitle);
      delete document.documentElement.dataset.shopifyEmbedded;
    };
  }, []);

  if (!isEmbeddedInShopify) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute h-0 w-0 overflow-hidden">
      {/** App Bridge's s-page element renders the title bar outside the iframe. */}
      {/** React.createElement keeps TypeScript independent of App Bridge element typings. */}
      {createElement(
        "s-page" as never,
        { heading: activeArea },
        createElement("s-badge" as never, { slot: "accessory", tone: "info" }, "Checkout branding")
      )}
      {createElement(
        "s-app-nav" as never,
        null,
        createElement("s-link" as never, { href: "/", rel: "home" }, "Overview"),
        createElement("s-link" as never, { href: "/?area=Theme%20Atelier" }, "Themes"),
        createElement("s-link" as never, { href: "/?area=Brand%20Signature" }, "Brand"),
        createElement("s-link" as never, { href: "/?area=Content%20Blocks" }, "Blocks"),
        createElement("s-link" as never, { href: "/?area=Preview%20%26%20Test" }, "Preview"),
        createElement("s-link" as never, { href: "/?area=Campaign%20Scheduler" }, "Campaigns"),
        createElement("s-link" as never, { href: "/?area=Settings" }, "Settings")
      )}
    </div>
  );
}
