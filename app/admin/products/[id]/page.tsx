import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import requireAdmin from "@/lib/require-admin";
import { ProductForm } from "../product-form";
import { ProductArchiveButton, StockAdjustmentForm } from "../product-controls";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      select: {
        id: true, name: true, slug: true, sku: true, maker: true, origin: true, description: true,
        price: true, stock: true, lowStockThreshold: true, categoryId: true, archivedAt: true,
        images: { orderBy: { position: "asc" }, select: { url: true } },
        stockAdjustments: {
          orderBy: { sequence: "desc" }, take: 50,
          select: { id: true, delta: true, reason: true, resultingStock: true, createdAt: true, actorLabel: true },
        },
      },
    }),
    prisma.category.findMany({ where: { archivedAt: null }, orderBy: [{ position: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
  ]);
  if (!product) notFound();

  return (
    <main className="shell space-y-10 py-12 sm:py-20">
      <div><Link href="/admin/products" className="utility-label underline">Back to products</Link><p className="utility-label mt-5 text-[var(--vermilion)]">{product.sku} · {product.archivedAt ? "Archived" : "Active"}</p><h1 className="mt-2 text-5xl font-bold tracking-[-0.06em]">{product.name}</h1><p className="mt-3">Current stock: <strong>{product.stock}</strong></p></div>
      <ProductForm categories={categories} product={{ ...product, price: product.price.toString(), images: product.images.map((image) => image.url) }} />
      <section className="space-y-4"><h2 className="text-3xl font-bold">Inventory ledger</h2><StockAdjustmentForm productId={product.id} />
        {product.stockAdjustments.length ? <div className="overflow-x-auto"><table className="w-full border-collapse text-left"><thead><tr><th className="p-3">When</th><th className="p-3">Administrator</th><th className="p-3">Change</th><th className="p-3">Outcome</th><th className="p-3">Reason</th></tr></thead><tbody>{product.stockAdjustments.map((item) => <tr key={item.id} className="border-t-2 border-[var(--line)]"><td className="p-3">{item.createdAt.toLocaleString()}</td><td className="p-3">{item.actorLabel}</td><td className="p-3 font-mono">{item.delta > 0 ? "+" : ""}{item.delta}</td><td className="p-3">{item.resultingStock}</td><td className="p-3">{item.reason}</td></tr>)}</tbody></table></div> : <p>No stock adjustments recorded yet.</p>}
      </section>
      <section className="brutal-card flex flex-wrap items-center justify-between gap-4 p-5"><div><h2 className="font-bold">Product lifecycle</h2><p className="text-[var(--muted)]">Archived products disappear from storefront discovery and cannot be added to carts.</p></div><ProductArchiveButton productId={product.id} archived={Boolean(product.archivedAt)} /></section>
    </main>
  );
}
