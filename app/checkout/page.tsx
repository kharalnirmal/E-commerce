import Link from "next/link";
import { formatNpr } from "@/lib/storefront";
import { getCheckoutPreview } from "@/lib/checkout-service";
import requireUser from "@/lib/require-user";
import { CheckoutForm } from "./checkout-form";

export default async function CheckoutPage() {
  const userId = await requireUser();
  const preview = await getCheckoutPreview(userId);
  const invalid = !preview.items.length || preview.items.some((item) => item.product.archivedAt || item.product.category.archivedAt || item.quantity > item.availableStock);
  return (
    <main className="shell py-12 sm:py-20">
      <p className="utility-label text-[var(--vermilion)]">Secure checkout</p>
      <h1 className="mt-2 text-6xl font-bold tracking-[-0.07em] sm:text-8xl">DELIVER / PAY</h1>
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_22rem]">
        {invalid ? (
          <section className="brutal-card p-8"><h2 className="text-3xl font-bold">Review your cart</h2><p className="mt-3">An item is unavailable or exceeds current inventory.</p><Link href="/cart" className="button-primary mt-6">Return to cart</Link></section>
        ) : <CheckoutForm cartToken={preview.token} />}
        <aside className="brutal-card h-fit p-6 lg:sticky lg:top-28">
          <h2 className="utility-label">Server-current summary</h2>
          <ul className="mt-5 space-y-3">{preview.items.map((item) => <li key={item.id} className="flex justify-between gap-3"><span>{item.quantity} x {item.product.name}</span><span>{formatNpr(item.product.price.mul(item.quantity))}</span></li>)}</ul>
          <dl className="mt-6 space-y-2 border-t-2 border-[var(--line)] pt-5">
            <div className="flex justify-between"><dt>Merchandise</dt><dd>{formatNpr(preview.subtotalPaisa / 100)}</dd></div>
            <div className="flex justify-between"><dt>Delivery</dt><dd>{preview.deliveryFeePaisa ? formatNpr(preview.deliveryFeePaisa / 100) : "Free"}</dd></div>
            <div className="flex justify-between text-xl font-bold"><dt>Total</dt><dd>{formatNpr(preview.totalPaisa / 100)}</dd></div>
          </dl>
          <p className="mt-5 text-sm text-[var(--muted)]">Delivery is NPR 150 and free only above NPR 5,000. Prices and stock are checked again when you submit.</p>
        </aside>
      </div>
    </main>
  );
}
