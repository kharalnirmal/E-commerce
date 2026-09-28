import { completeVerifiedPayment } from "@/lib/checkout-service";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const data = url.searchParams.get("data");
  const attempt = url.searchParams.get("attempt");
  if (!data) return new Response("Missing eSewa response.", { status: 400 });
  let orderId: string | null = null;
  let outcome = "verification-failed";
  try {
    const result = await completeVerifiedPayment(data);
    orderId = result.orderId;
    outcome = result.outcome;
  } catch {
    if (attempt) {
      const payment = await prisma.payment.findUnique({ where: { transactionId: attempt }, select: { orderId: true } });
      orderId = payment?.orderId ?? null;
    }
  }
  const order = orderId ? await prisma.order.findUnique({ where: { id: orderId }, select: { displayNumber: true } }) : null;
  const destination = order ? `/orders/${order.displayNumber}?payment=${outcome}` : "/cart?payment=verification-failed";
  return Response.redirect(new URL(destination, url.origin), 303);
}
