import Link from "next/link";
import { MobileMenu } from "./mobile-menu";
import { ThemeToggle } from "./theme-toggle";
import { GlobalSearch } from "./global-search";

export function StorefrontHeader() {
  return (
    <header className="storefront-header">
      <div className="shell storefront-nav">
        <Link href="/" className="wordmark" aria-label="CHOWK home">
          CHOWK
        </Link>
        <nav className="desktop-primary-nav" aria-label="Main navigation">
          <Link href="/products">Shop</Link>
          <Link href="/#featured">Featured</Link>
          <Link href="/#collections">Collections</Link>
        </nav>
        <div className="desktop-nav-actions">
          <GlobalSearch />
          <span className="nav-divider" aria-hidden="true" />
          <Link href="/account" className="nav-icon-control" aria-label="Account">
            <UserIcon />
          </Link>
          <Link href="/cart" className="nav-icon-control" aria-label="Cart">
            <CartIcon />
          </Link>
          <ThemeToggle />
        </div>
        <div className="mobile-nav-actions">
          <GlobalSearch />
          <ThemeToggle />
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 4h2l1.7 10.1a2 2 0 0 0 2 1.7h7.9a2 2 0 0 0 1.9-1.5L20 8H6" />
      <circle cx="9" cy="19" r="1" />
      <circle cx="17" cy="19" r="1" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5.5 20c.4-4 2.6-6 6.5-6s6.1 2 6.5 6" />
    </svg>
  );
}
