"use server";

import { redirect } from "next/navigation";
import { retryCheckout } from "@/lib/checkout-service";
import requireUser from "@/lib/require-user";

export async function retryPayment(formData: FormData) {
  const userId = await requireUser();
  const orderId = formData.get("orderId");
  if (typeof orderId !== "string") return;
  const result = await retryCheckout(userId, orderId);
  if ("error" in result) redirect(`/orders/${orderId}?retry=unavailable`);
  redirect(`/checkout/pay/${result.paymentId}`);
}
