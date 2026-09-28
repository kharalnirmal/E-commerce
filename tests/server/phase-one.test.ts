import { describe, expect, it } from "vitest";
import { parseCartQuantity } from "@/lib/cart";
import {
  demoIdentities,
  canResetDemo,
  isDemoEnabled,
  isDemoIdentity,
  isResetConfirmation,
} from "@/lib/demo";
import { canFeatureProduct, FEATURED_PRODUCT_LIMIT } from "@/lib/featured";

describe("phase-one boundaries", () => {
  it("accepts only whole cart quantities from 1 through 99", () => {
    expect(parseCartQuantity("1")).toBe(1);
    expect(parseCartQuantity("99")).toBe(99);
    for (const value of ["", "0", "100", "1.5", "-1", " 2 ", null]) {
      expect(parseCartQuantity(value)).toBeNull();
    }
  });

  it("requires an explicit demo-mode setting", () => {
    expect(isDemoEnabled("true")).toBe(true);
    expect(isDemoEnabled("TRUE")).toBe(false);
    expect(isDemoEnabled(undefined)).toBe(false);
  });

  it("allows only canonical identities and exact reset confirmation", () => {
    expect(isDemoIdentity("suraj")).toBe(true);
    expect(isDemoIdentity("visitor")).toBe(false);
    expect(demoIdentities.nirmal.role).toBe("ADMIN");
    expect(isResetConfirmation("RESET")).toBe(true);
    expect(isResetConfirmation("reset")).toBe(false);
    expect(isResetConfirmation(" RESET ")).toBe(false);
    expect(canResetDemo(demoIdentities.nirmal.email)).toBe(true);
    expect(canResetDemo(demoIdentities.suraj.email)).toBe(false);
  });

  it("caps the weekly edit at six while always allowing removal", () => {
    expect(FEATURED_PRODUCT_LIMIT).toBe(6);
    expect(canFeatureProduct(5, false)).toBe(true);
    expect(canFeatureProduct(6, false)).toBe(false);
    expect(canFeatureProduct(6, true)).toBe(true);
  });
});
