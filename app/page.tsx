import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/app/components/product-card";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const [featured, categories] = await Promise.all([
    prisma.product.findMany({
      where: { featured: true },
      take: 6,
      orderBy: { createdAt: "desc" },
      select: {
        name: true,
        slug: true,
        maker: true,
        origin: true,
        price: true,
        stock: true,
        imageUrl: true,
        category: { select: { name: true } },
      },
    }),
    prisma.category.findMany({
      orderBy: [{ position: "asc" }, { name: "asc" }],
      select: { name: true, slug: true, description: true, imageUrl: true },
    }),
  ]);

  return (
    <main>
      <section className="shell grid min-h-[calc(100svh-5rem)] items-center gap-10 py-12 lg:grid-cols-[1.2fr_.8fr]">
        <div className="relative z-10">
          <p className="utility-label mb-6">Kathmandu · 27.7172° N</p>
          <h1 className="display" data-testid="kinetic-hero">
            <span className="hero-word">GOODS</span>
            <br />
            <span className="hero-word hero-word-late"><span className="editorial font-normal text-[var(--vermilion)]">meet</span> HERE.</span>
          </h1>
          <div className="mt-10 flex max-w-xl flex-col items-start gap-6 border-l-2 border-[var(--line)] pl-5 sm:flex-row sm:items-end">
            <p className="text-lg leading-relaxed">
              A contemporary crossroads for useful, expressive goods from Nepali makers and the wider world.
            </p>
            <Link href="/products" className="button-primary shrink-0">Enter the market</Link>
          </div>
        </div>
        <div className="relative mx-auto aspect-[4/5] w-full max-w-lg rotate-2 overflow-hidden rounded-[2rem] border-2 border-[var(--line)] shadow-[10px_10px_0_var(--line)]">
          <Image
            src="https://images.unsplash.com/photo-1605640840605-14ac1855827b?auto=format&fit=crop&w=1200&q=85"
            alt="Colorful prayer flags crossing a Kathmandu street"
            fill
            preload
            sizes="(max-width: 1024px) 90vw, 38vw"
            className="object-cover"
          />
          <p className="utility-label absolute bottom-4 left-4 rounded-full bg-[var(--acid)] px-4 py-3 text-[#171713]">नयाँ दृष्टि / A new view</p>
        </div>
      </section>

      <section id="weekly-edit" className="border-y-2 border-[var(--line)] bg-[var(--paper-deep)] py-20">
        <div className="shell">
          <div className="mb-10 grid gap-5 md:grid-cols-2 md:items-end">
            <div>
              <p className="utility-label text-[var(--vermilion)]">Weekly edit 01</p>
              <h2 className="mt-3 text-5xl font-bold tracking-[-0.06em] sm:text-7xl">CITY / RIDGE</h2>
            </div>
            <p className="editorial max-w-lg text-2xl leading-snug md:justify-self-end">
              Six things for the route between a desk in Patan and a cold morning above the valley.
            </p>
          </div>
          {featured.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((product) => <ProductCard key={product.slug} product={product} />)}
            </div>
          ) : (
            <div className="brutal-card p-10 text-center">The next edit is being assembled.</div>
          )}
        </div>
      </section>

      <section id="categories" className="shell py-24">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="utility-label">Four directions</p>
            <h2 className="mt-2 text-5xl font-bold tracking-[-0.055em]">Find your way in.</h2>
          </div>
          <Link href="/products" className="button-secondary">View everything</Link>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {categories.map((category, index) => (
            <Link
              key={category.slug}
              href={`/products?category=${category.slug}`}
              className="group brutal-card grid min-h-72 grid-cols-[1fr_1.2fr] overflow-hidden p-3"
            >
              <div className="flex flex-col justify-between p-4">
                <span className="utility-label">0{index + 1}</span>
                <div>
                  <h3 className="text-3xl font-bold tracking-[-0.05em]">{category.name}</h3>
                  <p className="mt-2 text-sm text-[var(--muted)]">{category.description}</p>
                </div>
              </div>
              <div className="image-frame min-h-64">
                {category.imageUrl && <Image src={category.imageUrl} alt="" fill sizes="(max-width: 768px) 50vw, 25vw" />}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section aria-label="Kathmandu field note" className="overflow-hidden border-y-2 border-[var(--line)] bg-[var(--acid)] py-6 text-[#171713]">
        <div className="shell flex flex-wrap items-center justify-between gap-4">
          <p className="text-3xl font-black tracking-[-0.05em] sm:text-5xl">चोकमा भेटौँ।</p>
          <p className="editorial max-w-xl text-xl">Meet us at the crossroads, where a useful object always carries a story.</p>
          <span className="utility-label">Kathmandu field note / 01</span>
        </div>
      </section>

      <section className="bg-[var(--vermilion)] py-24 text-[#fff9ed]">
        <div className="shell grid gap-10 lg:grid-cols-[.7fr_1.3fr]">
          <p className="utility-label">Our point of view / हाम्रो सोच</p>
          <div>
            <h2 className="text-5xl font-bold leading-[.95] tracking-[-0.06em] sm:text-7xl">
              LOCAL IS A PERSPECTIVE, NOT A LIMIT.
            </h2>
            <p className="editorial mt-8 max-w-2xl text-2xl leading-relaxed">
              CHAUK puts a Patan metalworker beside a global design studio. We choose objects for how they live, last, and speak to one another.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
