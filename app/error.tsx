"use client";

export default function StorefrontError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="shell flex min-h-[60vh] items-center py-16">
      <div role="alert">
        <h1 className="text-5xl font-bold tracking-[-0.06em] sm:text-7xl">Page unavailable</h1>
        <p className="mt-4 max-w-xl text-[var(--muted)]">This page could not be loaded. Try the request again.</p>
        <button type="button" className="button-primary mt-7" onClick={retry}>Try again</button>
      </div>
    </main>
  );
}
