import Image from "next/image";
import Link from "next/link";
import { OpeningSequence } from "@/app/components/opening-sequence";
import { ProductCard } from "@/app/components/product-card";
import { RemoteImage } from "@/app/components/remote-image";
import { prisma } from "@/lib/prisma";
import { getReservedQuantities, withAvailableStock } from "@/lib/inventory";

const productSelect = {
  name: true,
  id: true,
  slug: true,
  maker: true,
  origin: true,
  price: true,
  stock: true,
  imageUrl: true,
  category: { select: { name: true } },
} as const;

export default async function Home() {
  const [storedFeatured, storedArrivals, storedTrending, storedRecommendations, categories] = await Promise.all([
    prisma.product.findMany({
      where: { featured: true, archivedAt: null, category: { archivedAt: null } },
      take: 4,
      orderBy: [{ createdAt: "desc" }, { name: "asc" }],
      select: productSelect,
    }),
    prisma.product.findMany({
      where: { archivedAt: null, category: { archivedAt: null } },
      take: 4,
      orderBy: [{ createdAt: "desc" }, { name: "asc" }],
      select: productSelect,
    }),
    prisma.product.findMany({
      where: { productViews: { some: {} }, archivedAt: null, category: { archivedAt: null } },
      orderBy: [{ featured: "desc" }, { name: "asc" }],
      select: { ...productSelect, _count: { select: { productViews: true } } },
    }),
    prisma.product.findMany({
      where: { featured: false, archivedAt: null, category: { archivedAt: null } },
      take: 4,
      orderBy: [{ category: { position: "asc" } }, { name: "asc" }],
      select: productSelect,
    }),
    prisma.category.findMany({
      where: { archivedAt: null },
      orderBy: [{ position: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true, description: true, imageUrl: true },
    }),
  ]);
  const rankedTrending = storedTrending
    .sort((left, right) => right._count.productViews - left._count.productViews)
    .slice(0, 4);
  const trendingSource = [
    ...rankedTrending,
    ...storedFeatured.filter((product) => !rankedTrending.some((trendingProduct) => trendingProduct.id === product.id)),
  ].slice(0, 4);
  const reserved = await getReservedQuantities();
  const [featured, arrivals, trending, recommendations] = await Promise.all([
    withAvailableStock(storedFeatured, reserved),
    withAvailableStock(storedArrivals, reserved),
    withAvailableStock(trendingSource, reserved),
    withAvailableStock(storedRecommendations, reserved),
  ]);

  return (
    <main>
      <OpeningSequence />
      <section className="shell hero-grid">
        <div className="hero-copy">
          <h1 className="display" data-testid="kinetic-hero">Goods for<br />daily use.</h1>
          <p className="hero-intro">Shop clothing, homeware, accessories, and outdoor goods from independent makers.</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/products" className="button-primary">Shop the catalog</Link>
            <Link href="#collections" className="button-secondary">Browse collections</Link>
          </div>
        </div>
        <div className="hero-image">
          <Image
            src="https://images.unsplash.com/photo-1605640840605-14ac1855827b?auto=format&fit=crop&w=1200&q=85"
            alt="A busy market street in Nepal"
            fill
            preload
            sizes="(max-width: 1024px) 100vw, 44vw"
            className="object-cover"
          />
          <span className="image-caption">Nepal</span>
        </div>
      </section>

      <ProductSection id="featured" title="Featured now" description="Selected products from the current catalog." products={featured} />
      <ProductSection id="arrivals" title="New arrivals" description="Recently added products." products={arrivals} tone="muted" />

      <section id="collections" className="shell discovery-section">
        <SectionHeading title="Shop by collection" description="Browse products by category." href="/products" />
        {categories.length ? <div className="collection-grid">
          {categories.map((category) => (
            <Link key={category.slug} href={`/products?category=${category.slug}`} className="collection-link">
              <div className="image-frame aspect-[3/2]">
                {category.imageUrl && <RemoteImage src={category.imageUrl} alt="" proxyPath={`/api/catalog-image/category/${category.id}`} />}
              </div>
              <div className="collection-copy">
                <h3>{category.name}</h3>
                <p>{category.description}</p>
                <span>Explore collection →</span>
              </div>
            </Link>
          ))}
        </div> : <p className="text-[var(--muted)]">Collections are not available right now. Browse the full catalog instead.</p>}
      </section>

      <ProductSection id="trending" title="Trending" description="Products receiving the most views." products={trending} />
      <ProductSection id="recommended" title="More to browse" description="Products from across the catalog." products={recommendations} tone="muted" />
    </main>
  );
}

function ProductSection({
  id,
  title,
  description,
  products,
  tone,
}: {
  id: string;
  title: string;
  description: string;
  products: Parameters<typeof ProductCard>[0]["product"][];
  tone?: "muted";
}) {
  if (!products.length) return null;
  return (
    <section id={id} className={tone === "muted" ? "discovery-band" : "shell discovery-section"}>
      <div className={tone === "muted" ? "shell" : undefined}>
        <SectionHeading title={title} description={description} href="/products" />
        <div className="product-grid">
          {products.map((product) => <ProductCard key={`${id}-${product.slug}`} product={product} />)}
        </div>
      </div>
    </section>
  );
}

function SectionHeading({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <div className="section-heading">
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <Link href={href} className="text-action">View all</Link>
    </div>
  );
}
