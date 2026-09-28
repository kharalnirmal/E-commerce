import "server-only";

import { prisma } from "@/lib/prisma";

export async function addCartItem(userId: string, productId: string, quantity: number) {
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 99) return "Choose a quantity from 1 to 99.";

  const updated = await prisma.$queryRaw<{ quantity: number }[]>`
    INSERT INTO "cart_item" ("id", "userId", "productId", "quantity", "createdAt", "updatedAt")
    SELECT ${crypto.randomUUID()}, ${userId}, product."id", ${quantity}, NOW(), NOW()
    FROM "product" AS product
    INNER JOIN "category" AS category ON category."id" = product."categoryId"
    WHERE product."id" = ${productId}
      AND product."archivedAt" IS NULL
      AND category."archivedAt" IS NULL
      AND ${quantity} <= product."stock" - COALESCE((
        SELECT SUM(item."quantity") FROM "inventory_reservation_item" AS item
        INNER JOIN "inventory_reservation" AS reservation ON reservation."id" = item."reservationId"
        WHERE item."productId" = product."id" AND reservation."releasedAt" IS NULL
          AND reservation."consumedAt" IS NULL AND reservation."expiresAt" > NOW()
      ), 0)
    ON CONFLICT ("userId", "productId") DO UPDATE
    SET "quantity" = "cart_item"."quantity" + EXCLUDED."quantity", "updatedAt" = NOW()
    WHERE "cart_item"."quantity" + EXCLUDED."quantity" <= (
        SELECT product."stock" - COALESCE((
          SELECT SUM(item."quantity") FROM "inventory_reservation_item" AS item
          INNER JOIN "inventory_reservation" AS reservation ON reservation."id" = item."reservationId"
          WHERE item."productId" = product."id" AND reservation."releasedAt" IS NULL
            AND reservation."consumedAt" IS NULL AND reservation."expiresAt" > NOW()
        ), 0) FROM "product" AS product
        INNER JOIN "category" AS category ON category."id" = product."categoryId"
        WHERE product."id" = EXCLUDED."productId" AND product."archivedAt" IS NULL AND category."archivedAt" IS NULL
      )
      AND "cart_item"."quantity" + EXCLUDED."quantity" <= 99
    RETURNING "quantity"
  `;
  return updated.length
    ? "Added to cart."
    : "Not enough stock available, or the cart limit is 99.";
}

export async function updateCartItem(userId: string, itemId: string, quantity: number) {
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 99) return "Choose a quantity from 1 to 99.";
  const updated = await prisma.$queryRaw<{ id: string }[]>`
    UPDATE "cart_item" AS cart
    SET "quantity" = ${quantity}, "updatedAt" = NOW()
    FROM "product"
    INNER JOIN "category" ON category."id" = product."categoryId"
    WHERE cart."id" = ${itemId}
      AND cart."userId" = ${userId}
      AND product."id" = cart."productId"
      AND product."archivedAt" IS NULL
      AND category."archivedAt" IS NULL
      AND ${quantity} <= product."stock" - COALESCE((
        SELECT SUM(item."quantity") FROM "inventory_reservation_item" AS item
        INNER JOIN "inventory_reservation" AS reservation ON reservation."id" = item."reservationId"
        WHERE item."productId" = product."id" AND reservation."releasedAt" IS NULL
          AND reservation."consumedAt" IS NULL AND reservation."expiresAt" > NOW()
      ), 0)
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
