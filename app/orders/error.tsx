"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

export default function OrdersError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <main className="shell py-16 sm:py-24">
      <section className="border-y border-[var(--line)] py-12 text-center" role="alert" aria-labelledby="orders-error-title">
        <h1 ref={headingRef} tabIndex={-1} id="orders-error-title" className="text-4xl font-bold tracking-[-0.05em] sm:text-6xl">Orders could not be opened.</h1>
        <p className="mx-auto mt-4 max-w-md text-[var(--muted)]">Your order data is safe. Try loading it again.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={retry} className="button-primary">Try again</button>
          <Link href="/account" className="button-secondary">Back to account</Link>
        </div>
      </section>
    </main>
  );
}
