import { beforeEach, describe, expect, it } from "vitest";

const databaseTest = describe.skipIf(!process.env.TEST_DATABASE_URL);

databaseTest.sequential("database mutation boundaries", () => {
  beforeEach(async () => {
    const { restoreCanonicalDemo } = await import("@/lib/demo-server");
    await restoreCanonicalDemo();
  });

  it("serializes competing attempts to fill the sixth featured slot", async () => {
    const [{ prisma }, { toggleFeaturedProduct }] = await Promise.all([
      import("@/lib/prisma"),
      import("@/lib/featured-service"),
    ]);
    const products = await prisma.product.findMany({
      orderBy: { slug: "asc" },
      select: { id: true },
      take: 7,
    });
    await prisma.product.updateMany({ data: { featured: false } });
    await prisma.product.updateMany({
      where: { id: { in: products.slice(0, 5).map((product) => product.id) } },
      data: { featured: true },
    });

    const results = await Promise.all([
      toggleFeaturedProduct(products[5].id),
      toggleFeaturedProduct(products[6].id),
    ]);

    expect(results.sort()).toEqual([
      "The weekly edit already has six products.",
      "Weekly edit updated.",
    ]);
    expect(await prisma.product.count({ where: { featured: true } })).toBe(6);
  });

  it("accumulates concurrent additions and rejects cross-owner mutations", async () => {
    const [{ prisma }, cart, { demoIdentities }] = await Promise.all([
      import("@/lib/prisma"),
      import("@/lib/cart-service"),
      import("@/lib/demo"),
    ]);
    const [suraj, aadarsh, product] = await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { email: demoIdentities.suraj.email } }),
      prisma.user.findUniqueOrThrow({ where: { email: demoIdentities.aadarsh.email } }),
      prisma.product.findUniqueOrThrow({ where: { slug: "kathmandu-carry-all" } }),
    ]);
    await prisma.cartItem.deleteMany({ where: { userId: suraj.id, productId: product.id } });

    await Promise.all([
      cart.addCartItem(suraj.id, product.id, 1),
      cart.addCartItem(suraj.id, product.id, 1),
    ]);
    const item = await prisma.cartItem.findUniqueOrThrow({
      where: { userId_productId: { userId: suraj.id, productId: product.id } },
    });
    expect(item.quantity).toBe(2);
    await expect(cart.updateCartItem(aadarsh.id, item.id, 3)).resolves.toContain("not found");
    await expect(cart.removeCartItemForUser(aadarsh.id, item.id)).resolves.toContain("not found");
    expect((await prisma.cartItem.findUniqueOrThrow({ where: { id: item.id } })).quantity).toBe(2);
  });

  it("restores catalog data without deleting ordinary authentication data", async () => {
    const [{ prisma }, { restoreCanonicalDemo }] = await Promise.all([
      import("@/lib/prisma"),
      import("@/lib/demo-server"),
    ]);
    const userId = `reset-visitor-${crypto.randomUUID()}`;
    const accountId = `reset-account-${crypto.randomUUID()}`;
    const sessionId = `reset-session-${crypto.randomUUID()}`;
    await prisma.user.create({
      data: {
        id: userId,
        name: "Reset Boundary Visitor",
        email: `${userId}@example.test`,
        accounts: { create: { id: accountId, accountId: userId, providerId: "credential", password: "test" } },
        sessions: { create: { id: sessionId, token: crypto.randomUUID(), expiresAt: new Date(Date.now() + 60_000) } },
      },
    });
    await prisma.product.update({
      where: { slug: "kathmandu-carry-all" },
      data: { name: "Demo mutation", stock: 1 },
    });

    try {
      await restoreCanonicalDemo();
      await expect(prisma.user.findUnique({ where: { id: userId } })).resolves.not.toBeNull();
      await expect(prisma.account.findUnique({ where: { id: accountId } })).resolves.not.toBeNull();
      await expect(prisma.session.findUnique({ where: { id: sessionId } })).resolves.not.toBeNull();
      await expect(prisma.product.findUnique({ where: { slug: "kathmandu-carry-all" } })).resolves.toMatchObject({
        name: "Kathmandu Carry-All",
        stock: 12,
      });
    } finally {
      await prisma.user.delete({ where: { id: userId } });
    }
  });

  it("synchronizes an existing demo identity to the configured credential", async () => {
    const [{ prisma }, { ensureDemoIdentities }, { demoIdentities, getDemoPassword }, { verifyPassword }] = await Promise.all([
      import("@/lib/prisma"),
      import("@/lib/demo-server"),
      import("@/lib/demo"),
      import("better-auth/crypto"),
    ]);
    const user = await prisma.user.findUniqueOrThrow({ where: { email: demoIdentities.suraj.email } });
    await prisma.account.updateMany({
      where: { userId: user.id, providerId: "credential" },
      data: { password: "stale-password-hash" },
    });

    await ensureDemoIdentities();

    const account = await prisma.account.findFirstOrThrow({
      where: { userId: user.id, providerId: "credential" },
      select: { password: true },
    });
    expect(account.password).toBeTruthy();
    await expect(verifyPassword({ hash: account.password!, password: getDemoPassword() })).resolves.toBe(true);
  });
});
