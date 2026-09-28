export default function CartLoading() {
  return (
    <main className="shell py-20" aria-live="polite" aria-busy="true">
      <p className="utility-label text-[var(--vermilion)]">Loading cart</p>
      <div className="brutal-card mt-8 h-48 animate-pulse" />
    </main>
  );
}
