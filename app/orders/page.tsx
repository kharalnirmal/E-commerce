import Link from "next/link";
import { listCustomerOrders } from "@/lib/order-service";
import { humanizeOrderStatus } from "@/lib/orders";
import requireUser from "@/lib/require-user";
import { formatNpr } from "@/lib/storefront";

function paymentSummary(status: string) {
  if (["PAID", "SHIPPED", "DELIVERED"].includes(status)) return "Paid";
  if (status === "FAILED") return "Payment failed";
  if (status === "REFUND_PENDING") return "Refund pending";
  if (status === "REFUNDED") return "Refunded";
  if (status === "CANCELLED") return "Not paid";
  return "Awaiting payment";
}

function deliverySummary(status: string) {
  if (status === "SHIPPED") return "On the way";
  if (status === "DELIVERED") return "Delivered";
  if (["CANCELLED", "REFUND_PENDING", "REFUNDED"].includes(status)) return "Not being delivered";
  return "Not yet shipped";
}

export default async function OrdersPage() {
  const userId = await requireUser();
  const orders = await listCustomerOrders(userId);

  return (
    <main className="shell py-12 sm:py-20">
      <header className="border-b border-[var(--line)] pb-8 sm:flex sm:items-end sm:justify-between sm:gap-8">
        <div>
          <h1 className="text-6xl font-bold leading-[0.88] tracking-[-0.07em] sm:text-8xl">ORDER / LOG</h1>
          <p className="mt-5 max-w-xl text-lg text-[var(--muted)]">Orders, payments and delivery updates, kept together.</p>
        </div>
        {orders.length > 0 && <p className="mt-6 shrink-0 text-sm text-[var(--muted)] sm:mt-0">{orders.length} {orders.length === 1 ? "order" : "orders"}</p>}
      </header>

      {orders.length ? (
        <ol className="divide-y divide-[var(--line-soft)]" aria-label="Order history">
          {orders.map((order) => {
            const itemCount = order.orderItems.reduce((total, item) => total + item.quantity, 0);

            return (
              <li key={order.id} className="py-7 sm:py-9">
                <article className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                      <h2 className="text-2xl font-bold tracking-[-0.04em] sm:text-3xl">{order.displayNumber}</h2>
                      <p className="border border-[var(--line)] px-2 py-1 text-xs font-bold uppercase tracking-[0.08em]">{humanizeOrderStatus(order.status)}</p>
                    </div>
                    <p className="mt-4 line-clamp-2 text-[var(--muted)]">
                      {order.orderItems.map((item) => `${item.quantity} x ${item.productName}`).join(", ")}
                    </p>
                    <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:flex sm:flex-wrap sm:gap-x-10">
                      <div>
                        <dt className="text-[var(--muted)]">Payment</dt>
                        <dd className="mt-1 font-semibold">{paymentSummary(order.status)}</dd>
                      </div>
                      <div>
                        <dt className="text-[var(--muted)]">Delivery</dt>
                        <dd className="mt-1 font-semibold">{deliverySummary(order.status)}</dd>
                      </div>
                      <div>
                        <dt className="text-[var(--muted)]">Placed</dt>
                        <dd className="mt-1 font-semibold"><time dateTime={order.createdAt.toISOString()}>{order.createdAt.toLocaleDateString()}</time></dd>
                      </div>
                      <div>
                        <dt className="text-[var(--muted)]">Items</dt>
                        <dd className="mt-1 font-semibold">{itemCount}</dd>
                      </div>
                    </dl>
                  </div>
                  <div className="flex items-center justify-between gap-5 border-t border-[var(--line-soft)] pt-5 md:block md:border-0 md:pt-0 md:text-right">
                    <p className="text-2xl font-bold tracking-[-0.03em]">{formatNpr(order.totalAmount)}</p>
                    <Link href={`/orders/${order.displayNumber}`} className="button-secondary md:mt-5">Open order</Link>
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      ) : (
        <section className="empty-state" aria-labelledby="empty-orders-title">
          <h2 id="empty-orders-title">No orders yet</h2>
          <p>Your first checkout will appear here.</p>
          <Link href="/products" className="button-primary">Browse the market</Link>
        </section>
      )}
    </main>
  );
}
