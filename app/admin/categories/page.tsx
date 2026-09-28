import { prisma } from "@/lib/prisma";
import requireAdmin from "@/lib/require-admin";
import CategoryForm from "./category-form";

export default async function CategoriesPage() {
  await requireAdmin();

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
    },
  });

  return (
    <main className="shell space-y-10 py-12 sm:py-20">
      <div>
        <p className="utility-label text-[var(--vermilion)]">Administration</p>
        <h1 className="mt-2 text-6xl font-bold tracking-[-0.07em]">CATEGORIES</h1>
      </div>

      <CategoryForm />

      <section>
        <h2 className="mb-3 font-semibold text-xl">Saved categories</h2>

        {categories.length === 0 ? (
          <p>No categories yet.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {categories.map((category) => (
              <li key={category.id} className="brutal-card p-5 text-xl font-bold">{category.name}</li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
