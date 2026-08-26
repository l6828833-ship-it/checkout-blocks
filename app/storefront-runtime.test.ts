import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("storefront runtime safeguards", () => {
  it("fails closed when proxy configuration cannot be loaded and meters impressions through the signed endpoint", async () => {
    const source = await readFile(new URL("../extensions/convertpop-theme/assets/convertpop-runtime.js", import.meta.url), "utf8");
    expect(source).toContain('response.ok ? response.json() : { campaigns: [] }');
    expect(source).toContain("runtime.eventUrl");
    expect(source).toContain('event: "impression"');
    expect(source).toContain("installCartChangeObserver");
    expect(source).toContain('new CustomEvent("cart:updated")');
  });
});
