import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SignOutButton } from "./sign-out-button";

export default async function AccountPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  return (
    <main className="shell py-16">
      <section className="brutal-card mx-auto max-w-2xl p-8 sm:p-12">
        <p className="utility-label text-[var(--vermilion)]">Your account</p>
        <h1 className="mt-3 text-5xl font-bold tracking-[-0.06em]">Namaste, {session.user.name}.</h1>
        <p className="mt-5 text-[var(--muted)]">Signed in as {session.user.email}</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link href="/products" className="button-primary">Continue shopping</Link>
          <Link href="/cart" className="button-secondary">View cart</Link>
          <SignOutButton />
        </div>
      </section>
    </main>
  );
}
