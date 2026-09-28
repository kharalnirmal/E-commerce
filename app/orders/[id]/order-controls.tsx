"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { cancelOrder } from "./action";

const initialState = { message: "" };

export function RetryPaymentButton() {
  const { pending } = useFormStatus();

  return (
    <>
      <button type="submit" className="button-primary w-full" disabled={pending} aria-describedby="retry-payment-status">
        {pending ? "Opening payment..." : "Retry payment"}
      </button>
      <span id="retry-payment-status" role="status" aria-live="polite" className="sr-only">
        {pending ? "Opening the secure payment page." : ""}
      </span>
    </>
  );
}

export function CheckPaymentButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="button-primary w-full" disabled={pending}>
      {pending ? "Checking eSewa..." : "Check payment status"}
    </button>
  );
}

export function CancelOrderButton({ orderId, mode }: { orderId: string; mode: "paid" | "unpaid" | null }) {
  const [state, action, pending] = useActionState(cancelOrder.bind(null, orderId), initialState);
  const statusRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (state.message) statusRef.current?.focus();
  }, [state.message]);

  if (!mode && !state.message) return null;

  return (
    <div className="mt-4">
      {mode && (
        <form action={action}>
          <button type="submit" className="button-secondary w-full" disabled={pending} aria-describedby="cancel-order-status">
            {pending ? "Submitting..." : mode === "paid" ? "Request cancellation" : "Cancel order"}
          </button>
        </form>
      )}
      <p
        ref={statusRef}
        tabIndex={state.message ? -1 : undefined}
        id="cancel-order-status"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={state.message ? "mt-4 border-l border-[var(--line)] pl-3 text-sm" : "sr-only"}
      >
        {state.message}
      </p>
    </div>
  );
}
