import { completeVerifiedPayment } from "@/lib/checkout-service";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const data = url.searchParams.get("data");
  if (!data) return new Response("Missing eSewa response.", { status: 400 });
  try {
    const orderId = await completeVerifiedPayment(data);
    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, select: { displayNumber: true } });
    return Response.redirect(new URL(`/orders/${order.displayNumber}?payment=success`, url.origin), 303);
  } catch {
    return Response.redirect(new URL("/cart?payment=verification-failed", url.origin), 303);
  }
}
