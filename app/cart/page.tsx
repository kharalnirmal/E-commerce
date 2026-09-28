import { prisma } from "@/lib/prisma";
import requireUser from "@/lib/require-user";
import { formatNpr } from "@/lib/storefront";
import { CartItemControls } from "./cart-item-controls";
import Link from "next/link";
import { getReservedQuantities } from "@/lib/inventory";

export default async function CartPage() {
  const userId = await requireUser();

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
  const total = availableItems.length
    ? availableItems.reduce(
        (sum, item) => sum.plus(item.product.price.mul(item.quantity)),
        availableItems[0].product.price.mul(0),
      )
    : 0;

  return (
    <main className="shell py-12 sm:py-20">
      <p className="utility-label text-[var(--vermilion)]">Your selection</p>
      <h1 className="mt-2 text-6xl font-bold tracking-[-0.07em] sm:text-8xl">CART / BAG</h1>

      {items.length === 0 ? (
        <section className="brutal-card mt-10 p-10 text-center">
          <p className="editorial text-3xl">Your cart is empty.</p>
          <Link href="/products" className="button-primary mt-6">Explore the market</Link>
        </section>
      ) : (
        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_22rem]">
          <ul className="space-y-5">
            {items.map((item) => {
              const availableStock = Math.max(0, item.product.stock - (reserved.get(item.product.id) ?? 0));
              return (
              <li key={item.id} className="brutal-card grid gap-5 p-5 sm:grid-cols-[1fr_auto]">
                <div>
                  <h2 className="text-2xl font-bold tracking-[-0.04em]">{item.product.name}</h2>
                  <p className="mt-2 text-[var(--muted)]">{formatNpr(item.product.price)} each · {availableStock} available</p>
                  <p className="mt-5 utility-label">Subtotal {formatNpr(item.product.price.mul(item.quantity))}</p>
                  {(item.product.archivedAt || item.product.category.archivedAt) && <p className="mt-3 font-semibold text-[var(--vermilion)]">No longer available. Remove this item before checkout.</p>}
                </div>
                <CartItemControls
                  itemId={item.id}
                  quantity={item.quantity}
                  maximum={Math.min(availableStock, 99)}
                  available={!item.product.archivedAt && !item.product.category.archivedAt}
                />
              </li>
              );
            })}
          </ul>
          <aside className="brutal-card h-fit p-6 lg:sticky lg:top-28">
            <p className="utility-label">Current-price total</p>
            <p className="mt-3 text-4xl font-bold">{formatNpr(total)}</p>
            <Link href="/checkout" className="button-primary mt-6 w-full">Continue to checkout</Link>
            <p className="mt-4 text-sm text-[var(--muted)]">Prices, activity, and reservable stock are checked securely before payment.</p>
          </aside>
        </div>
      )}
    </main>
  );
}
