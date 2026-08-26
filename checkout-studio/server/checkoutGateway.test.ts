import { describe, expect, it } from "vitest";
import { UnconnectedShopifyCheckoutGateway } from "./checkoutGateway";

describe("unconnected Shopify checkout gateway", () => {
  it("reports unknown capabilities and blocks a publish without changing checkout", async () => {
    const gateway = new UnconnectedShopifyCheckoutGateway();
    const context = await gateway.getContext();
    const publish = await gateway.publish({ styleId: 1, tokens: {} as never, moduleIds: [] });
    expect(context.state).toBe("not_connected");
    expect(context.capabilities).toHaveLength(3);
    expect(publish).toMatchObject({ status: "blocked" });
    expect(publish.diagnostic).toContain("No live checkout configuration changed");
  });
});
