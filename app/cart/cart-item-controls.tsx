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
  const pending = updatePending || removePending;

  return (
    <div className="grid gap-3 sm:justify-items-end">
      {available && <form action={updateAction} className="flex flex-wrap items-end gap-3" aria-busy={updatePending}>
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
            disabled={pending}
            className="field-control w-24"
          />
        </label>
        <button type="submit" disabled={pending} className="button-secondary">
          {updatePending ? "Updating..." : "Update"}
        </button>
      </form>}
      <form action={removeAction} aria-busy={removePending}>
        <input type="hidden" name="itemId" value={itemId} />
        <button type="submit" disabled={pending} className="text-action">
          {removePending ? "Removing..." : "Remove"}
        </button>
      </form>
      <p role="status" aria-live="polite" aria-atomic="true" className="min-h-5 text-sm text-[var(--muted)]">
        {updatePending ? "Updating quantity..." : removePending ? "Removing item..." : updateState.message || removeState.message}
      </p>
    </div>
  );
}
