import Link from "next/link";

export function StorefrontFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-[var(--line-soft)] border-t">
      {/* Top trust strip */}
      <div className="border-[var(--line-soft)] border-b">
        <div className="gap-6 grid sm:grid-cols-3 py-8 shell">
          <div>
            <p className="utility-label">Curated products</p>
            <p className="mt-2 text-[var(--muted)] text-sm leading-relaxed">
              Thoughtfully selected goods from Nepal and beyond.
            </p>
          </div>

          <div>
            <p className="utility-label">Secure checkout</p>
            <p className="mt-2 text-[var(--muted)] text-sm leading-relaxed">
              Safe and reliable payment experience.
            </p>
          </div>

          <div>
            <p className="utility-label">Customer support</p>
            <p className="mt-2 text-[var(--muted)] text-sm leading-relaxed">
              Help when you need it before or after your order.
            </p>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="gap-12 grid lg:grid-cols-[1.4fr_1fr_1fr_1fr] py-14 shell">
        {/* Brand */}
        <div>
          <Link href="/" className="inline-block">
            <p className="text-4xl wordmark">CHOWK</p>
          </Link>

          <p className="mt-4 max-w-sm text-[var(--muted)] text-sm leading-6">
            Goods from independent makers in Nepal and beyond. Discover
            thoughtful products made for everyday life.
          </p>

          <p className="mt-6 text-[var(--muted)] text-xs uppercase tracking-[0.16em]">
            Made for discovery.
          </p>
        </div>

        {/* Shop */}
        <nav aria-label="Shop">
          <p className="utility-label">Shop</p>

          <div className="flex flex-col gap-3 mt-5">
            <Link
              href="/products"
              className="text-[var(--muted)] hover:text-[var(--foreground)] text-sm transition-colors"
            >
              Shop all
            </Link>

            <Link
              href="/products#catalog-search"
              className="text-[var(--muted)] hover:text-[var(--foreground)] text-sm transition-colors"
            >
              Search
            </Link>

            <Link
              href="/cart"
              className="text-[var(--muted)] hover:text-[var(--foreground)] text-sm transition-colors"
            >
              Cart
            </Link>
          </div>
        </nav>

        {/* Account */}
        <nav aria-label="Account">
          <p className="utility-label">Account</p>

          <div className="flex flex-col gap-3 mt-5">
            <Link
              href="/account"
              className="text-[var(--muted)] hover:text-[var(--foreground)] text-sm transition-colors"
            >
              My account
            </Link>

            <Link
              href="/account/orders"
              className="text-[var(--muted)] hover:text-[var(--foreground)] text-sm transition-colors"
            >
              Orders
            </Link>
          </div>
        </nav>

        {/* Help */}
        <nav aria-label="Customer support">
          <p className="utility-label">Help</p>

          <div className="flex flex-col gap-3 mt-5">
            <Link
              href="/contact"
              className="text-[var(--muted)] hover:text-[var(--foreground)] text-sm transition-colors"
            >
              Contact
            </Link>

            <Link
              href="/shipping"
              className="text-[var(--muted)] hover:text-[var(--foreground)] text-sm transition-colors"
            >
              Shipping
            </Link>

            <Link
              href="/returns"
              className="text-[var(--muted)] hover:text-[var(--foreground)] text-sm transition-colors"
            >
              Returns
            </Link>
          </div>
        </nav>
      </div>

      {/* Bottom footer */}
      <div className="border-[var(--line-soft)] border-t">
        <div className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-4 py-6 text-[var(--muted)] text-xs shell">
          <p>© {year} CHOWK. All rights reserved.</p>

          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link
              href="/privacy"
              className="hover:text-[var(--foreground)] transition-colors"
            >
              Privacy
            </Link>

            <Link
              href="/terms"
              className="hover:text-[var(--foreground)] transition-colors"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
