"use server";

import { redirect } from "next/navigation";
import { formDataToAddress } from "@/lib/checkout";
import { createCheckout } from "@/lib/checkout-service";
import { getEsewaConfig } from "@/lib/esewa-gateway";
import requireUser from "@/lib/require-user";

export type CheckoutState = { message: string };

export async function submitCheckout(_state: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const userId = await requireUser();
  const address = formDataToAddress(formData);
  if ("error" in address) return { message: address.error };
  const token = formData.get("cartToken");
  if (typeof token !== "string") return { message: "Review your cart before checking out." };
  try {
    getEsewaConfig();
  } catch {
    return { message: "Payment is temporarily unavailable because the eSewa gateway is not configured." };
  }
  const result = await createCheckout(userId, address, token);
  if ("error" in result) return { message: result.error ?? "Checkout could not be started." };
  redirect(`/checkout/pay/${result.paymentId}`);
}
