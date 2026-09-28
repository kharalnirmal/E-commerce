import Link from "next/link";

export default function NotFound() {
  return (
    <main className="shell flex min-h-[65vh] flex-col items-center justify-center py-20 text-center">
      <h1 className="mt-5 text-6xl font-bold tracking-[-0.07em] sm:text-8xl">Page not found</h1>
      <p className="mt-6 max-w-xl text-xl text-[var(--muted)]">The page may have moved or is no longer available.</p>
      <Link href="/products" className="button-primary mt-9">Return to the shop</Link>
    </main>
  );
}
