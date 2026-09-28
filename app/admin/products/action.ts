"use server";

import { prisma } from "@/lib/prisma";
import requireAdmin from "@/lib/require-admin";
import { revalidatePath } from "next/cache";
import { slugify } from "@/lib/storefront";

type State = { message: string };
export async function createProduct(
  _previousState: State,
  formData: FormData,
): Promise<State> {
  //validating admin
  await requireAdmin();

  //retreving the form data

  const nameValue = formData.get("name");
  const descriptionValue = formData.get("description");
  const priceValue = formData.get("price");
  const stockValue = formData.get("stock");
  const imageUrlValue = formData.get("imageUrl");
  const categoryIdValue = formData.get("categoryId");

  //type narrowing
  const name = typeof nameValue === "string" ? nameValue.trim() : "";
  const description =
    typeof descriptionValue === "string" ? descriptionValue.trim() : "";
  const price = typeof priceValue === "string" ? priceValue.trim() : "";
  const stockText = typeof stockValue === "string" ? stockValue.trim() : "";
  const imageUrl =
    typeof imageUrlValue === "string" ? imageUrlValue.trim() : "";
  const categoryId = typeof categoryIdValue === "string" ? categoryIdValue : "";

  //validating fields
  if (name.length < 2 || name.length > 120) {
    return { message: "Name must be between 2 and 120 characters" };
  }
  if (description.length > 5000) {
    return { message: "Description is too long" };
  }

  // Decimal(12, 2): at most 10 digits before the decimal and 2 after it.
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(price)) {
    return {
      message: "Enter a valid non-negative price with up to 2 decimal places.",
    };
  }
  if (!/^\d+$/.test(stockText)) {
    return { message: "Stock must be a non-negative whole number." };
  }

  const stock = Number(stockText);

  if (!Number.isSafeInteger(stock) || stock > 2_147_483_647) {
    return { message: "Stock is too large." };
  }

  if (imageUrl) {
    try {
      const url = new URL(imageUrl);

      if (
        url.protocol !== "https:" ||
        url.hostname !== "images.unsplash.com" ||
        imageUrl.length > 2048
      ) {
        return { message: "Enter a valid images.unsplash.com URL." };
      }
    } catch {
      return { message: "Enter a valid image URL." };
    }
  }

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });
  if (!category) {
    return { message: "Choose a valid category." };
  }

  const slug = slugify(name) || "product";
  const duplicateSlug = await prisma.product.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (duplicateSlug) {
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
      category: {
        connect: { id: category.id },
      },
    },
  });
  revalidatePath("/admin/products");

  return { message: "Product created." };
}
