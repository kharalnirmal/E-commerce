import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import requireUser from "@/lib/require-user";
import { paymentRequestForAttempt } from "@/lib/esewa-gateway";
import { rupeesToPaisa } from "@/lib/checkout";
import { formatNpr } from "@/lib/storefront";
import { PaymentForm } from "./payment-form";

export default async function PaymentHandoffPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUser();
  const { id } = await params;
  const payment = await prisma.payment.findFirst({ where: { id, order: { userId } }, include: { order: true, reservation: true } });
  if (!payment) notFound();
  if (payment.status !== "PENDING" || !payment.reservation || payment.reservation.expiresAt <= new Date() || payment.reservation.releasedAt || payment.reservation.consumedAt) redirect(`/orders/${payment.orderId}`);
  const request = paymentRequestForAttempt({ transactionId: payment.transactionId, subtotalPaisa: rupeesToPaisa(payment.order.subtotalAmount), deliveryFeePaisa: rupeesToPaisa(payment.order.deliveryFee) });
  const expiresAt = payment.reservation.expiresAt;
  return (
    <main className="shell py-12 sm:py-20">
      <section className="mx-auto max-w-2xl border-y border-[var(--line)] py-10 text-center" aria-labelledby="payment-title">
        <p className="utility-label">{payment.order.displayNumber}</p>
        <h1 id="payment-title" className="mt-4 text-5xl font-bold tracking-[-0.06em] sm:text-7xl">Inventory reserved.</h1>
        <p className="mt-6 text-2xl leading-tight">Pay {formatNpr(payment.amount)} through eSewa.</p>
        <div className="mx-auto mt-7 max-w-lg border-y border-[var(--line-soft)] py-5">
          <p className="font-semibold">Complete payment before <time dateTime={expiresAt.toISOString()}>{expiresAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</time>.</p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">After that time, this payment attempt closes and the stock is released. You can retry from the order page if inventory is still available.</p>
        </div>
        <PaymentForm url={request.url} fields={request.fields} />
        <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">Your order is confirmed only after CHOWK verifies the transaction directly with eSewa.</p>
      </section>
    </main>
  );
}
