"use client";

import { useState } from "react";

export function PaymentForm({ url, fields }: { url: string; fields: Record<string, string> }) {
  const [pending, setPending] = useState(false);

  return (
    <form action={url} method="post" className="mt-8" onSubmit={() => setPending(true)} aria-busy={pending}>
      {Object.entries(fields).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
      <button type="submit" disabled={pending} className="button-primary w-full">{pending ? "Opening eSewa..." : "Continue to eSewa"}</button>
      <p role="status" aria-live="polite" className="mt-3 min-h-5 text-sm text-[var(--muted)]">{pending ? "Opening the secure eSewa payment page..." : ""}</p>
    </form>
  );
}
