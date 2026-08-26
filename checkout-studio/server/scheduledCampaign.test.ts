import { describe, expect, it } from "vitest";
import { UnconnectedShopifyCheckoutGateway } from "./checkoutGateway";

describe("scheduled campaign safety", () => {
  it("does not perform a checkout mutation when the merchant app is not authorized", async () => {
    const result = await new UnconnectedShopifyCheckoutGateway().publish({ styleId: 4, tokens: {} as never, moduleIds: [] });
    expect(result.status).toBe("blocked");
    expect(result.diagnostic).toContain("No live checkout configuration changed");
  });
});
