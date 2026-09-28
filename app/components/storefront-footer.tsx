import Link from "next/link";

export function StorefrontFooter() {
  return (
    <footer className="mt-24 border-t border-[var(--line-soft)] py-12">
      <div className="shell grid gap-10 md:grid-cols-2">
        <div>
          <p className="wordmark text-4xl">CHOWK</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--muted)]">A considered marketplace for useful objects, independent makers, and everyday rituals.</p>
        </div>
        <div className="flex flex-wrap items-end gap-6 md:justify-end">
          <Link href="/products" className="utility-label">Shop all</Link>
          <Link href="/products#catalog-search" className="utility-label">Search</Link>
          <Link href="/cart" className="utility-label">Cart</Link>
          <Link href="/sign-in" className="utility-label">Account</Link>
          <span className="utility-label">Kathmandu / {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}
