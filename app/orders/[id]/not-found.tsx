import Link from "next/link";

export default function OrderNotFound() {
  return (
    <main className="shell py-16 sm:py-24">
      <section className="border-y border-[var(--line)] py-12 text-center">
        <h1 className="text-4xl font-bold tracking-[-0.05em] sm:text-6xl">Order not found</h1>
        <p className="mx-auto mt-4 max-w-md text-[var(--muted)]">This order is unavailable or does not belong to this account.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/orders" className="button-primary">Back to orders</Link>
          <Link href="/products" className="button-secondary">Browse the market</Link>
        </div>
      </section>
    </main>
  );
}
