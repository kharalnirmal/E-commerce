import { prisma } from "@/lib/prisma";
import requireAdmin from "@/lib/require-admin";
import { ProductForm } from "./product-form";
import { FeaturedToggle } from "./featured-toggle";
import { formatNpr } from "@/lib/storefront";

export default async function ProductsPage() {
  await requireAdmin();

  const [categories, products] = await Promise.all([
    prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        stock: true,
        featured: true,
        category: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <main className="shell space-y-10 py-12 sm:py-20">
      <div>
        <p className="utility-label text-[var(--vermilion)]">Administration</p>
        <h1 className="mt-2 text-6xl font-bold tracking-[-0.07em]">PRODUCTS</h1>
        <p className="mt-4 text-[var(--muted)]">Curate up to six objects for the weekly edit.</p>
      </div>

      {categories.length === 0 && (
        <p>Create a category before adding products.</p>
      )}

      <ProductForm categories={categories} />

      <section className="space-y-3">
        <h2 className="font-semibold text-xl">Saved products</h2>

        {products.length === 0 ? (
          <p>No products yet.</p>
        ) : (
          <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <li key={product.id} className="brutal-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <strong className="text-xl">{product.name}</strong>
                  {product.featured && <span className="utility-label rounded-full bg-[var(--acid)] px-3 py-2 text-[#171713]">Featured</span>}
                </div>
                <p className="mt-3">Price: {formatNpr(product.price)}</p>
                <p>Stock: {product.stock}</p>
                <p className="capitalize">Category: {product.category.name}</p>
                <FeaturedToggle productId={product.id} featured={product.featured} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
