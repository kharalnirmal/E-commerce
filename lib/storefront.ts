export const catalogSorts = ["featured", "newest", "price-asc", "price-desc"] as const;

export type CatalogSort = (typeof catalogSorts)[number];

export function formatNpr(value: { toString(): string } | number | string) {
  return new Intl.NumberFormat("en-NP", {
    style: "currency",
    currency: "NPR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value.toString()));
}

export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .trim()
    .replace(/[^\p{Letter}\p{Number}\p{Mark}]+/gu, "-")
    .replace(/^-|-$/g, "");
}

export function readCatalogParams(params: {
  q?: string | string[];
  category?: string | string[];
  sort?: string | string[];
}) {
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const category =
    typeof params.category === "string" ? params.category.trim() : "";
  const requestedSort = typeof params.sort === "string" ? params.sort : "featured";
  const sort: CatalogSort = catalogSorts.includes(requestedSort as CatalogSort)
    ? (requestedSort as CatalogSort)
    : "featured";

  return { q, category, sort };
}
