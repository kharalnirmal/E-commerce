import { describe, expect, it } from "vitest";
import { createSkuBase, parseCategoryForm, parseProductForm, parseRemoteImages } from "@/lib/catalog";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("catalog administration boundaries", () => {
  it("accepts ordered HTTP and HTTPS galleries and rejects other protocols", () => {
    expect(parseRemoteImages("https://example.com/front.jpg\nhttp://example.com/back.jpg")).toEqual({
      data: ["https://example.com/front.jpg", "http://example.com/back.jpg"],
    });
    expect(parseRemoteImages("file:///private/photo.jpg")).toEqual({
      error: "Every image must be a valid HTTP or HTTPS URL.",
    });
  });

  it("parses every editable product field while keeping gallery order", () => {
    const result = parseProductForm(form({
      name: "Field Bag", maker: "Himali", origin: "Nepal", description: "Daily carry",
      price: "1250.50", stock: "8", lowStockThreshold: "3", categoryId: "category-1",
      images: "https://example.com/one.jpg\nhttps://example.com/two.jpg",
    }), true);
    expect(result).toMatchObject({ data: { slug: "field-bag", initialStock: 8, lowStockThreshold: 3 } });
    expect(result.data?.images).toEqual(["https://example.com/one.jpg", "https://example.com/two.jpg"]);
  });

  it("validates complete category editorial data", () => {
    expect(parseCategoryForm(form({
      name: "Living", slug: "living", description: "For home", imageUrl: "https://example.com/home.jpg", position: "2",
    }))).toMatchObject({ data: { name: "Living", slug: "living", position: 2 } });
  });

  it("builds a stable readable SKU base", () => {
    expect(createSkuBase("kathmandu-carry-all")).toBe("CHK-KATHMANDUCARRYAL");
  });
});
