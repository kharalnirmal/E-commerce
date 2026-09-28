import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomerOrder } from "@/lib/order-service";
import { humanizeOrderStatus } from "@/lib/orders";
import requireUser from "@/lib/require-user";
import { formatNpr } from "@/lib/storefront";
import { retryPayment } from "./action";
import { CancelOrderButton, RetryPaymentButton } from "./order-controls";
import { OrderNotice } from "./order-notice";

function deliveryMessage(status: string) {
  switch (status) {
    case "PAID":
      return "Payment is confirmed. Delivery has not started yet.";
    case "SHIPPED":
      return "Your order is on the way to this address.";
    case "DELIVERED":
      return "Your order was delivered to this address.";
    case "REFUND_PENDING":
      return "Delivery is stopped while the refund is reviewed.";
    case "REFUNDED":
      return "Delivery is closed and the payment was refunded.";
    case "CANCELLED":
      return "This order was cancelled before delivery.";
    default:
      return "Delivery starts after payment is confirmed.";
  }
}

function deliveryState(status: string) {
  if (status === "SHIPPED") return "On the way";
  if (status === "DELIVERED") return "Delivered";
  if (["CANCELLED", "REFUND_PENDING", "REFUNDED"].includes(status)) return "Not being delivered";
  return "Not yet shipped";
}

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ payment?: string; retry?: string }>;
}) {
  const userId = await requireUser();
  const { id } = await params;
  const order = await getCustomerOrder(userId, id);
  if (!order) notFound();

  const query = await searchParams;
  const retryUnavailable = query.retry === "unavailable";
  const cancelMode = order.status === "PAID" ? "paid" : order.status === "PENDING" || order.status === "FAILED" ? "unpaid" : null;
  const latestPayment = order.payments.at(-1);
  const paymentState = latestPayment?.status === "SUCCESS" ? "Paid" : latestPayment ? humanizeOrderStatus(latestPayment.status) : "No payment attempt";
  const paymentSucceeded = query.payment === "success"
    && latestPayment?.status === "SUCCESS"
    && ["PAID", "SHIPPED", "DELIVERED"].includes(order.status);
  const paymentFailed = query.payment === "failed"
    && order.status === "FAILED"
    && latestPayment?.status !== "SUCCESS";

  return (
    <main className="shell py-10 sm:py-16">
      <nav aria-label="Order breadcrumb">
        <Link href="/orders" className="text-action">Back to orders</Link>
      </nav>

      <header className="mt-8 border-b border-[var(--line)] pb-8 sm:mt-12 sm:pb-10">
        <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-5">
          <div>
            <p className="text-lg font-semibold text-[var(--muted)]">Order {order.displayNumber}</p>
            <h1 id="order-status-heading" tabIndex={-1} className="mt-2 text-5xl font-bold leading-[0.9] tracking-[-0.06em] sm:text-7xl">{humanizeOrderStatus(order.status)}</h1>
          </div>
          <p className="text-3xl font-bold tracking-[-0.04em] sm:text-4xl">{formatNpr(order.totalAmount)}</p>
        </div>
        <dl className="mt-7 flex flex-wrap gap-x-10 gap-y-4 text-sm">
          <div>
            <dt className="text-[var(--muted)]">Placed</dt>
            <dd className="mt-1 font-semibold"><time dateTime={order.createdAt.toISOString()}>{order.createdAt.toLocaleDateString()}</time></dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Payment</dt>
            <dd className="mt-1 font-semibold">{paymentState}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Delivery</dt>
            <dd className="mt-1 font-semibold">{deliveryState(order.status)}</dd>
          </div>
        </dl>
      </header>

      {retryUnavailable && <OrderNotice tone="error">Price, activity, quantity, or stock changed. This payment cannot be retried.</OrderNotice>}
      {paymentSucceeded && <OrderNotice>Payment confirmed. Your order is ready for delivery.</OrderNotice>}
      {paymentFailed && <OrderNotice tone="error">Payment was not completed. You can retry below.</OrderNotice>}
      {order.status === "REFUND_PENDING" && (
        <aside className="mt-6 border border-[var(--line)] bg-[var(--paper-deep)] p-5" aria-labelledby="refund-pending-title">
          <h2 id="refund-pending-title" className="text-xl font-bold">Refund pending</h2>
          <p className="mt-2 text-[var(--muted)]">Your cancellation request is recorded. A manual refund is still awaiting confirmation.</p>
        </aside>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] lg:gap-14">
        <section aria-labelledby="purchase-title">
          <div className="flex items-end justify-between gap-4 border-b border-[var(--line)] pb-4">
            <h2 id="purchase-title" className="text-3xl font-bold tracking-[-0.04em]">Purchase snapshot</h2>
            <p className="text-sm text-[var(--muted)]">{order.orderItems.reduce((total, item) => total + item.quantity, 0)} items</p>
          </div>
          <ul className="divide-y divide-[var(--line-soft)]">
            {order.orderItems.map((item) => (
              <li key={item.id} className="grid grid-cols-[1fr_auto] gap-5 py-5">
                <div>
                  <h3 className="font-semibold">{item.productName}</h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">{item.productMaker} · {item.productSku}</p>
                  <p className="mt-2 text-sm">{item.quantity} x {formatNpr(item.priceAtPurchase)}</p>
                </div>
                <p className="font-semibold">{formatNpr(item.priceAtPurchase.mul(item.quantity))}</p>
              </li>
            ))}
          </ul>
          <dl className="space-y-3 border-t border-[var(--line)] pt-5">
            <div className="flex justify-between gap-6"><dt className="text-[var(--muted)]">Merchandise</dt><dd>{formatNpr(order.subtotalAmount)}</dd></div>
            <div className="flex justify-between gap-6"><dt className="text-[var(--muted)]">Delivery</dt><dd>{formatNpr(order.deliveryFee)}</dd></div>
            <div className="flex justify-between gap-6 pt-2 text-xl font-bold"><dt>Total</dt><dd>{formatNpr(order.totalAmount)}</dd></div>
          </dl>
        </section>

        <div className="space-y-10">
          <section aria-labelledby="delivery-title">
            <h2 id="delivery-title" className="border-b border-[var(--line)] pb-4 text-3xl font-bold tracking-[-0.04em]">Delivery snapshot</h2>
            <p className="mt-5 font-semibold">{deliveryMessage(order.status)}</p>
            <address className="mt-4 not-italic leading-7 text-[var(--muted)]">
              <span className="text-[var(--ink)]">{order.recipientName}</span><br />
              <a href={`tel:${order.phone}`} className="underline decoration-[var(--line-soft)] underline-offset-4">{order.phone}</a><br />
              {order.streetAddress}<br />
              Ward {order.ward}, {order.municipality}<br />
              {order.district}, {order.province}
              {order.landmark ? <><br />Near {order.landmark}</> : null}
            </address>
          </section>

          <section aria-labelledby="payment-title" className="border border-[var(--line-soft)] bg-[var(--surface)] p-5 sm:p-6">
            <h2 id="payment-title" className="text-2xl font-bold tracking-[-0.03em]">Payment state</h2>
            <p className="mt-3 text-xl font-bold">{paymentState}</p>
            {latestPayment && (
              <p className="mt-2 text-sm text-[var(--muted)]">
                {latestPayment.gateway} attempt {latestPayment.attemptNumber} of {order.payments.length}
                {latestPayment.failureReason ? ` · ${latestPayment.failureReason}` : ""}
              </p>
            )}
            {order.status === "FAILED" && (
              <form action={retryPayment} className="mt-6">
                <input type="hidden" name="orderId" value={order.id} />
                <RetryPaymentButton />
              </form>
            )}
            {cancelMode && <p className="mt-5 text-sm text-[var(--muted)]">{cancelMode === "paid" ? "Cancellation starts a manual refund. Delivery will stop." : "Cancelling releases reserved stock and closes this order."}</p>}
            <CancelOrderButton orderId={order.id} mode={cancelMode} />
          </section>
        </div>
      </div>

      <section className="mt-14 border-t border-[var(--line)] pt-8 sm:mt-20" aria-labelledby="timeline-title">
        <div className="sm:flex sm:items-end sm:justify-between sm:gap-6">
          <h2 id="timeline-title" className="text-3xl font-bold tracking-[-0.04em]">Status timeline</h2>
          <p className="mt-2 text-sm text-[var(--muted)] sm:mt-0">Oldest to newest</p>
        </div>
        {order.timeline.length ? (
          <ol className="mt-7 grid gap-0">
            {order.timeline.map((event, index) => (
              <li key={event.id} className="relative grid grid-cols-[2rem_1fr] gap-4 pb-7 last:pb-0">
                {index < order.timeline.length - 1 && <span className="absolute bottom-0 left-[0.46rem] top-4 border-l border-[var(--line-soft)]" aria-hidden="true" />}
                <span className="relative mt-1 block h-4 w-4 border border-[var(--line)] bg-[var(--paper)]" aria-hidden="true" />
                <div>
                  <h3 className="font-bold">{humanizeOrderStatus(event.type)}</h3>
                  <p className="mt-1 text-[var(--muted)]">{event.detail}</p>
                  <time dateTime={event.createdAt.toISOString()} className="mt-2 block text-sm text-[var(--muted)]">{event.createdAt.toLocaleString()}</time>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-6 text-[var(--muted)]">Updates will appear here as this order moves forward.</p>
        )}
      </section>
    </main>
  );
}
