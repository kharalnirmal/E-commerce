export default function StorefrontLoading() {
  return (
    <main className="shell flex min-h-[60vh] items-center py-16" aria-busy="true">
      <div>
        <h1 className="text-5xl font-bold tracking-[-0.06em] sm:text-7xl">Loading</h1>
        <p className="mt-4 text-[var(--muted)]" role="status" aria-live="polite">Loading the storefront...</p>
      </div>
    </main>
  );
}
