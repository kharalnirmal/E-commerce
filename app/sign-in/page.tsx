"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import Link from "next/link";

export default function SignInPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    const form = new FormData(event.currentTarget);

    try {
      const result = await signIn.email({
        email: String(form.get("email") ?? "").trim(),
        password: String(form.get("password") ?? ""),
      });

      if (result.error) {
        setError(result.error.message ?? "Could not sign in.");
        return;
      }

      router.replace("/account");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="shell grid min-h-[70vh] place-items-center py-16">
      <section className="brutal-card w-full max-w-lg p-6 sm:p-10">
      <p className="utility-label text-[var(--vermilion)]">Welcome back</p>
      <h1 className="mt-2 text-5xl font-bold tracking-[-0.06em]">Sign in</h1>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-3">
        <label htmlFor="email" className="utility-label">Email</label>
        <input id="email" name="email" type="email" required className="min-h-12 rounded-lg border-2 border-[var(--line)] bg-[var(--paper)] px-3" />

        <label htmlFor="password" className="utility-label mt-2">Password</label>
        <input id="password" name="password" type="password" required className="min-h-12 rounded-lg border-2 border-[var(--line)] bg-[var(--paper)] px-3" />

        {error && <p role="alert">{error}</p>}
        <button disabled={pending} className="button-primary mt-3">
          {pending ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <p className="mt-6 text-sm">New to CHAUK? <Link href="/sign-up" className="font-bold underline">Create an account</Link>.</p>
      </section>
    </main>
  );
}
