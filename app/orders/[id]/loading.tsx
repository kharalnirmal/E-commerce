export default function OrderLoading() {
  return (
    <main className="shell py-10 sm:py-16" aria-busy="true">
      <p className="text-action">Back to orders</p>
      <header className="mt-8 border-b border-[var(--line)] pb-10 sm:mt-12">
        <div className="h-6 w-44 animate-pulse bg-[var(--surface-muted)]" aria-hidden="true" />
        <div className="mt-4 h-16 max-w-md animate-pulse bg-[var(--surface-muted)] sm:h-20" aria-hidden="true" />
        <p className="sr-only" role="status" aria-live="polite">Loading order details...</p>
      </header>
      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] lg:gap-14" aria-hidden="true">
        <div className="h-96 animate-pulse bg-[var(--surface-muted)]" />
        <div className="h-80 animate-pulse bg-[var(--surface-muted)]" />
      </div>
    </main>
  );
}
