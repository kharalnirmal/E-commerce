import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatNpr } from "@/lib/storefront";
import { prisma } from "@/lib/prisma";
import AddToCartForm from "./add-to-cart-form";
import { getReservedQuantities } from "@/lib/inventory";
import { ProductGallery } from "./product-gallery";

type ProductPageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await prisma.product.findFirst({ where: { slug: id, archivedAt: null, category: { archivedAt: null } }, select: { name: true, description: true } });
  return product ? { title: product.name, description: product.description } : { title: "Product not found" };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { id: slug } = await params;
  const product = await prisma.product.findFirst({
    where: { slug, archivedAt: null, category: { archivedAt: null } },
    select: {
      id: true,
      name: true,
      slug: true,
      maker: true,
      origin: true,
      description: true,
      imageUrl: true,
      images: { orderBy: { position: "asc" }, select: { id: true, url: true } },
      stock: true,
      price: true,
      category: { select: { name: true, slug: true } },
    },
  });

  if (!product) notFound();
  const reserved = await getReservedQuantities();
  const availableStock = Math.max(0, product.stock - (reserved.get(product.id) ?? 0));
  const images = product.images.length
    ? product.images.map((image) => ({ id: image.id, url: image.url, proxyPath: `/api/catalog-image/image/${image.id}` }))
    : product.imageUrl
      ? [{ id: product.id, url: product.imageUrl, proxyPath: `/api/catalog-image/product/${product.id}` }]
      : [];

  return (
    <main className="shell py-10 sm:py-16">
      <nav aria-label="Breadcrumb" className="breadcrumb">
        <Link href="/products">Shop</Link><span>/</span>
        <Link href={`/products?category=${product.category.slug}`}>{product.category.name}</Link><span>/</span>
        <span className="text-[var(--ink)]">{product.name}</span>
      </nav>
      <div className="grid gap-10 lg:grid-cols-[1.12fr_.88fr] lg:gap-16">
        {images.length ? <ProductGallery productName={product.name} images={images} /> : <div className="image-frame aspect-[4/5] flex items-center justify-center">Image coming soon</div>}
        <div className="flex flex-col lg:py-6">
          <h1 className="product-title">{product.name}</h1>
          <p className="mt-4 text-sm text-[var(--muted)]">{product.category.name} / {product.origin}</p>
          <p className="mt-4 text-xl text-[var(--muted)]">by {product.maker}</p>
          <p className="mt-8 text-3xl font-bold tracking-[-0.04em]">{formatNpr(product.price)}</p>
          <div className="my-8 h-px bg-[var(--line-soft)]" />
          <p className="max-w-xl text-lg leading-relaxed text-[var(--muted)]">{product.description}</p>
          <div className="mt-8 flex items-center gap-3">
             <span className={`h-2 w-2 rounded-full ${availableStock > 0 ? "bg-[var(--ink)]" : "bg-[var(--muted)]"}`} />
            <p className="utility-label">{availableStock > 0 ? `${availableStock} in stock` : "Sold out · unavailable to purchase"}</p>
          </div>
          <div className="mt-10 border-y border-[var(--line-soft)] py-5">
            <AddToCartForm productId={product.id} stock={availableStock} />
          </div>
          <dl className="mt-8 grid grid-cols-2 border-y border-[var(--line-soft)] text-sm">
            <div className="border-r border-[var(--line-soft)] py-4 pr-4"><dt className="field-label text-[var(--muted)]">Maker</dt><dd className="mt-2">{product.maker}</dd></div>
            <div className="py-4 pl-4"><dt className="field-label text-[var(--muted)]">Origin</dt><dd className="mt-2">{product.origin}</dd></div>
          </dl>
        </div>
      </div>
    </main>
  );
}
