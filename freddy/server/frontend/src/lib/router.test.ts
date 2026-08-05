import { describe, expect, it } from "vitest";
import { parseRoute, routePath } from "./router";

describe("frontend router", () => {
  it("parses collection and detail routes below /frontend", () => {
    expect(parseRoute("/frontend/")).toEqual({ name: "dashboard" });
    expect(parseRoute("/frontend/transactions")).toEqual({ name: "transactions" });
    expect(parseRoute("/frontend/transactions/abc-123")).toEqual({
      name: "transaction-detail",
      id: "abc-123",
    });
  });

  it("builds application links", () => {
    expect(routePath("dashboard")).toBe("/frontend/");
    expect(routePath("driver-detail", "driver-7")).toBe("/frontend/drivers/driver-7");
  });
});
