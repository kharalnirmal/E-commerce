import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SignOutButton } from "./sign-out-button";

export default async function AccountPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");
  const initial = (session.user.name.trim()[0] ?? session.user.email[0]).toUpperCase();

  return (
    <main className="account-page">
      <header className="account-header">
        <h1>Account</h1>
        <SignOutButton />
      </header>

      <section className="account-profile" aria-label="Profile details">
        <span className="account-avatar" aria-hidden="true">{initial}</span>
        <div>
          <p className="account-name">{session.user.name}</p>
          <p className="account-email">{session.user.email}</p>
        </div>
      </section>

      <nav className="account-links" aria-label="Account navigation">
        <Link href="/orders"><span>Orders</span><span aria-hidden="true">&rarr;</span></Link>
        <Link href="/cart"><span>Cart</span><span aria-hidden="true">&rarr;</span></Link>
        <Link href="/products"><span>Continue shopping</span><span aria-hidden="true">&rarr;</span></Link>
      </nav>
    </main>
  );
}
