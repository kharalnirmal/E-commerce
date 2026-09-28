import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAvailableStock } from "@/lib/inventory";
import { formatNpr, readSearchQuery } from "@/lib/storefront";

export async function GET(request: Request) {
  const q = readSearchQuery(new URL(request.url).searchParams.get("q"));
  if (q.length < 2) return NextResponse.json({ products: [] });

  const storedProducts = await prisma.product.findMany({
    where: {
      archivedAt: null,
      category: { archivedAt: null },
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { maker: { contains: q, mode: "insensitive" } },
        { origin: { contains: q, mode: "insensitive" } },
        { category: { name: { contains: q, mode: "insensitive" } } },
      ],
    },
    orderBy: [{ featured: "desc" }, { name: "asc" }],
    take: 5,
    select: {
      id: true,
      name: true,
      slug: true,
      maker: true,
      price: true,
      stock: true,
      imageUrl: true,
    },
  });
  const products = await withAvailableStock(storedProducts);

  return NextResponse.json({
    products: products.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      maker: product.maker,
      price: formatNpr(product.price),
      stock: product.stock,
      imageUrl: product.imageUrl,
    })),
  });
}
