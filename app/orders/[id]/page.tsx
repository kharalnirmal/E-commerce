import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import requireUser from "@/lib/require-user";
import { formatNpr } from "@/lib/storefront";
import { retryPayment } from "./action";

export default async function OrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ retry?: string }> }) {
  const userId = await requireUser();
  const { id } = await params;
  const order = await prisma.order.findFirst({ where: { id, userId }, include: { orderItems: true, payments: { orderBy: { attemptNumber: "asc" } }, timeline: { orderBy: { createdAt: "asc" } } } });
  if (!order) notFound();
  const retryUnavailable = (await searchParams).retry === "unavailable";
  return <main className="shell py-12 sm:py-20"><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="utility-label text-[var(--vermilion)]">Order {order.displayNumber}</p><h1 className="mt-2 text-6xl font-bold tracking-[-0.07em]">{order.status}</h1></div><p className="text-3xl font-bold">{formatNpr(order.totalAmount)}</p></div>{retryUnavailable && <p role="status" className="mt-5 font-semibold text-[var(--vermilion)]">Price, activity, quantity, or stock changed. This payment cannot be retried.</p>}
    <div className="mt-10 grid gap-8 lg:grid-cols-2"><section className="brutal-card p-6"><h2 className="text-3xl font-bold">Purchase snapshot</h2><ul className="mt-5 space-y-3">{order.orderItems.map((item) => <li key={item.id} className="flex justify-between"><span>{item.quantity} x {item.productName}</span><span>{formatNpr(item.priceAtPurchase.mul(item.quantity))}</span></li>)}</ul><p className="mt-6 border-t-2 border-[var(--line)] pt-5">{order.recipientName}<br />{order.phone}<br />Ward {order.ward}, {order.municipality}<br />{order.district}, {order.province}<br />{order.streetAddress}{order.landmark ? <><br />Near {order.landmark}</> : null}</p></section>
      <section className="brutal-card p-6"><h2 className="text-3xl font-bold">Payment audit</h2><ul className="mt-5 space-y-4">{order.payments.map((payment) => <li key={payment.id}><strong>Attempt {payment.attemptNumber}: {payment.status}</strong><br /><span className="text-sm text-[var(--muted)]">{payment.gatewayTransactionCode ?? payment.failureReason ?? "Awaiting verification"}</span></li>)}</ul>{order.status === "FAILED" && <form action={retryPayment} className="mt-6"><input type="hidden" name="orderId" value={order.id} /><button className="button-primary w-full">Retry payment</button></form>}</section>
    </div><section className="mt-8"><h2 className="utility-label">Timeline</h2><ol className="mt-4 space-y-3">{order.timeline.map((event) => <li key={event.id} className="border-l-2 border-[var(--line)] pl-4"><strong>{event.type.replaceAll("_", " ")}</strong><p>{event.detail}</p><time className="text-sm text-[var(--muted)]">{event.createdAt.toLocaleString()}</time></li>)}</ol></section></main>;
}
