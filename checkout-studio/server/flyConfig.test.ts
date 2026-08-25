import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Fly.io production configuration", () => {
  it("runs the PostgreSQL migration before serving the Checkout Studio app", () => {
    const config = fs.readFileSync(path.resolve(process.cwd(), "fly.toml"), "utf8");

    expect(config).toContain('app = "checkout-studio"');
    expect(config).toContain('release_command = "corepack pnpm exec drizzle-kit migrate"');
    expect(config).toContain("internal_port = 3000");
  });
});
