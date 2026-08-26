// @vitest-environment happy-dom
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("free-shipping runtime", () => {
  afterEach(() => { vi.unstubAllGlobals(); document.body.innerHTML = ""; localStorage.clear(); });

  it("refreshes the remaining free-shipping message after a Shopify cart mutation", async () => {
    let subtotal = 2500;
    const network = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/apps/convertpop/config")) return new Response(JSON.stringify({ campaigns: [{ id: "bar-1", kind: "ANNOUNCEMENT_BAR", targeting: {}, schedule: {}, content: { freeShippingThreshold: 100 } }] }), { status: 200 });
      if (url.includes("/cart.js")) return new Response(JSON.stringify({ total_price: subtotal }), { status: 200 });
      if (url.includes("/cart/add.js")) { subtotal = 6000; return new Response("{}", { status: 200 }); }
      return new Response("{}", { status: 200 });
    });
    vi.stubGlobal("fetch", network); window.fetch = network as typeof window.fetch;
    (window as typeof window & { ConvertPop: { configUrl: string; eventUrl: string; currency: string } }).ConvertPop = { configUrl: "/apps/convertpop/config", eventUrl: "/apps/convertpop/events", currency: "USD" };
    const source = await readFile(join(process.cwd(), "extensions/convertpop-theme/assets/convertpop-runtime.js"), "utf8");
    (0, eval)(source);
    await flush(); await flush();
    expect(document.body.textContent).toContain("$75.00 more for free shipping");
    await window.fetch("/cart/add.js", { method: "POST" });
    await flush(); await flush();
    expect(document.body.textContent).toContain("$40.00 more for free shipping");
  });
});
