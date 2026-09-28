import "server-only";

import { hashPassword } from "better-auth/crypto";
import { auth } from "@/lib/auth";
import {
  canonicalCategories,
  canonicalProducts,
  canonicalGallery,
  canonicalSku,
  unsplashImage,
} from "@/lib/demo-catalog";
import { demoIdentities, getDemoPassword } from "@/lib/demo";
import { prisma } from "@/lib/prisma";

export async function ensureDemoIdentities() {
  const password = getDemoPassword();
  const passwordHash = await hashPassword(password);

  for (const identity of Object.values(demoIdentities)) {
    let user = await prisma.user.findUnique({ where: { email: identity.email } });
    if (!user) {
      await auth.api.signUpEmail({
        body: { name: identity.name, email: identity.email, password },
      });
      user = await prisma.user.findUniqueOrThrow({ where: { email: identity.email } });
    }

    if (user.name !== identity.name || user.role !== identity.role) {
      await prisma.user.update({
        where: { id: user.id },
        data: { name: identity.name, role: identity.role },
      });
    }
    await prisma.account.updateMany({
      where: { userId: user.id, providerId: "credential" },
      data: { password: passwordHash },
    });
  }
}

export async function restoreCanonicalDemo() {
  await ensureDemoIdentities();

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('chauk-catalog-mutations'))`;
    await tx.productView.deleteMany();
    await tx.cartItem.deleteMany();
    await tx.stockAdjustment.deleteMany();
    await tx.inventoryReservationItem.deleteMany();
    await tx.inventoryReservation.deleteMany();
    await tx.orderTimelineEvent.deleteMany();
    await tx.payment.deleteMany();
    await tx.orderItem.deleteMany();
    await tx.order.deleteMany();
    await tx.orderNumberSequence.deleteMany();
    await tx.product.deleteMany();
    await tx.category.deleteMany();

    const categoryIds = new Map<string, string>();
    for (const [position, [name, slug, description, image]] of canonicalCategories.entries()) {
      const category = await tx.category.create({
        data: { name, slug, description, imageUrl: unsplashImage(image), position },
        select: { id: true },
      });
      categoryIds.set(name, category.id);
    }

    const productIds = new Map<string, string>();
    const administrator = await tx.user.findUniqueOrThrow({
      where: { email: demoIdentities.nirmal.email },
      select: { id: true },
    });
    for (const [name, slug, category, maker, origin, price, stock, featured, description, image] of canonicalProducts) {
      const product = await tx.product.create({
        data: {
          name,
          slug,
          sku: canonicalSku(slug),
          maker,
          origin,
          price,
          stock,
          featured,
          description,
          imageUrl: unsplashImage(image),
          archivedAt: null,
          lowStockThreshold: 5,
          categoryId: categoryIds.get(category)!,
          images: {
            create: canonicalGallery(slug, image).map((galleryImage, position) => ({
              url: unsplashImage(galleryImage),
              position,
            })),
          },
          ...(stock > 0 ? { stockAdjustments: { create: { administratorId: administrator.id, actorLabel: demoIdentities.nirmal.name, delta: stock, reason: "Canonical opening stock", resultingStock: stock } } } : {}),
        },
        select: { id: true },
      });
      productIds.set(slug, product.id);
    }

    const suraj = await tx.user.findUniqueOrThrow({
      where: { email: demoIdentities.suraj.email },
      select: { id: true },
    });
    await tx.cartItem.createMany({
      data: [
        { userId: suraj.id, productId: productIds.get("kathmandu-carry-all")!, quantity: 1 },
        { userId: suraj.id, productId: productIds.get("trail-flask")!, quantity: 2 },
      ],
    });
    await tx.productView.createMany({
      data: ["kathmandu-carry-all", "thimi-clay-lamp", "annapurna-daypack"].map(
        (slug) => ({ userId: suraj.id, productId: productIds.get(slug)! }),
      ),
    });
  }, { maxWait: 10_000, timeout: 120_000 });
}
