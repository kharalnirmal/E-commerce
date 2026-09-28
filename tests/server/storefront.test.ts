import { describe, expect, it } from "vitest";
import { formatNpr, readCatalogParams, slugify } from "@/lib/storefront";

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
  });

  it("formats prices in Nepalese rupees", () => {
    expect(formatNpr(2450)).toMatch(/NPR|रू/);
    expect(formatNpr(2450)).toContain("2,450");
  });
});
