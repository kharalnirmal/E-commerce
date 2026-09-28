export default function CartLoading() {
  return (
    <main className="shell py-12 sm:py-20" aria-busy="true">
      <div className="border-b border-[var(--line-soft)] pb-8">
        <h1 className="text-6xl font-bold tracking-[-0.07em] sm:text-8xl">Cart</h1>
      </div>
      <p role="status" aria-live="polite" className="mt-8 border-y border-[var(--line-soft)] py-8">Loading your cart...</p>
    </main>
  );
}
