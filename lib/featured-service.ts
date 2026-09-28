import "server-only";

import { prisma } from "@/lib/prisma";
import { canFeatureProduct } from "@/lib/featured";

export async function toggleFeaturedProduct(productId: string) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('chauk-catalog-mutations'))`;
    const product = await tx.product.findUnique({
      where: { id: productId },
      select: { featured: true },
    });
    if (!product) return "Product not found.";

    if (!product.featured) {
      const featuredCount = await tx.product.count({ where: { featured: true } });
      if (!canFeatureProduct(featuredCount, product.featured)) {
        return "The weekly edit already has six products.";
      }
    }

    await tx.product.update({
      where: { id: productId },
      data: { featured: !product.featured },
    });
    return "Weekly edit updated.";
  });
}
