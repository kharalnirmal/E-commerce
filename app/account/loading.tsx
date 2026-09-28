export default function AccountLoading() {
  return (
    <main className="shell py-12 sm:py-20" aria-busy="true">
      <section className="border-y border-[var(--line-soft)] py-10">
        <h1 className="text-6xl font-semibold tracking-[-0.07em] sm:text-8xl">Account</h1>
        <p role="status" aria-live="polite" className="mt-8 text-[var(--muted)]">Loading your account...</p>
      </section>
    </main>
  );
}
