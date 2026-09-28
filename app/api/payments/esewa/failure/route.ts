import { abandonPayment } from "@/lib/checkout-service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const attempt = url.searchParams.get("attempt");
  const orderId = attempt ? await abandonPayment(attempt) : null;
  return Response.redirect(new URL(orderId ? `/orders/${orderId}?payment=failed` : "/cart", url.origin), 303);
}
