"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/storefront";
import requireAdmin from "@/lib/require-admin";

type State = { message: string };

export async function createCategory(
  _previousState: State,
  formData: FormData,
): Promise<State> {
  await requireAdmin();

  const value = formData.get("name");
  const name = typeof value === "string" ? value.trim().toLowerCase() : "";

  if (name.length < 2 || name.length > 80) {
    return { message: "Name must be between 2 and 80 characters." };
  }

  try {
    const slug = slugify(name);

    if (!slug) {
      return { message: "Name must include letters or numbers." };
    }

    const duplicateSlug = await prisma.category.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (duplicateSlug) {
      return { message: "A category with this name already exists." };
    }

    await prisma.category.create({ data: { name, slug } });
  } catch (error) {
    if (
      error !== null &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return { message: "That category already exists." };
    }

    throw error;
  }

  revalidatePath("/admin/categories");
  revalidatePath("/");
  return { message: "Category created." };
}
