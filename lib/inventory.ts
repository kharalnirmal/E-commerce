import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type Database = Prisma.TransactionClient | typeof prisma;

export async function lockInventory(tx: Prisma.TransactionClient) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('chauk-inventory'))`;
}

export async function getReservedQuantities(database: Database = prisma, now = new Date()) {
  const rows = await database.$queryRaw<{ productId: string; quantity: bigint }[]>`
    SELECT item."productId", SUM(item."quantity")::BIGINT AS "quantity"
    FROM "inventory_reservation_item" AS item
    INNER JOIN "inventory_reservation" AS reservation ON reservation."id" = item."reservationId"
    WHERE reservation."releasedAt" IS NULL
      AND reservation."consumedAt" IS NULL
      AND reservation."expiresAt" > ${now}
    GROUP BY item."productId"
  `;
  return new Map(rows.map((row) => [row.productId, Number(row.quantity)]));
}

export async function withAvailableStock<T extends { id: string; stock: number }>(
  products: T[],
  reserved?: Map<string, number>,
) {
  const reservedQuantities = reserved ?? await getReservedQuantities();
  return products.map((product) => ({
    ...product,
    stock: Math.max(0, product.stock - (reservedQuantities.get(product.id) ?? 0)),
  }));
}
