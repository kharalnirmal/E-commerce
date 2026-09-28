"use server";

import { revalidatePath } from "next/cache";
import requireUser from "@/lib/require-user";
import { parseCartQuantity } from "@/lib/cart";
import {
  addCartItem,
  removeCartItemForUser,
  updateCartItem,
} from "@/lib/cart-service";

type State = { message: string };

export async function addToCart(
  _previousState: State,
  formData: FormData,
): Promise<State> {
  const userId = await requireUser();

  const productIdValue = formData.get("productId");
  const productId = typeof productIdValue === "string" ? productIdValue : "";
  const quantity = parseCartQuantity(formData.get("quantity"));
  if (!productId || quantity === null) {
    return { message: "Choose a valid product and quantity." };
  }

  const message = await addCartItem(userId, productId, quantity);
  revalidatePath("/cart");
  return { message };
}

export async function updateCartQuantity(
  _previousState: State,
  formData: FormData,
): Promise<State> {
  const userId = await requireUser();

  const itemId = formData.get("itemId");
  const quantity = parseCartQuantity(formData.get("quantity"));
  if (typeof itemId !== "string" || quantity === null) {
    return { message: "Quantity must be a whole number between 1 and 99." };
  }

  const message = await updateCartItem(userId, itemId, quantity);
  revalidatePath("/cart");
  return { message };
}

export async function removeCartItem(
  _previousState: State,
  formData: FormData,
): Promise<State> {
  const userId = await requireUser();
  const itemId = formData.get("itemId");

  if (typeof itemId !== "string") {
    return { message: "Choose a valid cart item." };
  }

  const message = await removeCartItemForUser(userId, itemId);
  revalidatePath("/cart");
  return { message };
}
