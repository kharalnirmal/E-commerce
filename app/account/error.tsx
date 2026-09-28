"use client";

export default function AccountError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="shell py-12 sm:py-20">
      <section className="mx-auto max-w-2xl border-y border-[var(--line)] py-12 text-center" role="alert">
        <h1 className="text-4xl font-bold tracking-[-0.04em]">Your account could not be opened.</h1>
        <p className="mt-3 text-[var(--muted)]">Nothing was changed. Try loading it again.</p>
        <button type="button" onClick={retry} className="button-primary mt-6">Try again</button>
      </section>
    </main>
  );
}
