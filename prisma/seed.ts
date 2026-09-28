import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import {
  canonicalCategories,
  canonicalProducts,
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
});

async function main() {
  const categoryIds = new Map<string, string>();

  for (const [position, [name, slug, description, image]] of canonicalCategories.entries()) {
    const category = { name, slug, description, imageUrl: unsplashImage(image) };
    const saved = await prisma.category.upsert({
      where: { slug: category.slug },
      create: { ...category, position },
      update: { ...category, position },
      select: { id: true },
    });
    categoryIds.set(category.name, saved.id);
  }

  for (const [name, slug, category, maker, origin, price, stock, featured, description, image] of canonicalProducts) {
    const data = {
      name,
      slug,
      maker,
      origin,
      price,
      stock,
      featured,
      description,
      imageUrl: unsplashImage(image),
      categoryId: categoryIds.get(category)!,
    };
    await prisma.product.upsert({ where: { slug }, create: data, update: data });
  }

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
    const seededProducts = await prisma.product.findMany({
      where: { slug: { in: ["kathmandu-carry-all", "trail-flask", "thimi-clay-lamp", "annapurna-daypack"] } },
      select: { id: true, slug: true },
    });
    const productId = new Map(seededProducts.map((product) => [product.slug, product.id]));
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
