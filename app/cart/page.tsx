import { prisma } from "@/lib/prisma";
import requireUser from "@/lib/require-user";
import { formatNpr } from "@/lib/storefront";
import { CartItemControls } from "./cart-item-controls";
import Link from "next/link";

export default async function CartPage() {
  const userId = await requireUser();

  const items = await prisma.cartItem.findMany({
    where: { userId },
    select: {
      id: true,
      quantity: true,
      product: {
        select: {
          name: true,
          price: true,
          stock: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const total = items.length
    ? items.reduce(
        (sum, item) => sum.plus(item.product.price.mul(item.quantity)),
        items[0].product.price.mul(0),
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
            {items.map((item) => (
              <li key={item.id} className="brutal-card grid gap-5 p-5 sm:grid-cols-[1fr_auto]">
                <div>
                  <h2 className="text-2xl font-bold tracking-[-0.04em]">{item.product.name}</h2>
                  <p className="mt-2 text-[var(--muted)]">{formatNpr(item.product.price)} each · {item.product.stock} available</p>
                  <p className="mt-5 utility-label">Subtotal {formatNpr(item.product.price.mul(item.quantity))}</p>
                </div>
                <CartItemControls
                  itemId={item.id}
                  quantity={item.quantity}
                  maximum={Math.min(item.product.stock, 99)}
                />
              </li>
            ))}
          </ul>
          <aside className="brutal-card h-fit p-6 lg:sticky lg:top-28">
            <p className="utility-label">Current-price total</p>
            <p className="mt-3 text-4xl font-bold">{formatNpr(total)}</p>
            <button disabled className="button-primary mt-6 w-full">Checkout unavailable</button>
            <p className="mt-4 text-sm text-[var(--muted)]">Checkout arrives in the next CHAUK release. Your cart remains ready.</p>
          </aside>
        </div>
      )}
    </main>
  );
}
