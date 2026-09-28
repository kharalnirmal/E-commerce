import { slugify } from "@/lib/storefront";
export { createSkuBase } from "@/lib/sku";

export type CatalogResult<T> = { data: T; error?: never } | { data?: never; error: string };

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export function parseRemoteImages(value: string): CatalogResult<string[]> {
  const images = value.split(/\r?\n/).map((url) => url.trim()).filter(Boolean);
  if (images.length > 12) return { error: "A gallery can contain at most 12 images." };
  for (const image of images) {
    try {
      const url = new URL(image);
      if (!(["http:", "https:"].includes(url.protocol)) || image.length > 2048) {
        return { error: "Every image must be a valid HTTP or HTTPS URL." };
      }
    } catch {
      return { error: "Every image must be a valid HTTP or HTTPS URL." };
    }
  }
  return { data: images };
}

export function parseProductForm(formData: FormData, includeInitialStock = false) {
  const name = field(formData, "name");
  const slug = slugify(field(formData, "slug") || name);
  const maker = field(formData, "maker");
  const origin = field(formData, "origin");
  const description = field(formData, "description");
  const price = field(formData, "price");
  const thresholdText = field(formData, "lowStockThreshold");
  const categoryId = field(formData, "categoryId");
  const gallery = parseRemoteImages(field(formData, "images"));

  if (name.length < 2 || name.length > 120) return { error: "Name must be between 2 and 120 characters." } as const;
  if (!slug || slug.length > 140) return { error: "Enter a valid slug up to 140 characters." } as const;
  if (maker.length < 2 || maker.length > 120) return { error: "Maker must be between 2 and 120 characters." } as const;
  if (origin.length < 2 || origin.length > 120) return { error: "Origin must be between 2 and 120 characters." } as const;
  if (description.length > 5000) return { error: "Description is too long." } as const;
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(price)) return { error: "Enter a valid non-negative price with up to 2 decimal places." } as const;
  if (!/^\d+$/.test(thresholdText)) return { error: "Low-stock threshold must be a non-negative whole number." } as const;
  const lowStockThreshold = Number(thresholdText);
  if (!Number.isSafeInteger(lowStockThreshold) || lowStockThreshold > 2_147_483_647) return { error: "Low-stock threshold is too large." } as const;
  if (!categoryId) return { error: "Choose a valid active category." } as const;
  if (gallery.error) return gallery;

  let initialStock = 0;
  if (includeInitialStock) {
    const stockText = field(formData, "stock");
    if (!/^\d+$/.test(stockText)) return { error: "Initial stock must be a non-negative whole number." } as const;
    initialStock = Number(stockText);
    if (!Number.isSafeInteger(initialStock) || initialStock > 2_147_483_647) return { error: "Initial stock is too large." } as const;
  }

  return { data: { name, slug, maker, origin, description: description || null, price, lowStockThreshold, categoryId, images: gallery.data ?? [], initialStock } } as const;
}

export function parseCategoryForm(formData: FormData) {
  const name = field(formData, "name");
  const slug = slugify(field(formData, "slug") || name);
  const description = field(formData, "description");
  const imageUrl = field(formData, "imageUrl");
  const positionText = field(formData, "position");
  if (name.length < 2 || name.length > 80) return { error: "Name must be between 2 and 80 characters." } as const;
  if (!slug || slug.length > 100) return { error: "Enter a valid slug up to 100 characters." } as const;
  if (description.length > 1000) return { error: "Description is too long." } as const;
  const image = parseRemoteImages(imageUrl);
  if (image.error) return image;
  if (!/^-?\d+$/.test(positionText)) return { error: "Display position must be a whole number." } as const;
  const position = Number(positionText);
  if (!Number.isSafeInteger(position)) return { error: "Display position is too large." } as const;
  return { data: { name, slug, description: description || null, imageUrl: image.data?.[0] ?? null, position } } as const;
}
