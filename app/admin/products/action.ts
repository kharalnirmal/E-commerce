"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import requireAdmin from "@/lib/require-admin";
import { slugify } from "@/lib/storefront";
import { toggleFeaturedProduct } from "@/lib/featured-service";

type State = { message: string };

export async function createProduct(
  _previousState: State,
  formData: FormData,
): Promise<State> {
  await requireAdmin();

  const stringField = (name: string) => {
    const value = formData.get(name);
    return typeof value === "string" ? value.trim() : "";
  };
  const name = stringField("name");
  const description = stringField("description");
  const price = stringField("price");
  const stockText = stringField("stock");
  const imageUrl = stringField("imageUrl");
  const categoryId = stringField("categoryId");

  if (name.length < 2 || name.length > 120) return { message: "Name must be between 2 and 120 characters" };
  if (description.length > 5000) return { message: "Description is too long" };
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(price)) {
    return { message: "Enter a valid non-negative price with up to 2 decimal places." };
  }
  if (!/^\d+$/.test(stockText)) return { message: "Stock must be a non-negative whole number." };
  const stock = Number(stockText);
  if (!Number.isSafeInteger(stock) || stock > 2_147_483_647) return { message: "Stock is too large." };

  if (imageUrl) {
    try {
      const url = new URL(imageUrl);
      if (url.protocol !== "https:" || url.hostname !== "images.unsplash.com" || imageUrl.length > 2048) {
        return { message: "Enter a valid images.unsplash.com URL." };
      }
    } catch {
      return { message: "Enter a valid image URL." };
    }
  }

  const category = await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } });
  if (!category) return { message: "Choose a valid category." };
  const slug = slugify(name) || "product";
  if (await prisma.product.findUnique({ where: { slug }, select: { id: true } })) {
    return { message: "A product with this name already exists." };
  }

  await prisma.product.create({
    data: {
      name,
      slug,
      maker: "Independent maker",
      origin: "Nepal",
      description: description || null,
      price,
      stock,
      imageUrl: imageUrl || null,
      category: { connect: { id: category.id } },
    },
  });
  revalidatePath("/admin/products");
  return { message: "Product created." };
}

export async function toggleFeatured(productId: string) {
  await requireAdmin();
  if (typeof productId !== "string" || !productId) return "Choose a valid product.";

  const result = await toggleFeaturedProduct(productId);

  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/admin/products");
  return result;
}
