"use client";

export default function CartError({ reset }: { reset: () => void }) {
  return (
    <main className="shell py-20">
      <section className="brutal-card p-10 text-center" role="alert">
        <h1 className="text-4xl font-bold">The cart could not be opened.</h1>
        <p className="mt-3">Your items are still safe. Try loading them again.</p>
        <button type="button" onClick={reset} className="button-primary mt-6">Try again</button>
      </section>
    </main>
  );
}
