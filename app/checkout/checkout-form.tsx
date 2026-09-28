"use client";

import { useActionState } from "react";
import { submitCheckout } from "./action";

const fields = [
  ["recipientName", "Recipient name", "text", "Suraj Kharal"],
  ["phone", "Nepal mobile number", "tel", "9841234567"],
  ["province", "Province", "text", "Bagmati"],
  ["district", "District", "text", "Kathmandu"],
  ["municipality", "Municipality", "text", "Kathmandu Metropolitan City"],
  ["ward", "Ward", "number", "10"],
  ["streetAddress", "Street address", "text", "New Baneshwor"],
] as const;

export function CheckoutForm({ cartToken }: { cartToken: string }) {
  const [state, action, pending] = useActionState(submitCheckout, { message: "" });
  return (
    <form action={action} className="brutal-card grid gap-5 p-6 sm:grid-cols-2">
      <input type="hidden" name="cartToken" value={cartToken} />
      {fields.map(([name, label, type, placeholder]) => (
        <label key={name} className="grid gap-2">
          <span className="utility-label">{label}</span>
          <input name={name} type={type} placeholder={placeholder} required maxLength={160} min={name === "ward" ? 1 : undefined} max={name === "ward" ? 35 : undefined} className="min-h-12 rounded-lg border-2 border-[var(--line)] bg-[var(--paper)] px-3" />
        </label>
      ))}
      <label className="grid gap-2 sm:col-span-2">
        <span className="utility-label">Landmark (optional)</span>
        <input name="landmark" type="text" maxLength={160} className="min-h-12 rounded-lg border-2 border-[var(--line)] bg-[var(--paper)] px-3" />
      </label>
      <div className="sm:col-span-2">
        <button type="submit" disabled={pending} className="button-primary w-full">{pending ? "Reserving inventory..." : "Reserve and continue to eSewa"}</button>
        {state.message && <p role="status" className="mt-3 font-semibold text-[var(--vermilion)]">{state.message}</p>}
      </div>
    </form>
  );
}
