export const catalogSorts = ["featured", "newest", "price-asc", "price-desc"] as const;

export type CatalogSort = (typeof catalogSorts)[number];

export type OpeningEntry = "home" | "seen" | "other";

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

export function readSearchQuery(value: string | string[] | null | undefined) {
  return typeof value === "string" ? value.trim().slice(0, 100) : "";
}

export function getOpeningState(stored: string | null, initialPath: string) {
  if (stored === "seen" || stored === "other") {
    return { show: false, stored } as const;
  }

  if (stored === "home") return { show: true, stored: "seen" } as const;

  return initialPath === "/"
    ? ({ show: true, stored: "seen" } as const)
    : ({ show: false, stored: "other" } as const);
}
