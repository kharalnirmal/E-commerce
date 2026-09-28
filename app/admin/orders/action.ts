"use server";

import { revalidatePath } from "next/cache";
import { confirmManualRefund, updateFulfillment } from "@/lib/order-service";
import requireAdmin from "@/lib/require-admin";

type State = { message: string };

function revalidateOrder(orderId: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/orders/[id]", "page");
}

export async function changeFulfillment(orderId: string, requested: string, _previousState: State): Promise<State> {
  void _previousState;
  await requireAdmin();
  if (requested !== "SHIPPED" && requested !== "DELIVERED") return { message: "Choose a valid fulfillment state." };
  const result = await updateFulfillment(orderId, requested);
  if ("error" in result) return { message: result.error ?? "Fulfillment could not be updated." };
  revalidateOrder(orderId);
  return { message: `Order marked ${result.status.toLowerCase()}.` };
}

export async function confirmRefund(orderId: string, _previousState: State): Promise<State> {
  void _previousState;
  const administrator = await requireAdmin();
  const result = await confirmManualRefund(orderId, administrator.id, administrator.name);
  if ("error" in result) return { message: result.error ?? "Refund could not be confirmed." };
  revalidateOrder(orderId);
  return { message: result.changed ? "Manual refund confirmed and inventory restored." : "This refund was already confirmed." };
}
