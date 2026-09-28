"use client";

import { useActionState } from "react";
import { submitCheckout } from "./action";

const fields = [
  ["recipientName", "Recipient name", "text", "name"],
  ["phone", "Nepal mobile number", "tel", "tel"],
  ["province", "Province", "text", "address-level1"],
  ["district", "District", "text", "address-level2"],
  ["municipality", "Municipality", "text", "address-level3"],
  ["ward", "Ward", "number", "address-level4"],
  ["streetAddress", "Street address", "text", "street-address"],
] as const;

export function CheckoutForm({ cartToken }: { cartToken: string }) {
  const [state, action, pending] = useActionState(submitCheckout, { message: "" });
  return (
    <form action={action} className="border-y border-[var(--line)] py-8" aria-busy={pending}>
      <input type="hidden" name="cartToken" value={cartToken} />
      <fieldset>
        <legend className="text-3xl font-bold tracking-[-0.04em]">Delivery address</legend>
        <p className="mt-2 text-sm text-[var(--muted)]">All fields are required unless marked optional.</p>
        <div className="mt-7 grid gap-5 sm:grid-cols-2">
          {fields.map(([name, label, type, autoComplete]) => (
            <label key={name} htmlFor={name} className={`grid gap-2 ${name === "streetAddress" ? "sm:col-span-2" : ""}`}>
              <span className="field-label">{label}</span>
              <input id={name} name={name} type={type} autoComplete={autoComplete} required maxLength={160} min={name === "ward" ? 1 : undefined} max={name === "ward" ? 35 : undefined} inputMode={name === "phone" || name === "ward" ? "numeric" : undefined} className="field-control" />
            </label>
          ))}
          <label htmlFor="landmark" className="grid gap-2 sm:col-span-2">
            <span className="field-label">Landmark (optional)</span>
            <input id="landmark" name="landmark" type="text" autoComplete="off" maxLength={160} className="field-control" />
          </label>
        </div>
      </fieldset>
      <div className="mt-8 border-t border-[var(--line-soft)] pt-6">
        <p className="mb-4 text-sm leading-relaxed text-[var(--muted)]">Continuing creates the order and holds its inventory for ten minutes while you pay through eSewa.</p>
        <button type="submit" disabled={pending} className="button-primary w-full">{pending ? "Reserving inventory..." : "Reserve and continue to eSewa"}</button>
        <p role="status" aria-live="polite" aria-atomic="true" className={`mt-3 min-h-6 text-sm font-semibold ${state.message ? "text-[var(--ink)]" : "text-[var(--muted)]"}`}>
          {pending ? "Checking current prices and stock..." : state.message}
        </p>
      </div>
    </form>
  );
}
