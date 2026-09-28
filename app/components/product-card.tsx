import Link from "next/link";
import { formatNpr } from "@/lib/storefront";
import { RemoteImage } from "./remote-image";

type ProductCardProps = {
  product: {
    name: string;
    id: string;
    slug: string;
    maker: string;
    origin: string;
    price: { toString(): string };
    stock: number;
    imageUrl: string | null;
    category: { name: string };
  };
};

export function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="group brutal-card flex h-full flex-col p-3">
      <Link href={`/products/${product.slug}`} className="flex h-full flex-col">
        <div className="image-frame aspect-[4/5]">
          {product.imageUrl ? (
            <RemoteImage
              src={product.imageUrl}
              alt={product.name}
              proxyPath={`/api/catalog-image/product/${product.id}`}
            />
          ) : (
            <div className="flex h-full items-center justify-center font-mono text-xs uppercase">Image coming soon</div>
          )}
          {product.stock === 0 && (
            <span className="utility-label absolute left-3 top-3 rounded-full border-2 border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-[var(--ink)]">
              Sold out
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col px-1 pb-1 pt-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-bold leading-tight tracking-[-0.035em]">{product.name}</h2>
            <span className="font-mono text-sm font-semibold">{formatNpr(product.price)}</span>
          </div>
          <p className="mt-2 text-sm text-[var(--muted)]">{product.maker} · {product.origin}</p>
          <p className="utility-label mt-auto pt-5">{product.category.name} <span aria-hidden="true">↗</span></p>
        </div>
      </Link>
    </article>
  );
}
