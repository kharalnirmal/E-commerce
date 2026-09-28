import { abandonPayment } from "@/lib/checkout-service";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const attempt = url.searchParams.get("attempt");
  const orderId = attempt ? await abandonPayment(attempt) : null;
  const order = orderId ? await prisma.order.findUnique({ where: { id: orderId }, select: { displayNumber: true } }) : null;
  return Response.redirect(new URL(order ? `/orders/${order.displayNumber}?payment=failed` : "/cart", url.origin), 303);
}
