export default function OrdersLoading() {
  return (
    <main className="shell py-12 sm:py-20" aria-busy="true">
      <header className="border-b border-[var(--line)] pb-8">
        <h1 className="text-6xl font-bold leading-[0.88] tracking-[-0.07em] sm:text-8xl">Orders</h1>
        <p className="mt-5 text-lg text-[var(--muted)]">Loading your order history...</p>
      </header>
      <p className="sr-only" role="status" aria-live="polite">Loading your order history...</p>
      <div className="divide-y divide-[var(--line-soft)]" aria-hidden="true">
        {[0, 1, 2].map((item) => (
          <div key={item} className="grid animate-pulse gap-5 py-8 sm:grid-cols-[1fr_10rem]">
            <div>
              <div className="h-8 w-56 bg-[var(--surface-muted)]" />
              <div className="mt-5 h-4 max-w-xl bg-[var(--surface-muted)]" />
              <div className="mt-6 h-10 max-w-lg bg-[var(--surface-muted)]" />
            </div>
            <div className="h-12 bg-[var(--surface-muted)]" />
          </div>
        ))}
      </div>
    </main>
  );
}
