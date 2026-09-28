import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import {
  canonicalCategories,
  canonicalProducts,
  canonicalGallery,
  canonicalSku,
  unsplashImage,
} from "../lib/demo-catalog";
import { auth } from "../lib/auth";
import { demoIdentities, getDemoPassword, isDemoEnabled } from "../lib/demo";
import { hashPassword } from "better-auth/crypto";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) throw new Error("DATABASE_URL is not configured.");

const schema = new URL(connectionString).searchParams.get("schema") ?? undefined;
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }, { schema }),
  transactionOptions: { maxWait: 10_000, timeout: 120_000 },
});

async function main() {
  const seededProducts = await prisma.$transaction(async (tx) => {
    const categoryIds = new Map<string, string>();
    for (const [position, [name, slug, description, image]] of canonicalCategories.entries()) {
      const category = { name, slug, description, imageUrl: unsplashImage(image), archivedAt: null };
      const saved = await tx.category.upsert({
        where: { slug }, create: { ...category, position }, update: { ...category, position }, select: { id: true },
      });
      categoryIds.set(name, saved.id);
    }

    const products: { id: string; slug: string }[] = [];
    for (const [name, slug, category, maker, origin, price, stock, featured, description, image] of canonicalProducts) {
      const editorial = {
        name, slug, sku: canonicalSku(slug), maker, origin, price, featured, description,
        imageUrl: unsplashImage(image), archivedAt: null, lowStockThreshold: 5, categoryId: categoryIds.get(category)!,
      };
      const saved = await tx.product.upsert({
        where: { slug },
        create: {
          ...editorial,
          stock,
          ...(stock > 0 ? { stockAdjustments: { create: { actorLabel: "System seed", delta: stock, reason: "Canonical opening stock", resultingStock: stock } } } : {}),
        },
        update: editorial,
        select: { id: true, slug: true, stock: true },
      });
      if (saved.stock !== stock) {
        await tx.product.update({
          where: { id: saved.id },
          data: {
            stock,
            stockAdjustments: { create: { actorLabel: "System seed", delta: stock - saved.stock, reason: "Canonical seed reconciliation", resultingStock: stock } },
          },
        });
      }
      await tx.productImage.deleteMany({ where: { productId: saved.id } });
      await tx.productImage.createMany({
        data: canonicalGallery(slug, image).map((galleryImage, position) => ({
          productId: saved.id,
          url: unsplashImage(galleryImage),
          position,
        })),
      });
      products.push({ id: saved.id, slug: saved.slug });
    }
    return products;
  });
  const productId = new Map(seededProducts.map((product) => [product.slug, product.id]));

  if (isDemoEnabled()) {
    const password = getDemoPassword();
    const passwordHash = await hashPassword(password);
    for (const identity of Object.values(demoIdentities)) {
      let user = await prisma.user.findUnique({ where: { email: identity.email } });
      if (!user) {
        await auth.api.signUpEmail({ body: { name: identity.name, email: identity.email, password } });
        user = await prisma.user.findUniqueOrThrow({ where: { email: identity.email } });
      }
      await prisma.user.update({ where: { id: user.id }, data: { name: identity.name, role: identity.role } });
      await prisma.account.updateMany({
        where: { userId: user.id, providerId: "credential" },
        data: { password: passwordHash },
      });
    }

    const suraj = await prisma.user.findUniqueOrThrow({ where: { email: demoIdentities.suraj.email } });
    const aadarsh = await prisma.user.findUniqueOrThrow({ where: { email: demoIdentities.aadarsh.email } });
    await prisma.cartItem.deleteMany({ where: { userId: { in: [suraj.id, aadarsh.id] } } });
    await prisma.productView.deleteMany({ where: { userId: { in: [suraj.id, aadarsh.id] } } });
    await prisma.cartItem.createMany({
      data: [
        { userId: suraj.id, productId: productId.get("kathmandu-carry-all")!, quantity: 1 },
        { userId: suraj.id, productId: productId.get("trail-flask")!, quantity: 2 },
      ],
    });
    await prisma.productView.createMany({
      data: ["kathmandu-carry-all", "thimi-clay-lamp", "annapurna-daypack"].map((slug) => ({
        userId: suraj.id,
        productId: productId.get(slug)!,
      })),
    });
  }
}

main()
  .finally(() => prisma.$disconnect())
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
