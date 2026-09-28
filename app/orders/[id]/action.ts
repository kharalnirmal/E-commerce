"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { retryCheckout } from "@/lib/checkout-service";
import { cancelCustomerOrder } from "@/lib/order-service";
import requireUser from "@/lib/require-user";

type State = { message: string };

export async function cancelOrder(orderId: string, _previousState: State): Promise<State> {
  void _previousState;
  const userId = await requireUser();
  const result = await cancelCustomerOrder(userId, orderId);
  if ("error" in result) return { message: result.error ?? "Order could not be cancelled." };
  revalidatePath("/orders");
  revalidatePath(`/orders/${result.displayNumber}`);
  if (!result.changed) return { message: result.status === "REFUND_PENDING" ? "This cancellation request is already awaiting a manual refund." : `This order is already ${result.status.toLowerCase()}.` };
  return { message: result.status === "REFUND_PENDING" ? "Cancellation requested. Your manual refund is pending." : "Order cancelled and reserved stock released." };
}

export async function retryPayment(formData: FormData) {
  const userId = await requireUser();
  const orderId = formData.get("orderId");
  if (typeof orderId !== "string") return;
  const result = await retryCheckout(userId, orderId);
  if ("error" in result) redirect(`/orders/${orderId}?retry=unavailable`);
  redirect(`/checkout/pay/${result.paymentId}`);
}
