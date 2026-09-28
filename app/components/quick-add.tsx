"use client";

import { useActionState } from "react";
import { quickAddToCart, type CartActionState } from "@/app/cart/action";

const initialState: CartActionState = { status: "idle", message: "" };

export function QuickAdd({ productId, productName, stock }: { productId: string; productName: string; stock: number }) {
  const [state, action, pending] = useActionState(quickAddToCart, initialState);

  return (
    <form action={action} className="quick-add">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="quantity" value="1" />
      <button
        type="submit"
        className="quick-add-button"
        disabled={pending || stock < 1}
        aria-label={stock < 1 ? `${productName} is sold out` : `Quick add ${productName} to cart`}
      >
        {stock < 1 ? "Sold out" : pending ? "Adding..." : "Quick add"}
      </button>
      <p role="status" className={`quick-add-status quick-add-status-${state.status}`}>{state.message}</p>
    </form>
  );
}
