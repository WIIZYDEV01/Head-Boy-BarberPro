import { describe, expect, it } from "vitest";
import { depositAmountKobo, requiredChargeKobo, toMinorUnits } from "../src/lib/money";

describe("money", () => {
  it("converts major units without floating-point payment math at rest", () => {
    expect(toMinorUnits(15.5)).toBe(1550);
  });

  it("calculates deposits from integer kobo", () => {
    expect(depositAmountKobo(10000, 20)).toBe(2000);
  });

  it("requires no charge for pay-at-salon", () => {
    expect(requiredChargeKobo({ priceKobo: 5000, policy: "at_salon", depositPercent: 20 })).toBe(0);
  });

  it("requires the full price for full payment policy", () => {
    expect(requiredChargeKobo({ priceKobo: 5000, policy: "full", depositPercent: 20 })).toBe(5000);
  });
});
