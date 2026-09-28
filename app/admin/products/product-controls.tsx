"use client";

import { useActionState } from "react";
import { adjustStock, toggleProductArchived } from "./action";

const initialState = { message: "" };

export function StockAdjustmentForm({ productId }: { productId: string }) {
  const [state, action, pending] = useActionState(adjustStock.bind(null, productId), initialState);
  return (
    <form action={action} className="brutal-card grid gap-3 p-5 sm:grid-cols-[10rem_1fr_auto] sm:items-end">
      <label className="grid gap-1">Signed amount<input name="delta" type="number" step="1" required placeholder="+5 or -2" className="min-h-11 rounded-lg border-2 border-[var(--line)] bg-[var(--paper)] px-3" /></label>
      <label className="grid gap-1">Reason<input name="reason" minLength={3} maxLength={240} required className="min-h-11 rounded-lg border-2 border-[var(--line)] bg-[var(--paper)] px-3" /></label>
      <button className="button-primary" disabled={pending}>{pending ? "Recording..." : "Adjust stock"}</button>
      <p role="status" className="sm:col-span-3">{state.message}</p>
    </form>
  );
}

export function ProductArchiveButton({ productId, archived }: { productId: string; archived: boolean }) {
  const [state, action, pending] = useActionState(toggleProductArchived.bind(null, productId, !archived), initialState);
  return <form action={action} className="text-right"><button type="submit" disabled={pending} className="button-secondary">{pending ? "Saving..." : archived ? "Restore product" : "Archive product"}</button><p role="status" className="mt-2">{state.message}</p></form>;
}
