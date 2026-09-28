import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomerOrder } from "@/lib/order-service";
import { humanizeOrderStatus } from "@/lib/orders";
import requireUser from "@/lib/require-user";
import { formatNpr } from "@/lib/storefront";
import { retryPayment } from "./action";
import { CancelOrderButton } from "./order-controls";

export default async function OrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ retry?: string }> }) {
  const userId = await requireUser();
  const { id } = await params;
  const order = await getCustomerOrder(userId, id);
  if (!order) notFound();
  const retryUnavailable = (await searchParams).retry === "unavailable";
  const canCancel = order.status === "PENDING" || order.status === "FAILED" || order.status === "PAID";
  const latestPayment = order.payments.at(-1)?.status;
  const paymentState = latestPayment === "SUCCESS" ? "Paid" : latestPayment ? humanizeOrderStatus(latestPayment) : "No payment attempt";
  return (
    <main className="shell py-12 sm:py-20">
      <Link href="/orders" className="utility-label">Back to orders</Link>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-5"><div><p className="utility-label text-[var(--vermilion)]">Order {order.displayNumber}</p><h1 className="mt-2 text-5xl font-bold tracking-[-0.06em] sm:text-7xl">{humanizeOrderStatus(order.status)}</h1></div><p className="text-3xl font-bold">{formatNpr(order.totalAmount)}</p></div>
      {retryUnavailable && <p role="status" className="mt-5 font-semibold text-[var(--vermilion)]">Price, activity, quantity, or stock changed. This payment cannot be retried.</p>}
      {order.status === "REFUND_PENDING" && <p role="status" className="mt-5 rounded-lg border-2 border-[var(--line)] bg-[var(--paper-deep)] p-4 font-semibold">Cancellation requested. A manual refund is pending confirmation; no refund has been claimed as complete.</p>}
      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section className="brutal-card p-6"><h2 className="text-3xl font-bold">Purchase snapshot</h2><ul className="mt-5 space-y-3">{order.orderItems.map((item) => <li key={item.id} className="flex justify-between gap-4"><span>{item.quantity} x {item.productName}<small className="block text-[var(--muted)]">{item.productMaker} · {item.productSku}</small></span><span>{formatNpr(item.priceAtPurchase.mul(item.quantity))}</span></li>)}</ul><dl className="mt-6 space-y-2 border-t-2 border-[var(--line)] pt-5"><div className="flex justify-between"><dt>Merchandise</dt><dd>{formatNpr(order.subtotalAmount)}</dd></div><div className="flex justify-between"><dt>Delivery</dt><dd>{formatNpr(order.deliveryFee)}</dd></div><div className="flex justify-between text-lg font-bold"><dt>Total</dt><dd>{formatNpr(order.totalAmount)}</dd></div></dl></section>
        <section className="brutal-card p-6"><h2 className="text-3xl font-bold">Delivery snapshot</h2><p className="mt-5">{order.recipientName}<br />{order.phone}<br />Ward {order.ward}, {order.municipality}<br />{order.district}, {order.province}<br />{order.streetAddress}{order.landmark ? <><br />Near {order.landmark}</> : null}</p><h3 className="utility-label mt-8">Payment state</h3><p className="mt-2 text-xl font-bold">{paymentState}</p>{order.status === "FAILED" && <form action={retryPayment} className="mt-6"><input type="hidden" name="orderId" value={order.id} /><button className="button-primary w-full">Retry payment</button></form>}{canCancel && <CancelOrderButton orderId={order.id} paid={order.status === "PAID"} />}</section>
      </div>
      <section className="mt-10"><h2 className="utility-label">Status timeline</h2><ol className="mt-4 space-y-3">{order.timeline.map((event) => <li key={event.id} className="border-l-2 border-[var(--line)] pl-4"><strong>{humanizeOrderStatus(event.type)}</strong><p>{event.detail}</p><time className="text-sm text-[var(--muted)]">{event.createdAt.toLocaleString()}</time></li>)}</ol></section>
    </main>
  );
}
