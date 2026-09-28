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

  it("keeps SKUs stable, preserves gallery order, and rejects stale cart additions after archival", async () => {
    const [{ prisma }, catalog, cart, { demoIdentities }] = await Promise.all([
      import("@/lib/prisma"),
      import("@/lib/catalog-service"),
      import("@/lib/cart-service"),
      import("@/lib/demo"),
    ]);
    const [administrator, shopper, category] = await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { email: demoIdentities.nirmal.email } }),
      prisma.user.findUniqueOrThrow({ where: { email: demoIdentities.aadarsh.email } }),
      prisma.category.findUniqueOrThrow({ where: { slug: "style" } }),
    ]);
    const created = await catalog.createCatalogProduct({
      name: "Ledger Field Bag", slug: "ledger-field-bag", maker: "Test Workshop", origin: "Patan, Nepal",
      description: "A test product", price: "1200", lowStockThreshold: 2, categoryId: category.id,
      images: ["https://example.test/front.jpg", "http://example.test/back.jpg"], initialStock: 4,
    }, administrator.id);
    if ("error" in created) throw new Error(created.error);
    const sku = created.product.sku;

    await catalog.updateCatalogProduct(created.product.id, {
      name: "Renamed Ledger Bag", slug: "renamed-ledger-bag", maker: "Test Workshop", origin: "Patan, Nepal",
      description: "Updated", price: "1300", lowStockThreshold: 3, categoryId: category.id,
      images: ["https://example.test/side.jpg", "https://example.test/front.jpg"],
    });
    const updated = await prisma.product.findUniqueOrThrow({
      where: { id: created.product.id },
      include: { images: { orderBy: { position: "asc" } } },
    });
    expect(updated.sku).toBe(sku);
    expect(updated.images.map((image) => image.url)).toEqual(["https://example.test/side.jpg", "https://example.test/front.jpg"]);

    expect(await cart.addCartItem(shopper.id, updated.id, 1)).toBe("Added to cart.");
    const staleItem = await prisma.cartItem.findUniqueOrThrow({ where: { userId_productId: { userId: shopper.id, productId: updated.id } } });
    await catalog.setProductArchived(updated.id, true);
    await expect(cart.addCartItem(shopper.id, updated.id, 1)).resolves.toContain("Not enough stock");
    await expect(cart.updateCartItem(shopper.id, staleItem.id, 2)).resolves.toContain("not enough stock");
    expect((await prisma.cartItem.findUniqueOrThrow({ where: { id: staleItem.id } })).quantity).toBe(1);
    await catalog.setProductArchived(updated.id, false);
    await expect(cart.updateCartItem(shopper.id, staleItem.id, 2)).resolves.toBe("Quantity updated.");
  });

  it("serializes signed stock adjustments and records administrator audit outcomes", async () => {
    const [{ prisma }, { adjustProductStock }, { demoIdentities }] = await Promise.all([
      import("@/lib/prisma"),
      import("@/lib/catalog-service"),
      import("@/lib/demo"),
    ]);
    const [administrator, product] = await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { email: demoIdentities.nirmal.email } }),
      prisma.product.findUniqueOrThrow({ where: { slug: "kathmandu-carry-all" } }),
    ]);
    await Promise.all([
      adjustProductStock(product.id, administrator.id, 5, "Received replenishment"),
      adjustProductStock(product.id, administrator.id, -3, "Corrected damaged units"),
    ]);

    expect((await prisma.product.findUniqueOrThrow({ where: { id: product.id } })).stock).toBe(14);
    const history = await prisma.stockAdjustment.findMany({ where: { productId: product.id }, orderBy: { sequence: "asc" } });
    expect(history.slice(-2).map((entry) => entry.delta).sort((a, b) => a - b)).toEqual([-3, 5]);
    expect(history.at(-1)?.resultingStock).toBe(14);
    expect(history.slice(-2).every((entry) => entry.administratorId === administrator.id && entry.reason.length > 0)).toBe(true);
    expect(history.at(-1)!.sequence > history.at(-2)!.sequence).toBe(true);
  });

  it("requires reassignment for populated category archival and reset restores expanded catalog state", async () => {
    const [{ prisma }, catalog, { restoreCanonicalDemo }] = await Promise.all([
      import("@/lib/prisma"),
      import("@/lib/catalog-service"),
      import("@/lib/demo-server"),
    ]);
    const [style, home] = await Promise.all([
      prisma.category.findUniqueOrThrow({ where: { slug: "style" } }),
      prisma.category.findUniqueOrThrow({ where: { slug: "home" } }),
    ]);
    await expect(catalog.archiveCategory(style.id, "")).resolves.toMatchObject({ error: expect.stringContaining("replacement") });
    await expect(catalog.archiveCategory(style.id, home.id)).resolves.toMatchObject({ count: 6 });
    expect(await prisma.product.count({ where: { categoryId: style.id } })).toBe(0);

    const product = await prisma.product.findUniqueOrThrow({ where: { slug: "kathmandu-carry-all" } });
    await prisma.product.update({ where: { id: product.id }, data: { sku: "MUTATED-SKU", lowStockThreshold: 99, archivedAt: new Date() } });
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await restoreCanonicalDemo();

    const restored = await prisma.product.findUniqueOrThrow({ where: { slug: "kathmandu-carry-all" }, include: { images: true, stockAdjustments: true } });
    expect(restored).toMatchObject({ sku: "CHK-KATHMANDUCARRYAL", lowStockThreshold: 5, archivedAt: null, stock: 12 });
    expect(restored.images).toHaveLength(1);
    expect(restored.stockAdjustments).toEqual([expect.objectContaining({ delta: 12, resultingStock: 12, reason: "Canonical opening stock" })]);
    const restoredCategories = await prisma.category.findMany({ orderBy: { position: "asc" } });
    expect(restoredCategories.map((category) => [category.slug, category.position, category.archivedAt])).toEqual([
      ["style", 0, null], ["home", 1, null], ["tech", 2, null], ["outdoors", 3, null],
    ]);
    const activeCategoryOrder = await prisma.category.findMany({ where: { archivedAt: null }, orderBy: [{ position: "asc" }, { name: "asc" }], select: { slug: true } });
    expect(activeCategoryOrder.map((category) => category.slug)).toEqual(["style", "home", "tech", "outdoors"]);
    expect(await catalog.countLowStockProducts()).toBe(4);
  });
});
