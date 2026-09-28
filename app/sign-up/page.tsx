"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/auth-client";
import Link from "next/link";

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    const form = new FormData(event.currentTarget);

    try {
      const result = await signUp.email({
        name: String(form.get("name") ?? "").trim(),
        email: String(form.get("email") ?? "").trim(),
        password: String(form.get("password") ?? ""),
      });

      if (result.error) {
        setError(result.error.message ?? "Could not create your account.");
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
    <main className="shell grid min-h-[72vh] items-center py-12 sm:py-20">
      <section className="grid border-y border-[var(--line-soft)] lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex min-h-56 flex-col justify-between py-8 lg:min-h-[38rem] lg:border-r lg:border-[var(--line-soft)] lg:py-10 lg:pr-12">
          <h1 className="max-w-3xl text-6xl font-semibold leading-[0.88] tracking-[-0.075em] sm:text-8xl">Create an account</h1>
          <p className="mt-12 max-w-sm text-lg leading-7 text-[var(--muted)]">Keep your cart and follow every order.</p>
        </div>

        <div className="py-8 lg:px-12 lg:py-10">
          <form onSubmit={handleSubmit} aria-busy={pending} className="grid gap-5">
            <label htmlFor="name" className="grid gap-2">
              <span className="field-label">Name</span>
              <input id="name" name="name" autoComplete="name" required className="field-control w-full" />
            </label>

            <label htmlFor="email" className="grid gap-2">
              <span className="field-label">Email</span>
              <input id="email" name="email" type="email" autoComplete="email" required className="field-control w-full" />
            </label>

            <label htmlFor="password" className="grid gap-2">
              <span className="field-label">Password</span>
              <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} aria-describedby="password-hint" required className="field-control w-full" />
              <span id="password-hint" className="text-sm text-[var(--muted)]">Use at least 8 characters.</span>
            </label>

            <div className="min-h-6 text-sm" aria-live="polite" aria-atomic="true">
              {pending && <p role="status">Creating your account...</p>}
              {error && <p role="alert">{error}</p>}
            </div>
            <button type="submit" disabled={pending} className="button-primary w-full">
              Create account
            </button>
          </form>
          <p className="mt-7 border-t border-[var(--line-soft)] pt-6 text-sm">Already have an account? <Link href="/sign-in" className="font-bold underline underline-offset-4">Sign in</Link>.</p>
        </div>
      </section>
    </main>
  );
}
