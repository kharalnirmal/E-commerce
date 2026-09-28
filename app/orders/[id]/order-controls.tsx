"use client";

import { useActionState } from "react";
import { cancelOrder } from "./action";

const initialState = { message: "" };

export function CancelOrderButton({ orderId, paid }: { orderId: string; paid: boolean }) {
  const [state, action, pending] = useActionState(cancelOrder.bind(null, orderId), initialState);
  return <form action={action} className="mt-6"><button className="button-secondary w-full" disabled={pending}>{pending ? "Submitting..." : paid ? "Request cancellation" : "Cancel order"}</button><p role="status" aria-live="polite" className="mt-3 text-sm">{state.message}</p></form>;
}
