import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatNpr } from "@/lib/storefront";
import { prisma } from "@/lib/prisma";
import AddToCartForm from "./add-to-cart-form";

type ProductPageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { slug: id }, select: { name: true, description: true } });
  return product ? { title: product.name, description: product.description } : { title: "Product not found" };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { id: slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      maker: true,
      origin: true,
      description: true,
      imageUrl: true,
      stock: true,
      price: true,
      category: { select: { name: true, slug: true } },
    },
  });

  if (!product) notFound();

  return (
    <main className="shell py-10 sm:py-16">
      <nav aria-label="Breadcrumb" className="utility-label mb-7 flex flex-wrap gap-2 text-[var(--muted)]">
        <Link href="/products">Shop</Link><span>/</span>
        <Link href={`/products?category=${product.category.slug}`}>{product.category.name}</Link><span>/</span>
        <span className="text-[var(--ink)]">{product.name}</span>
      </nav>
      <div className="grid gap-10 lg:grid-cols-[1.12fr_.88fr] lg:gap-16">
        <div className="image-frame aspect-[4/5] border-2 border-[var(--line)]">
          {product.imageUrl ? (
            <Image src={product.imageUrl} alt={product.name} fill preload sizes="(max-width: 1024px) 100vw, 55vw" />
          ) : (
            <div className="flex h-full items-center justify-center">Image coming soon</div>
          )}
        </div>
        <div className="flex flex-col lg:py-6">
          <p className="utility-label text-[var(--vermilion)]">{product.category.name} / {product.origin}</p>
          <h1 className="mt-4 text-5xl font-bold leading-[.94] tracking-[-0.06em] sm:text-7xl">{product.name}</h1>
          <p className="editorial mt-4 text-2xl">by {product.maker}</p>
          <p className="mt-8 text-3xl font-bold tracking-[-0.04em]">{formatNpr(product.price)}</p>
          <div className="my-8 h-0.5 bg-[var(--line)]" />
          <p className="max-w-xl text-lg leading-relaxed text-[var(--muted)]">{product.description}</p>
          <div className="mt-8 flex items-center gap-3">
            <span className={`h-3 w-3 rounded-full ${product.stock > 0 ? "bg-green-600" : "bg-[var(--vermilion)]"}`} />
            <p className="utility-label">{product.stock > 0 ? `${product.stock} in stock` : "Sold out · unavailable to purchase"}</p>
          </div>
          <div className="mt-10 rounded-2xl border-2 border-[var(--line)] bg-[var(--surface)] p-5">
            <AddToCartForm productId={product.id} stock={product.stock} />
          </div>
          <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border-2 border-[var(--line)] bg-[var(--line)] text-sm">
            <div className="bg-[var(--paper)] p-4"><dt className="utility-label text-[var(--muted)]">Maker</dt><dd className="mt-2">{product.maker}</dd></div>
            <div className="bg-[var(--paper)] p-4"><dt className="utility-label text-[var(--muted)]">Origin</dt><dd className="mt-2">{product.origin}</dd></div>
          </dl>
        </div>
      </div>
    </main>
  );
}
