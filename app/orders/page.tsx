import Link from "next/link";
import { listCustomerOrders } from "@/lib/order-service";
import { humanizeOrderStatus } from "@/lib/orders";
import requireUser from "@/lib/require-user";
import { formatNpr } from "@/lib/storefront";

export default async function OrdersPage() {
  const userId = await requireUser();
  const orders = await listCustomerOrders(userId);
  return (
    <main className="shell py-12 sm:py-20">
      <p className="utility-label text-[var(--vermilion)]">Your purchases</p>
      <h1 className="mt-2 text-6xl font-bold tracking-[-0.07em] sm:text-8xl">ORDER / LOG</h1>
      <p className="editorial mt-5 max-w-2xl text-2xl">Every order, payment, and fulfillment update in one place.</p>
      {orders.length ? (
        <ol className="mt-10 grid gap-5 lg:grid-cols-2">
          {orders.map((order) => (
            <li key={order.id} className="brutal-card p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div><p className="utility-label">{order.displayNumber}</p><h2 className="mt-2 text-2xl font-bold">{humanizeOrderStatus(order.status)}</h2></div>
                <strong className="text-xl">{formatNpr(order.totalAmount)}</strong>
              </div>
              <p className="mt-5 text-[var(--muted)]">{order.orderItems.map((item) => `${item.quantity} x ${item.productName}`).join(", ")}</p>
              <div className="mt-6 flex items-center justify-between gap-4"><time>{order.createdAt.toLocaleDateString()}</time><Link href={`/orders/${order.displayNumber}`} className="button-secondary">Open order</Link></div>
            </li>
          ))}
        </ol>
      ) : (
        <section className="brutal-card mt-10 p-8 text-center"><h2 className="text-3xl font-bold">No orders yet</h2><p className="mt-3 text-[var(--muted)]">Your first checkout will appear here.</p><Link href="/products" className="button-primary mt-6">Browse the market</Link></section>
      )}
    </main>
  );
}
