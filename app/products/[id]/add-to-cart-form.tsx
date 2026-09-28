"use client";

import { useActionState } from "react";
import { addToCart } from "@/app/cart/action";

const initialState = { message: "" };

export default function AddToCartForm({
  productId,
  stock,
}: {
  productId: string;
  stock: number;
}) {
  const [state, formAction, isPending] = useActionState(
    addToCart,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="productId" value={productId} />

      <label className="utility-label flex items-center justify-between gap-4">
        Quantity
        <input
          type="number"
          name="quantity"
          min="1"
          max={Math.min(stock, 99)}
          defaultValue="1"
          required
          className="min-h-11 w-20 rounded-lg border-2 border-[var(--line)] bg-[var(--paper)] px-2 text-base"
        />
      </label>

      <button type="submit" disabled={isPending || stock < 1} className="button-primary w-full">
        {stock < 1 ? "Out of stock" : isPending ? "Adding..." : "Add to cart"}
      </button>

      <p role="status" className="min-h-5 text-sm">{state.message}</p>
    </form>
  );
}
