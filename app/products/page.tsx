import type { Prisma } from "@/generated/prisma/client";
import Link from "next/link";
import { ProductCard } from "@/app/components/product-card";
import { prisma } from "@/lib/prisma";
import { catalogSorts, readCatalogParams } from "@/lib/storefront";

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
      ? [{ price: "asc" }]
      : sort === "price-desc"
        ? [{ price: "desc" }]
        : sort === "newest"
          ? [{ createdAt: "desc" }]
          : [{ featured: "desc" }, { createdAt: "desc" }];

  const [products, categories] = await Promise.all([
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

  return (
    <main className="shell py-12 sm:py-20">
      <div className="grid gap-6 border-b-2 border-[var(--line)] pb-10 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="utility-label text-[var(--vermilion)]">The full market</p>
          <h1 className="mt-2 text-6xl font-bold tracking-[-0.07em] sm:text-8xl">SHOP / ALL</h1>
        </div>
        <p className="editorial max-w-md text-xl">Objects for getting dressed, settling in, tuning out, and heading uphill.</p>
      </div>

      <form id="catalog-search" className="my-8 grid gap-3 rounded-2xl border-2 border-[var(--line)] bg-[var(--surface)] p-4 lg:grid-cols-[1fr_14rem_14rem_auto]" method="get">
        <label className="grid gap-2">
          <span className="utility-label">Search the market</span>
          <input name="q" type="search" defaultValue={q} placeholder="Try lamp, Nepal, canvas..." className="min-h-12 rounded-lg border-2 border-[var(--line)] bg-[var(--paper)] px-3" />
        </label>
        <label className="grid gap-2">
          <span className="utility-label">Category</span>
          <select name="category" defaultValue={category} className="min-h-12 rounded-lg border-2 border-[var(--line)] bg-[var(--paper)] px-3">
            <option value="">All categories</option>
            {categories.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
          </select>
        </label>
        <label className="grid gap-2">
          <span className="utility-label">Sort</span>
          <select name="sort" defaultValue={sort} className="min-h-12 rounded-lg border-2 border-[var(--line)] bg-[var(--paper)] px-3">
            {catalogSorts.map((value) => <option key={value} value={value}>{sortLabels[value]}</option>)}
          </select>
        </label>
        <button type="submit" className="button-primary self-end">Apply</button>
      </form>

      <div className="mb-6 flex items-center justify-between">
        <p className="utility-label" aria-live="polite">{products.length} {products.length === 1 ? "object" : "objects"}</p>
        {(q || category) && <Link href="/products" className="utility-label underline">Clear filters</Link>}
      </div>

      {products.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => <ProductCard key={product.slug} product={product} />)}
        </div>
      ) : (
        <div className="brutal-card py-24 text-center">
          <p className="editorial text-3xl">Nothing sits at that crossroads yet.</p>
          <Link href="/products" className="button-primary mt-6">Reset the catalog</Link>
        </div>
      )}
    </main>
  );
}
