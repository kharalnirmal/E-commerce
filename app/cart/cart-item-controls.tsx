"use client";

import { useActionState } from "react";
import { removeCartItem, updateCartQuantity } from "./action";

const initialState = { message: "" };

export function CartItemControls({
  itemId,
  quantity,
  maximum,
  available = true,
}: {
  itemId: string;
  quantity: number;
  maximum: number;
  available?: boolean;
}) {
  const [updateState, updateAction, updatePending] = useActionState(
    updateCartQuantity,
    initialState,
  );
  const [removeState, removeAction, removePending] = useActionState(
    removeCartItem,
    initialState,
  );

  return (
    <div className="grid gap-3">
      {available && <form action={updateAction} className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="itemId" value={itemId} />
        <label className="grid gap-2">
          <span className="utility-label">Quantity</span>
          <input
            aria-label="Quantity"
            type="number"
            name="quantity"
            min="1"
            max={maximum}
            defaultValue={quantity}
            required
            className="min-h-11 w-24 rounded-lg border-2 border-[var(--line)] bg-[var(--paper)] px-3"
          />
        </label>
        <button type="submit" disabled={updatePending} className="button-secondary">
          {updatePending ? "Updating..." : "Update"}
        </button>
      </form>}
      <form action={removeAction}>
        <input type="hidden" name="itemId" value={itemId} />
        <button type="submit" disabled={removePending} className="utility-label underline">
          {removePending ? "Removing..." : "Remove"}
        </button>
      </form>
      <p role="status" aria-live="polite" className="min-h-5 text-sm">
        {updateState.message || removeState.message}
      </p>
    </div>
  );
}
