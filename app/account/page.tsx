import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SignOutButton } from "./sign-out-button";

export default async function AccountPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  return (
    <main className="shell py-12 sm:py-20">
      <section className="border-y border-[var(--line-soft)] py-8 sm:py-12">
        <h1 className="max-w-4xl text-6xl font-semibold leading-[0.9] tracking-[-0.07em] sm:text-8xl">Account</h1>
        <p className="mt-6 text-xl font-semibold">{session.user.name}</p>
        <p className="mt-2 text-[var(--muted)]">{session.user.email}</p>

        <div className="mt-12 grid border-t border-[var(--line-soft)] sm:grid-cols-3">
          <Link href="/orders" className="group border-b border-[var(--line-soft)] py-6 text-xl font-semibold sm:border-r sm:px-6">
            Orders <span aria-hidden="true" className="float-right transition-transform group-hover:translate-x-1">&rarr;</span>
          </Link>
          <Link href="/cart" className="group border-b border-[var(--line-soft)] py-6 text-xl font-semibold sm:border-r sm:px-6">
            Cart <span aria-hidden="true" className="float-right transition-transform group-hover:translate-x-1">&rarr;</span>
          </Link>
          <Link href="/products" className="group border-b border-[var(--line-soft)] py-6 text-xl font-semibold sm:px-6">
            Shop <span aria-hidden="true" className="float-right transition-transform group-hover:translate-x-1">&rarr;</span>
          </Link>
        </div>

        <div className="mt-8 flex justify-end">
          <SignOutButton />
        </div>
      </section>
    </main>
  );
}
