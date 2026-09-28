import "server-only";

import { prisma } from "@/lib/prisma";

export async function addCartItem(userId: string, productId: string, quantity: number) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { stock: true },
  });
  if (!product) return "Product not found.";
  if (quantity > product.stock) return "Not enough stock available.";

  const updated = await prisma.$queryRaw<{ quantity: number }[]>`
    INSERT INTO "cart_item" ("id", "userId", "productId", "quantity", "createdAt", "updatedAt")
    VALUES (${crypto.randomUUID()}, ${userId}, ${productId}, ${quantity}, NOW(), NOW())
    ON CONFLICT ("userId", "productId") DO UPDATE
    SET "quantity" = "cart_item"."quantity" + EXCLUDED."quantity", "updatedAt" = NOW()
    WHERE "cart_item"."quantity" + EXCLUDED."quantity" <= ${product.stock}
      AND "cart_item"."quantity" + EXCLUDED."quantity" <= 99
    RETURNING "quantity"
  `;
  return updated.length
    ? "Added to cart."
    : "Not enough stock available, or the cart limit is 99.";
}

export async function updateCartItem(userId: string, itemId: string, quantity: number) {
  const updated = await prisma.$queryRaw<{ id: string }[]>`
    UPDATE "cart_item" AS cart
    SET "quantity" = ${quantity}, "updatedAt" = NOW()
    FROM "product"
    WHERE cart."id" = ${itemId}
      AND cart."userId" = ${userId}
      AND product."id" = cart."productId"
      AND ${quantity} <= product."stock"
    RETURNING cart."id"
  `;
  return updated.length
    ? "Quantity updated."
    : "Item not found in your cart, or there is not enough stock.";
}

export async function removeCartItemForUser(userId: string, itemId: string) {
  const removed = await prisma.cartItem.deleteMany({ where: { id: itemId, userId } });
  return removed.count ? "Item removed." : "Item not found in your cart.";
}
