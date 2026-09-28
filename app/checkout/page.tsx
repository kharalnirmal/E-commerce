import Link from "next/link";
import { formatNpr } from "@/lib/storefront";
import { getCheckoutPreview } from "@/lib/checkout-service";
import requireUser from "@/lib/require-user";
import { CheckoutForm } from "./checkout-form";

export default async function CheckoutPage() {
  const userId = await requireUser();
  const preview = await getCheckoutPreview(userId);
  const itemIsInvalid = (item: (typeof preview.items)[number]) => (
    Boolean(item.product.archivedAt)
    || Boolean(item.product.category.archivedAt)
    || item.quantity > item.availableStock
  );
  const invalid = !preview.items.length || preview.items.some(itemIsInvalid);
  return (
    <main className="shell py-12 sm:py-20">
      <header className="border-b border-[var(--line-soft)] pb-8">
        <h1 className="text-6xl font-bold tracking-[-0.07em] sm:text-8xl">Checkout</h1>
        <p className="mt-4 max-w-2xl text-lg text-[var(--muted)]">Confirm where this order is going. Your items are reserved for ten minutes after you continue.</p>
      </header>
      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-12">
        {invalid ? (
          <section className="border-y border-[var(--line)] py-8" role="alert">
            <h2 className="text-3xl font-bold tracking-[-0.04em]">Review your cart</h2>
            <p className="mt-3 max-w-xl text-[var(--muted)]">{preview.items.length ? "Availability changed before checkout. Update the marked items before continuing." : "Your cart is empty. Add an item before continuing."}</p>
            <Link href="/cart" className="button-primary mt-6">Return to cart</Link>
          </section>
        ) : <CheckoutForm cartToken={preview.token} />}
        <aside className="h-fit border-y border-[var(--line)] py-6 lg:sticky lg:top-28" aria-labelledby="order-summary-title">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="order-summary-title" className="text-xl font-semibold">Order summary</h2>
            <Link href="/cart" className="text-action">Edit cart</Link>
          </div>
          {preview.items.length ? (
            <ul className="mt-5 divide-y divide-[var(--line-soft)] border-t border-[var(--line-soft)]">
              {preview.items.map((item) => (
                <li key={item.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 py-4">
                  <span><strong className="block">{item.product.name}</strong><small className="text-[var(--muted)]">Qty {item.quantity} · {formatNpr(item.product.price)} each</small>{itemIsInvalid(item) && <small className="mt-1 block font-semibold">Availability changed</small>}</span>
                  <span className="font-semibold">{formatNpr(item.product.price.mul(item.quantity))}</span>
                </li>
              ))}
            </ul>
          ) : <p className="mt-5 text-sm text-[var(--muted)]">No items to check out.</p>}
          <dl className="space-y-3 border-t border-[var(--line)] pt-5">
            <div className="flex justify-between"><dt>Merchandise</dt><dd>{formatNpr(preview.subtotalPaisa / 100)}</dd></div>
            <div className="flex justify-between"><dt>Delivery</dt><dd>{preview.deliveryFeePaisa ? formatNpr(preview.deliveryFeePaisa / 100) : "Free"}</dd></div>
            <div className="flex justify-between border-t border-[var(--line-soft)] pt-4 text-xl font-bold"><dt>Total</dt><dd>{formatNpr(preview.totalPaisa / 100)}</dd></div>
          </dl>
          <p className="mt-5 text-sm leading-relaxed text-[var(--muted)]">Delivery is NPR 150 and becomes free above NPR 5,000. Prices and stock are checked again when you continue.</p>
        </aside>
      </div>
    </main>
  );
}
