import { reconcileReturnedPayment } from "@/lib/checkout-service";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const attempt = url.searchParams.get("attempt");
  const result = attempt ? await reconcileReturnedPayment(attempt) : null;
  const orderId = result?.orderId ?? null;
  const order = orderId ? await prisma.order.findUnique({ where: { id: orderId }, select: { displayNumber: true } }) : null;
  return Response.redirect(new URL(order ? `/orders/${order.displayNumber}?payment=${result?.outcome ?? "pending"}` : "/cart?payment=verification-failed", url.origin), 303);
}
