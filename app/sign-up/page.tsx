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
    <main className="shell grid min-h-[70vh] place-items-center py-16">
      <section className="brutal-card w-full max-w-lg p-6 sm:p-10">
      <p className="utility-label text-[var(--vermilion)]">Join the market</p>
      <h1 className="mt-2 text-5xl font-bold tracking-[-0.06em]">Create an account</h1>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-3">
        <label htmlFor="name" className="utility-label">Name</label>
        <input id="name" name="name" required className="min-h-12 rounded-lg border-2 border-[var(--line)] bg-[var(--paper)] px-3" />

        <label htmlFor="email" className="utility-label mt-2">Email</label>
        <input id="email" name="email" type="email" required className="min-h-12 rounded-lg border-2 border-[var(--line)] bg-[var(--paper)] px-3" />

        <label htmlFor="password" className="utility-label mt-2">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          minLength={8}
          required
          className="min-h-12 rounded-lg border-2 border-[var(--line)] bg-[var(--paper)] px-3"
        />

        {error && <p role="alert">{error}</p>}
        <button disabled={pending} className="button-primary mt-3">
          {pending ? "Creating account..." : "Sign up"}
        </button>
      </form>
      <p className="mt-6 text-sm">Already a member? <Link href="/sign-in" className="font-bold underline">Sign in</Link>.</p>
      </section>
    </main>
  );
}
