import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import requireUser from "@/lib/require-user";
import { paymentRequestForAttempt } from "@/lib/esewa-gateway";
import { rupeesToPaisa } from "@/lib/checkout";
import { formatNpr } from "@/lib/storefront";

export default async function PaymentHandoffPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUser();
  const { id } = await params;
  const payment = await prisma.payment.findFirst({ where: { id, order: { userId } }, include: { order: true, reservation: true } });
  if (!payment) notFound();
  if (payment.status !== "PENDING" || !payment.reservation || payment.reservation.expiresAt <= new Date() || payment.reservation.releasedAt || payment.reservation.consumedAt) redirect(`/orders/${payment.orderId}`);
  const request = paymentRequestForAttempt({ transactionId: payment.transactionId, subtotalPaisa: rupeesToPaisa(payment.order.subtotalAmount), deliveryFeePaisa: rupeesToPaisa(payment.order.deliveryFee) });
  return (
    <main className="shell py-20"><section className="brutal-card mx-auto max-w-2xl p-8 text-center">
      <p className="utility-label text-[var(--vermilion)]">{payment.order.displayNumber}</p><h1 className="mt-3 text-5xl font-bold tracking-[-0.06em]">Inventory reserved.</h1>
      <p className="editorial mt-5 text-2xl">Pay {formatNpr(payment.amount)} through eSewa before {payment.reservation?.expiresAt.toLocaleTimeString()}.</p>
      <form action={request.url} method="post" className="mt-8">{Object.entries(request.fields).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}<button type="submit" className="button-primary w-full">Continue to eSewa</button></form>
      <p className="mt-4 text-sm text-[var(--muted)]">Your order is confirmed only after CHAUK verifies the transaction directly with eSewa.</p>
    </section></main>
  );
}
