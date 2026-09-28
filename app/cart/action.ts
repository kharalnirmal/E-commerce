"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import requireUser from "@/lib/require-user";
import { auth } from "@/lib/auth";
import { parseCartQuantity } from "@/lib/cart";
import {
  addCartItem,
  removeCartItemForUser,
  updateCartItem,
} from "@/lib/cart-service";

type State = { message: string };
export type CartActionState = {
  status: "idle" | "success" | "auth-required" | "error";
  message: string;
};

export async function quickAddToCart(
  _previousState: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user.id) {
    return { status: "auth-required", message: "Sign in to add this item." };
  }

  const productIdValue = formData.get("productId");
  const productId = typeof productIdValue === "string" ? productIdValue : "";
  const quantity = parseCartQuantity(formData.get("quantity"));
  if (!productId || quantity === null) {
    return { status: "error", message: "Choose a valid product and quantity." };
  }

  try {
    const message = await addCartItem(session.user.id, productId, quantity);
    const status = message === "Added to cart." ? "success" : "error";
    revalidatePath("/cart");
    return { status, message };
  } catch {
    return { status: "error", message: "This item could not be added. Try again." };
  }
}

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
