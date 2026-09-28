import "server-only";

import { createSkuBase } from "@/lib/sku";
import { prisma } from "@/lib/prisma";

export type ProductInput = {
  name: string;
  slug: string;
  maker: string;
  origin: string;
  description: string | null;
  price: string;
  lowStockThreshold: number;
  categoryId: string;
  images: string[];
};

export type CategoryInput = {
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  position: number;
};

async function nextSku(tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0], slug: string) {
  const base = createSkuBase(slug);
  for (let suffix = 0; suffix < 10_000; suffix += 1) {
    const sku = suffix === 0 ? base : `${base}-${suffix + 1}`;
    if (!(await tx.product.findUnique({ where: { sku }, select: { id: true } }))) return sku;
  }
  throw new Error("Unable to allocate a SKU.");
}

export async function createCatalogProduct(input: ProductInput & { initialStock: number }, administratorId: string) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('chauk-catalog-mutations'))`;
    const category = await tx.category.findFirst({ where: { id: input.categoryId, archivedAt: null }, select: { id: true } });
    if (!category) return { error: "Choose a valid active category." } as const;
    const administrator = await tx.user.findUnique({ where: { id: administratorId }, select: { name: true } });
    if (!administrator) return { error: "Administrator not found." } as const;
    const sku = await nextSku(tx, input.slug);
    const product = await tx.product.create({
      data: {
        name: input.name,
        slug: input.slug,
        sku,
        maker: input.maker,
        origin: input.origin,
        description: input.description,
        price: input.price,
        stock: input.initialStock,
        lowStockThreshold: input.lowStockThreshold,
        imageUrl: input.images[0] ?? null,
        categoryId: category.id,
        images: { create: input.images.map((url, position) => ({ url, position })) },
        ...(input.initialStock !== 0
          ? { stockAdjustments: { create: { administratorId, actorLabel: administrator.name, delta: input.initialStock, reason: "Initial stock", resultingStock: input.initialStock } } }
          : {}),
      },
    });
    return { product } as const;
  });
}

export async function updateCatalogProduct(productId: string, input: ProductInput) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('chauk-catalog-mutations'))`;
    const category = await tx.category.findFirst({ where: { id: input.categoryId, archivedAt: null }, select: { id: true } });
    if (!category) return { error: "Choose a valid active category." } as const;
    await tx.productImage.deleteMany({ where: { productId } });
    const product = await tx.product.update({
      where: { id: productId },
      data: {
        name: input.name,
        slug: input.slug,
        maker: input.maker,
        origin: input.origin,
        description: input.description,
        price: input.price,
        lowStockThreshold: input.lowStockThreshold,
        imageUrl: input.images[0] ?? null,
        categoryId: category.id,
        images: { create: input.images.map((url, position) => ({ url, position })) },
      },
    });
    return { product } as const;
  });
}

export async function setProductArchived(productId: string, archived: boolean) {
  await prisma.product.update({
    where: { id: productId },
    data: { archivedAt: archived ? new Date() : null, featured: archived ? false : undefined },
  });
}

export async function adjustProductStock(productId: string, administratorId: string, delta: number, reason: string) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "product" WHERE "id" = ${productId} FOR UPDATE`;
    const product = await tx.product.findUnique({ where: { id: productId }, select: { stock: true } });
    if (!product) return { error: "Product not found." } as const;
    const administrator = await tx.user.findUnique({ where: { id: administratorId }, select: { name: true } });
    if (!administrator) return { error: "Administrator not found." } as const;
    const resultingStock = product.stock + delta;
    if (!Number.isSafeInteger(resultingStock) || resultingStock < 0 || resultingStock > 2_147_483_647) {
      return { error: "That adjustment would create an invalid stock total." } as const;
    }
    await tx.product.update({ where: { id: productId }, data: { stock: resultingStock } });
    const adjustment = await tx.stockAdjustment.create({
      data: { productId, administratorId, actorLabel: administrator.name, delta, reason, resultingStock },
    });
    return { adjustment } as const;
  });
}

export async function createCatalogCategory(input: CategoryInput) {
  return prisma.category.create({ data: input });
}

export async function updateCatalogCategory(categoryId: string, input: CategoryInput) {
  return prisma.category.update({ where: { id: categoryId }, data: input });
}

export async function archiveCategory(categoryId: string, replacementCategoryId: string) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('chauk-catalog-mutations'))`;
    const category = await tx.category.findUnique({ where: { id: categoryId }, select: { archivedAt: true } });
    if (!category) return { error: "Category not found." } as const;
    const productCount = await tx.product.count({ where: { categoryId } });
    if (productCount > 0) {
      if (!replacementCategoryId || replacementCategoryId === categoryId) {
        return { error: "Choose another active category before archiving this populated category." } as const;
      }
      const replacement = await tx.category.findFirst({ where: { id: replacementCategoryId, archivedAt: null }, select: { id: true } });
      if (!replacement) return { error: "Choose a valid active replacement category." } as const;
      await tx.product.updateMany({ where: { categoryId }, data: { categoryId: replacement.id } });
    }
    await tx.category.update({ where: { id: categoryId }, data: { archivedAt: new Date() } });
    return { count: productCount } as const;
  });
}

export async function unarchiveCategory(categoryId: string) {
  await prisma.category.update({ where: { id: categoryId }, data: { archivedAt: null } });
}

export async function countLowStockProducts() {
  const rows = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) AS "count"
    FROM "product"
    WHERE "archivedAt" IS NULL AND "stock" > 0 AND "stock" <= "lowStockThreshold"
  `;
  return Number(rows[0]?.count ?? 0);
}
