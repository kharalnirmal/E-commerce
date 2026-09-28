import { describe, expect, it } from "vitest";
import {
  formatNpr,
  getOpeningState,
  readCatalogParams,
  readSearchQuery,
  slugify,
} from "@/lib/storefront";

describe("storefront boundaries", () => {
  it("creates stable readable slugs", () => {
    expect(slugify("  Kathmandu Carry-All  ")).toBe("kathmandu-carry-all");
    expect(slugify("नेपाली सामान")).toBe("नेपाली-सामान");
  });

  it("normalizes catalog URL state", () => {
    expect(
      readCatalogParams({ q: "  lamp ", category: "home", sort: "price-asc" }),
    ).toEqual({ q: "lamp", category: "home", sort: "price-asc" });
    expect(readCatalogParams({ sort: "invalid" }).sort).toBe("featured");
    expect(readCatalogParams({ q: ["lamp"], category: ["home"] })).toEqual({
      q: "",
      category: "",
      sort: "featured",
    });
  });

  it("normalizes bounded global search queries", () => {
    expect(readSearchQuery("  clay lamp  ")).toBe("clay lamp");
    expect(readSearchQuery(["lamp"])).toBe("");
    expect(readSearchQuery("x".repeat(120))).toHaveLength(100);
  });

  it("shows the opening only for the first direct homepage entry", () => {
    expect(getOpeningState(null, "/")).toEqual({ show: true, stored: "seen" });
    expect(getOpeningState("home", "/")).toEqual({ show: true, stored: "seen" });
    expect(getOpeningState(null, "/products")).toEqual({ show: false, stored: "other" });
    expect(getOpeningState("seen", "/")).toEqual({ show: false, stored: "seen" });
    expect(getOpeningState("other", "/")).toEqual({ show: false, stored: "other" });
  });

  it("formats prices in Nepalese rupees", () => {
    expect(formatNpr(2450)).toMatch(/NPR|रू/);
    expect(formatNpr(2450)).toContain("2,450");
  });
});
