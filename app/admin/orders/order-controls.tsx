"use client";

import { useActionState } from "react";
import { changeFulfillment, confirmRefund } from "./action";

const initialState = { message: "" };

export function FulfillmentButton({ orderId, next }: { orderId: string; next: "SHIPPED" | "DELIVERED" }) {
  const [state, action, pending] = useActionState(changeFulfillment.bind(null, orderId, next), initialState);
  return <form action={action}><button className="button-primary w-full" disabled={pending}>{pending ? "Saving..." : next === "SHIPPED" ? "Mark shipped" : "Mark delivered"}</button><p role="status" aria-live="polite" className="mt-2 text-sm">{state.message}</p></form>;
}

export function RefundButton({ orderId }: { orderId: string }) {
  const [state, action, pending] = useActionState(confirmRefund.bind(null, orderId), initialState);
  return <form action={action}><button className="button-primary w-full" disabled={pending}>{pending ? "Confirming..." : "Confirm manual refund"}</button><p role="status" aria-live="polite" className="mt-2 text-sm">{state.message}</p></form>;
}
