"use server";

import { revalidatePath } from "next/cache";
import { parseCategoryForm } from "@/lib/catalog";
import { archiveCategory, createCatalogCategory, unarchiveCategory, updateCatalogCategory } from "@/lib/catalog-service";
import requireAdmin from "@/lib/require-admin";

type State = { message: string };

function revalidateCategories() {
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/admin");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
}

function isDuplicate(error: unknown) {
  return error !== null && typeof error === "object" && "code" in error && error.code === "P2002";
}

export async function createCategory(_previousState: State, formData: FormData): Promise<State> {
  await requireAdmin();
  const parsed = parseCategoryForm(formData);
  if (!parsed.data) return { message: parsed.error ?? "Invalid category details." };
  try {
    await createCatalogCategory(parsed.data);
    revalidateCategories();
    return { message: "Category created." };
  } catch (error) {
    if (isDuplicate(error)) return { message: "That category name or slug already exists." };
    throw error;
  }
}

export async function updateCategory(categoryId: string, _previousState: State, formData: FormData): Promise<State> {
  await requireAdmin();
  const parsed = parseCategoryForm(formData);
  if (!parsed.data) return { message: parsed.error ?? "Invalid category details." };
  try {
    await updateCatalogCategory(categoryId, parsed.data);
    revalidateCategories();
    return { message: "Category saved." };
  } catch (error) {
    if (isDuplicate(error)) return { message: "That category name or slug already exists." };
    throw error;
  }
}

export async function setCategoryArchived(categoryId: string, archived: boolean, _previousState: State, formData: FormData): Promise<State> {
  await requireAdmin();
  if (archived) {
    const replacement = formData.get("replacementCategoryId");
    const result = await archiveCategory(categoryId, typeof replacement === "string" ? replacement : "");
    if ("error" in result && result.error) return { message: result.error };
    revalidateCategories();
    return { message: result.count ? `${result.count} products reassigned and category archived.` : "Category archived." };
  }
  await unarchiveCategory(categoryId);
  revalidateCategories();
  return { message: "Category restored." };
}
