import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminOrder } from "@/lib/order-service";
import { humanizeOrderStatus } from "@/lib/orders";
import requireAdmin from "@/lib/require-admin";
import { formatNpr } from "@/lib/storefront";
import { FulfillmentButton, RefundButton } from "../order-controls";

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const order = await getAdminOrder((await params).id);
  if (!order) notFound();
  return (
    <main className="shell py-12 sm:py-20">
      <Link href="/admin/orders" className="utility-label">Back to order desk</Link>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-5"><div><p className="utility-label text-[var(--vermilion)]">{order.displayNumber}</p><h1 className="mt-2 text-5xl font-bold tracking-[-0.06em] sm:text-7xl">{humanizeOrderStatus(order.status)}</h1></div><p className="text-3xl font-bold">{formatNpr(order.totalAmount)}</p></div>
      <div className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <section className="brutal-card p-6"><h2 className="text-3xl font-bold">Immutable order record</h2><ul className="mt-5 space-y-4">{order.orderItems.map((item) => <li key={item.id} className="flex justify-between gap-4"><span><strong>{item.quantity} x {item.productName}</strong><small className="block text-[var(--muted)]">{item.productMaker} · {item.productSku}</small></span><span>{formatNpr(item.priceAtPurchase.mul(item.quantity))}</span></li>)}</ul><dl className="mt-6 space-y-2 border-t-2 border-[var(--line)] pt-5"><div className="flex justify-between"><dt>Merchandise</dt><dd>{formatNpr(order.subtotalAmount)}</dd></div><div className="flex justify-between"><dt>Delivery</dt><dd>{formatNpr(order.deliveryFee)}</dd></div><div className="flex justify-between font-bold"><dt>Total</dt><dd>{formatNpr(order.totalAmount)}</dd></div></dl></section>
        <aside className="space-y-6"><section className="brutal-card p-6"><h2 className="text-2xl font-bold">Customer & delivery</h2><p className="mt-4"><strong>{order.user.name}</strong><br />{order.user.email}</p><p className="mt-4">{order.recipientName}<br />{order.phone}<br />Ward {order.ward}, {order.municipality}<br />{order.district}, {order.province}<br />{order.streetAddress}{order.landmark ? <><br />Near {order.landmark}</> : null}</p></section><section className="brutal-card p-6"><h2 className="text-2xl font-bold">Next action</h2><div className="mt-5">{order.status === "PAID" ? <FulfillmentButton orderId={order.id} next="SHIPPED" /> : order.status === "SHIPPED" ? <FulfillmentButton orderId={order.id} next="DELIVERED" /> : order.status === "REFUND_PENDING" ? <RefundButton orderId={order.id} /> : <p className="text-[var(--muted)]">No administrative transition is available.</p>}</div></section></aside>
      </div>
      <section className="mt-10 grid gap-8 lg:grid-cols-2"><div><h2 className="utility-label">Payment audit</h2><ul className="mt-4 space-y-3">{order.payments.map((payment) => <li key={payment.id} className="brutal-card p-4"><strong>Attempt {payment.attemptNumber}: {humanizeOrderStatus(payment.status)}</strong><p className="text-sm text-[var(--muted)]">{payment.gateway} · {formatNpr(payment.amount)}</p><p className="text-sm">{payment.failureReason ?? (payment.refundedAt ? `Refund confirmed ${payment.refundedAt.toLocaleString()}` : payment.verifiedAt ? `Verified ${payment.verifiedAt.toLocaleString()}` : "Awaiting verification")}</p></li>)}</ul></div><div><h2 className="utility-label">Status timeline</h2><ol className="mt-4 space-y-3">{order.timeline.map((event) => <li key={event.id} className="border-l-2 border-[var(--line)] pl-4"><strong>{humanizeOrderStatus(event.type)}</strong><p>{event.detail}</p><time className="text-sm text-[var(--muted)]">{event.createdAt.toLocaleString()}</time></li>)}</ol></div></section>
    </main>
  );
}
