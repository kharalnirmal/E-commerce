import requireAdmin from "@/lib/require-admin";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const user = await requireAdmin();
  const [products, categories, featured, soldOut, lowStock] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.product.count({ where: { featured: true } }),
    prisma.product.count({ where: { stock: 0 } }),
    prisma.product.count({ where: { stock: { gt: 0, lte: 5 } } }),
  ]);

  const summaries = [
    ["Products", products],
    ["Categories", categories],
    ["Featured", `${featured} / 6`],
    ["Low stock", lowStock],
    ["Sold out", soldOut],
  ];

  return (
    <main className="shell py-12 sm:py-20">
      <p className="utility-label text-[var(--vermilion)]">Administrator · {user.name}</p>
      <h1 className="mt-2 text-6xl font-bold tracking-[-0.07em] sm:text-8xl">MARKET / DESK</h1>
      <p className="editorial mt-5 max-w-2xl text-2xl">A quick reading of what is on the shelves and in this week&apos;s story.</p>

      <dl className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {summaries.map(([label, value]) => (
          <div key={label} className="brutal-card p-5">
            <dt className="utility-label">{label}</dt>
            <dd className="mt-3 text-4xl font-bold">{value}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-12">
        <h2 className="text-3xl font-bold tracking-[-0.04em]">Quick actions</h2>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/admin/products" className="button-primary">Manage products</Link>
          <Link href="/admin/categories" className="button-secondary">Manage categories</Link>
          <Link href="/#weekly-edit" className="button-secondary">View weekly edit</Link>
        </div>
      </section>
    </main>
  );
}
