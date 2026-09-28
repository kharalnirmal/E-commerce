import { prisma } from "@/lib/prisma";
import requireUser from "@/lib/require-user";
import { formatNpr } from "@/lib/storefront";
import { CartItemControls } from "./cart-item-controls";
import Link from "next/link";
import { getReservedQuantities } from "@/lib/inventory";

export default async function CartPage({ searchParams }: { searchParams: Promise<{ payment?: string }> }) {
  const userId = await requireUser();
  const query = await searchParams;

  const [items, reserved] = await Promise.all([prisma.cartItem.findMany({
    where: { userId },
    select: {
      id: true,
      quantity: true,
      product: {
        select: {
          id: true,
          name: true,
          price: true,
          stock: true,
          archivedAt: true,
          category: { select: { archivedAt: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  }), getReservedQuantities()]);

  const availableItems = items.filter((item) => !item.product.archivedAt && !item.product.category.archivedAt);
  const itemAvailability = new Map(
    items.map((item) => [
      item.id,
      Math.max(0, item.product.stock - (reserved.get(item.product.id) ?? 0)),
    ]),
  );
  const checkoutReady = items.length > 0 && items.every((item) => (
    !item.product.archivedAt
    && !item.product.category.archivedAt
    && item.quantity <= (itemAvailability.get(item.id) ?? 0)
  ));
  const total = availableItems.length
    ? availableItems.reduce(
        (sum, item) => sum.plus(item.product.price.mul(item.quantity)),
        availableItems[0].product.price.mul(0),
      )
    : 0;

  return (
    <main className="shell py-12 sm:py-20">
      <header className="flex flex-col gap-5 border-b border-[var(--line-soft)] pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-6xl font-bold tracking-[-0.07em] sm:text-8xl">Cart</h1>
          <p className="mt-4 max-w-xl text-lg text-[var(--muted)]">Adjust quantities here. Stock is reserved only when you continue from checkout.</p>
        </div>
        <p className="utility-label">{items.length} {items.length === 1 ? "item" : "items"}</p>
      </header>

      {query.payment === "verification-failed" && (
        <div role="alert" className="mt-6 border border-[var(--line)] p-4">
          The eSewa response could not be matched to an order. Check your order history before attempting another payment.
          <Link href="/orders" className="text-action ml-2">View orders</Link>
        </div>
      )}

      {items.length === 0 ? (
        <section className="empty-state" aria-labelledby="empty-cart-title">
          <h2 id="empty-cart-title">Your cart is empty.</h2>
          <p>Browse the shop and add something to start an order.</p>
          <Link href="/products" className="button-primary">Explore the market</Link>
        </section>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
          <ul className="divide-y divide-[var(--line-soft)] border-y border-[var(--line-soft)]">
            {items.map((item) => {
              const availableStock = itemAvailability.get(item.id) ?? 0;
              const active = !item.product.archivedAt && !item.product.category.archivedAt;
              const hasEnoughStock = active && item.quantity <= availableStock;
              return (
                <li key={item.id} className="grid gap-6 py-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:py-8">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h2 className="text-2xl font-bold tracking-[-0.04em]">{item.product.name}</h2>
                      <p className="text-lg font-semibold sm:hidden">{formatNpr(item.product.price.mul(item.quantity))}</p>
                    </div>
                    <p className="mt-2 text-sm text-[var(--muted)]">{formatNpr(item.product.price)} each</p>
                    <div className="mt-5 flex items-start gap-3" role="status">
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${hasEnoughStock ? "bg-[var(--ink)]" : "bg-[var(--muted)]"}`} />
                      <p className="text-sm">
                        {!active
                          ? "No longer available. Remove this item before checkout."
                          : availableStock === 0
                            ? "Out of stock. Remove this item to continue."
                            : item.quantity > availableStock
                              ? `Availability changed. Only ${availableStock} ${availableStock === 1 ? "unit is" : "units are"} available.`
                              : `${availableStock} available now.`}
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-5 sm:min-w-52 sm:justify-items-end">
                    <p className="hidden text-lg font-semibold sm:block">{formatNpr(item.product.price.mul(item.quantity))}</p>
                    <CartItemControls
                      itemId={item.id}
                      quantity={item.quantity}
                      maximum={Math.min(availableStock, 99)}
                      available={active && availableStock > 0}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          <aside className="h-fit border-y border-[var(--line)] py-6 lg:sticky lg:top-28">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-xl font-semibold">Total</h2>
              <p className="text-3xl font-bold tracking-[-0.04em]">{formatNpr(total)}</p>
            </div>
            <p className="mt-2 text-sm text-[var(--muted)]">Delivery is calculated at checkout.</p>
            {checkoutReady ? (
              <Link href="/checkout" className="button-primary mt-6 w-full">Continue to checkout</Link>
            ) : (
              <div className="mt-6" role="status" aria-live="polite">
                <button type="button" disabled className="button-primary w-full">Continue to checkout</button>
                <p className="mt-3 text-sm font-semibold">Update or remove unavailable items to continue.</p>
              </div>
            )}
            <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">Prices and reservable stock are checked again before payment.</p>
          </aside>
        </div>
      )}
    </main>
  );
}
