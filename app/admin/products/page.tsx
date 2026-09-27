import { prisma } from "@/lib/prisma";
import requireAdmin from "@/lib/require-admin";
import { ProductForm } from "./product-form";

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
        category: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <main className="space-y-8 p-6">
      <h1 className="font-bold text-2xl">Products</h1>

      {categories.length === 0 && (
        <p>Create a category before adding products.</p>
      )}

      <ProductForm categories={categories} />

      <section className="space-y-3">
        <h2 className="font-semibold text-xl">Saved products</h2>

        {products.length === 0 ? (
          <p>No products yet.</p>
        ) : (
          <ul className="space-y-2">
            {products.map((product) => (
              <li key={product.id} className="p-3 border">
                <strong>{product.name}</strong>
                <p>Price: {product.price.toString()}</p>
                <p>Stock: {product.stock}</p>
                <p className="capitalize">Category: {product.category.name}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
