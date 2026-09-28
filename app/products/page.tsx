import type { Prisma } from "@/generated/prisma/client";
import Link from "next/link";
import { ProductCard } from "@/app/components/product-card";
import { prisma } from "@/lib/prisma";
import { catalogSorts, readCatalogParams } from "@/lib/storefront";
import { withAvailableStock } from "@/lib/inventory";

const sortLabels = {
  featured: "Featured first",
  newest: "Newest",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
} as const;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; category?: string | string[]; sort?: string | string[] }>;
}) {
  const { q, category, sort } = readCatalogParams(await searchParams);
  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    sort === "price-asc"
      ? [{ price: "asc" }, { name: "asc" }]
      : sort === "price-desc"
        ? [{ price: "desc" }, { name: "asc" }]
        : sort === "newest"
          ? [{ createdAt: "desc" }, { name: "asc" }]
          : [{ featured: "desc" }, { createdAt: "desc" }, { name: "asc" }];

  const [storedProducts, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        archivedAt: null,
        category: { archivedAt: null, ...(category ? { slug: category } : {}) },
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" as const } },
                { description: { contains: q, mode: "insensitive" as const } },
                { maker: { contains: q, mode: "insensitive" as const } },
                { origin: { contains: q, mode: "insensitive" as const } },
                { category: { name: { contains: q, mode: "insensitive" as const } } },
              ],
            }
          : {}),
      },
      orderBy,
      select: {
        name: true,
        id: true,
        slug: true,
        maker: true,
        origin: true,
        price: true,
        stock: true,
        imageUrl: true,
        category: { select: { name: true } },
      },
    }),
    prisma.category.findMany({ where: { archivedAt: null }, orderBy: [{ position: "asc" }, { name: "asc" }], select: { name: true, slug: true } }),
  ]);
  const products = await withAvailableStock(storedProducts);

  return (
    <main className="shell py-12 sm:py-20">
      <div className="catalog-heading">
        <div>
          <h1>Shop all</h1>
          <p>Objects for getting dressed, settling in, tuning out, and heading uphill.</p>
        </div>
      </div>

      <form id="catalog-search" className="catalog-controls" method="get">
        <label className="grid gap-2">
          <span className="field-label">Search the market</span>
          <input name="q" type="search" defaultValue={q} placeholder="Try lamp, Nepal, canvas..." className="field-control" />
        </label>
        <label className="grid gap-2">
          <span className="field-label">Category</span>
          <select name="category" defaultValue={category} className="field-control">
            <option value="">All categories</option>
            {categories.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
          </select>
        </label>
        <label className="grid gap-2">
          <span className="field-label">Sort</span>
          <select name="sort" defaultValue={sort} className="field-control">
            {catalogSorts.map((value) => <option key={value} value={value}>{sortLabels[value]}</option>)}
          </select>
        </label>
        <button type="submit" className="button-primary self-end">Apply</button>
      </form>

      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-[var(--muted)]" aria-live="polite">{products.length} {products.length === 1 ? "object" : "objects"}</p>
        {(q || category) && <Link href="/products" className="text-action">Clear filters</Link>}
      </div>

      {products.length ? (
        <div className="product-grid">
          {products.map((product) => <ProductCard key={product.slug} product={product} />)}
        </div>
      ) : (
        <div className="empty-state">
          <h2>No products match these filters.</h2>
          <p>Try a broader search or return to the full catalog.</p>
          <Link href="/products" className="button-primary mt-6">Reset the catalog</Link>
        </div>
      )}
    </main>
  );
}
