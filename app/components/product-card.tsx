import Link from "next/link";
import { formatNpr } from "@/lib/storefront";
import { RemoteImage } from "./remote-image";
import { QuickAdd } from "./quick-add";

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
    <article className="group product-card">
      <Link href={`/products/${product.slug}`} className="product-card-link">
        <div className="image-frame aspect-[4/5] bg-[var(--surface-muted)]">
          {product.imageUrl ? (
            <RemoteImage
              src={product.imageUrl}
              alt={product.name}
              proxyPath={`/api/catalog-image/product/${product.id}`}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs uppercase tracking-widest">Image coming soon</div>
          )}
          {product.stock === 0 && (
            <span className="availability-tag absolute left-3 top-3">
              Sold out
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col pt-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-bold leading-tight tracking-[-0.035em]">{product.name}</h2>
            <span className="shrink-0 text-sm font-semibold">{formatNpr(product.price)}</span>
          </div>
          <p className="mt-2 text-sm text-[var(--muted)]">{product.maker} · {product.origin}</p>
          <p className="mt-2 text-xs uppercase tracking-[0.12em] text-[var(--muted)]">{product.category.name}</p>
        </div>
      </Link>
      <div className="mt-auto border-t border-[var(--line-soft)] pt-3">
        <div className="mb-2 flex items-center justify-between text-xs text-[var(--muted)]">
          <span>{product.stock > 0 ? `${product.stock} available` : "Unavailable"}</span>
          <span aria-hidden="true">View product ↗</span>
        </div>
        <QuickAdd productId={product.id} productName={product.name} stock={product.stock} />
      </div>
    </article>
  );
}
