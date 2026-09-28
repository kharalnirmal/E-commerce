import { completeVerifiedPayment } from "@/lib/checkout-service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const data = url.searchParams.get("data");
  if (!data) return new Response("Missing eSewa response.", { status: 400 });
  try {
    const orderId = await completeVerifiedPayment(data);
    return Response.redirect(new URL(`/orders/${orderId}?payment=success`, url.origin), 303);
  } catch {
    return Response.redirect(new URL("/cart?payment=verification-failed", url.origin), 303);
  }
}
