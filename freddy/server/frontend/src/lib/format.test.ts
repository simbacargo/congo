import { describe, expect, it } from "vitest";
import { money, numberValue, shortMoney, statusClass, statusLabel } from "./format";

describe("format helpers", () => {
  it("normalizes numeric values and currency output", () => {
    expect(numberValue("12.5")).toBe(12.5);
    expect(numberValue("not-a-number")).toBe(0);
    expect(money(12.5)).toBe("$12.50");
    expect(money(1250, "CDF")).toBe("1,250.00 FC");
  });

  it("shortens large dashboard figures", () => {
    expect(shortMoney(1250)).toBe("$1.3k");
    expect(shortMoney(1_200_000)).toBe("$1.2m");
  });

  it("maps statuses to human labels and CSS classes", () => {
    expect(statusLabel("VERIFIED")).toBe("Verified");
    expect(statusClass("VERIFIED")).toBe("status status-verified");
  });
});
