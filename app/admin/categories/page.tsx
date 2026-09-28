import { prisma } from "@/lib/prisma";
import requireAdmin from "@/lib/require-admin";
import CategoryForm from "./category-form";

export default async function CategoriesPage() {
  await requireAdmin();

  const categories = await prisma.category.findMany({
    orderBy: [{ archivedAt: "asc" }, { position: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      imageUrl: true,
      position: true,
      archivedAt: true,
      _count: { select: { products: true } },
    },
  });

  return (
    <main className="shell space-y-10 py-12 sm:py-20">
      <div>
        <p className="utility-label text-[var(--vermilion)]">Administration</p>
        <h1 className="mt-2 text-6xl font-bold tracking-[-0.07em]">CATEGORIES</h1>
      </div>

      <section><h2 className="mb-3 text-2xl font-bold">Add category</h2><CategoryForm /></section>

      <section>
        <h2 className="mb-3 font-semibold text-xl">Saved categories</h2>

        {categories.length === 0 ? (
          <p>No categories yet.</p>
        ) : (
          <ul className="grid gap-5 lg:grid-cols-2">
            {categories.map((category) => (
              <li key={category.id}>
                <div className="mb-2 flex items-center justify-between gap-3"><h3 className="text-xl font-bold">{category.name}</h3><span className="utility-label">{category.archivedAt ? "Archived" : `${category._count.products} products`}</span></div>
                <CategoryForm
                  category={{ ...category, archived: Boolean(category.archivedAt) }}
                  replacements={categories.filter((option) => !option.archivedAt && option.id !== category.id).map(({ id, name }) => ({ id, name }))}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
