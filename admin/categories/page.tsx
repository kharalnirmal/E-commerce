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
    <main className="space-y-8 mx-auto p-6 max-w-2xl text-white">
      <h1 className="font-bold text-2xl">Categories</h1>

      <CategoryForm />

      <section>
        <h2 className="mb-3 font-semibold text-xl">Saved categories</h2>

        {categories.length === 0 ? (
          <p>No categories yet.</p>
        ) : (
          <ul className="list-disc list-inside">
            {categories.map((category) => (
              <li key={category.id}>{category.name}</li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
