"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import requireUser from "@/lib/require-user";

type State = { message: string };

export async function addToCart(
  _previousState: State,
  formData: FormData,
): Promise<State> {
  const userId = await requireUser();

  const productIdValue = formData.get("productId");
  const quantityValue = formData.get("quantity");

  const productId = typeof productIdValue === "string" ? productIdValue : "";
  const quantityText =
    typeof quantityValue === "string" ? quantityValue.trim() : "";

  if (!productId || !/^\d+$/.test(quantityText)) {
    return { message: "Choose a valid product and quantity." };
  }

  const quantity = Number(quantityText);

  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 99) {
    return { message: "Quantity must be between 1 and 99." };
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, stock: true },
  });

  if (!product) {
    return { message: "Product not found." };
  }

  if (quantity > product.stock) {
    return { message: "Not enough stock available." };
  }

  const updated = await prisma.$queryRaw<{ quantity: number }[]>`
    INSERT INTO "cart_item" ("id", "userId", "productId", "quantity", "createdAt", "updatedAt")
    VALUES (${crypto.randomUUID()}, ${userId}, ${productId}, ${quantity}, NOW(), NOW())
    ON CONFLICT ("userId", "productId") DO UPDATE
    SET "quantity" = "cart_item"."quantity" + EXCLUDED."quantity", "updatedAt" = NOW()
    WHERE "cart_item"."quantity" + EXCLUDED."quantity" <= ${product.stock}
      AND "cart_item"."quantity" + EXCLUDED."quantity" <= 99
    RETURNING "quantity"
  `;

  if (updated.length === 0) {
    return { message: "Not enough stock available, or the cart limit is 99." };
  }

  revalidatePath("/cart");
  return { message: "Added to cart." };
}

export async function updateCartQuantity(formData: FormData) {
  const userId = await requireUser();

  const itemId = formData.get("itemId");
  const quantityValue = formData.get("quantity");

  if (
    typeof itemId !== "string" ||
    typeof quantityValue !== "string" ||
    !/^\d+$/.test(quantityValue)
  ) {
    return;
  }

  const quantity = Number(quantityValue);

  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 99) {
    return;
  }

  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, userId },
    select: {
      id: true,
      product: { select: { stock: true } },
    },
  });

  if (!item || quantity > item.product.stock) {
    return;
  }

  await prisma.cartItem.updateMany({
    where: { id: item.id, userId },
    data: { quantity },
  });

  revalidatePath("/cart");
}

export async function removeCartItem(formData: FormData) {
  const userId = await requireUser();
  const itemId = formData.get("itemId");

  if (typeof itemId !== "string") {
    return;
  }

  await prisma.cartItem.deleteMany({
    where: { id: itemId, userId },
  });

  revalidatePath("/cart");
}
