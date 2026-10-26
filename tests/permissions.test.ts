import { describe, expect, it } from "vitest";
import { assertSameSalon, canAssignRole, canViewRevenue } from "../src/lib/permissions";

describe("tenant helpers", () => {
  it("prevents managers from assigning owner", () => {
    expect(canAssignRole("manager", "owner")).toBe(false);
    expect(canAssignRole("owner", "manager")).toBe(true);
    expect(canAssignRole("barber", "manager")).toBe(false);
  });

  it("hides revenue from barbers", () => {
    expect(canViewRevenue("barber")).toBe(false);
    expect(canViewRevenue("owner")).toBe(true);
  });

  it("detects a record from another salon", () => {
    expect(assertSameSalon([{ salon_id: "a" }, { salon_id: "b" }], "a")).toBe(false);
    expect(assertSameSalon([{ salon_id: "a" }], "a")).toBe(true);
  });
});
