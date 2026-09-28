"use client";

import Link from "next/link";

export default function CheckoutError({ retry }: { retry: () => void }) {
  return (
    <main className="shell py-12 sm:py-20">
      <section className="mx-auto max-w-2xl border-y border-[var(--line)] py-12 text-center" role="alert">
        <h1 className="text-4xl font-bold tracking-[-0.04em]">Checkout could not be loaded.</h1>
        <p className="mt-3 text-[var(--muted)]">Your cart and any existing order are unchanged. Try again or return to your cart.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={retry} className="button-primary">Try again</button>
          <Link href="/cart" className="button-secondary">Return to cart</Link>
        </div>
      </section>
    </main>
  );
}
