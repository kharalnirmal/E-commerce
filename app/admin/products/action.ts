"use server";

import { revalidatePath } from "next/cache";
import { parseProductForm } from "@/lib/catalog";
import { adjustProductStock, createCatalogProduct, setProductArchived, updateCatalogProduct } from "@/lib/catalog-service";
import { toggleFeaturedProduct } from "@/lib/featured-service";
import requireAdmin from "@/lib/require-admin";

type State = { message: string };

function revalidateCatalog(slug?: string) {
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  if (slug) revalidatePath(`/products/${slug}`);
}

function duplicateMessage(error: unknown) {
  return error !== null && typeof error === "object" && "code" in error && error.code === "P2002";
}

export async function createProduct(_previousState: State, formData: FormData): Promise<State> {
  const administrator = await requireAdmin();
  const parsed = parseProductForm(formData, true);
  if (!parsed.data) return { message: parsed.error ?? "Invalid product details." };
  try {
    const result = await createCatalogProduct(parsed.data, administrator.id);
    if ("error" in result && result.error) return { message: result.error };
    revalidateCatalog(result.product.slug);
    return { message: `Product created with SKU ${result.product.sku}.` };
  } catch (error) {
    if (duplicateMessage(error)) return { message: "That product slug already exists." };
    throw error;
  }
}

export async function updateProduct(productId: string, _previousState: State, formData: FormData): Promise<State> {
  await requireAdmin();
  const parsed = parseProductForm(formData);
  if (!parsed.data) return { message: parsed.error ?? "Invalid product details." };
  try {
    const result = await updateCatalogProduct(productId, parsed.data);
    if ("error" in result && result.error) return { message: result.error };
    revalidateCatalog(result.product.slug);
    return { message: "Product details saved." };
  } catch (error) {
    if (duplicateMessage(error)) return { message: "That product slug already exists." };
    throw error;
  }
}

export async function adjustStock(productId: string, _previousState: State, formData: FormData): Promise<State> {
  const administrator = await requireAdmin();
  const deltaText = formData.get("delta");
  const reasonValue = formData.get("reason");
  const reason = typeof reasonValue === "string" ? reasonValue.trim() : "";
  if (typeof deltaText !== "string" || !/^-?\d+$/.test(deltaText) || deltaText === "0" || deltaText === "-0") {
    return { message: "Adjustment must be a non-zero signed whole number." };
  }
  const delta = Number(deltaText);
  if (!Number.isSafeInteger(delta) || Math.abs(delta) > 2_147_483_647) return { message: "Adjustment is too large." };
  if (reason.length < 3 || reason.length > 240) return { message: "Reason must be between 3 and 240 characters." };
  const result = await adjustProductStock(productId, administrator.id, delta, reason);
  if ("error" in result && result.error) return { message: result.error };
  revalidateCatalog();
  return { message: `Stock adjusted to ${result.adjustment.resultingStock}.` };
}

export async function toggleProductArchived(productId: string, archived: boolean, _previousState: State): Promise<State> {
  void _previousState;
  await requireAdmin();
  try {
    await setProductArchived(productId, archived);
    revalidateCatalog();
    return { message: archived ? "Product archived." : "Product restored." };
  } catch {
    return { message: "Product lifecycle could not be updated." };
  }
}

export async function toggleFeatured(productId: string) {
  await requireAdmin();
  if (typeof productId !== "string" || !productId) return "Choose a valid product.";
  const result = await toggleFeaturedProduct(productId);
  revalidateCatalog();
  return result;
}
