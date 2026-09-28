import Link from "next/link";
import { MobileMenu } from "./mobile-menu";
import { ThemeToggle } from "./theme-toggle";
import { GlobalSearch } from "./global-search";

export function StorefrontHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line-soft)] bg-[color-mix(in_srgb,var(--paper)_94%,transparent)] backdrop-blur-md">
      <div className="shell flex min-h-16 items-center gap-6">
        <Link href="/" className="wordmark" aria-label="CHOWK home">
          CHOWK
        </Link>
        <nav className="hidden items-center gap-7 md:flex" aria-label="Main navigation">
          <Link href="/products" className="utility-label">Shop</Link>
          <Link href="/#featured" className="utility-label">Featured</Link>
          <Link href="/#collections" className="utility-label">Collections</Link>
        </nav>
        <div className="ml-auto hidden items-center gap-3 md:flex">
          <GlobalSearch />
          <Link href="/cart" className="utility-label px-2">Cart</Link>
          <Link href="/account" className="utility-label px-2">Account</Link>
          <ThemeToggle />
        </div>
        <div className="ml-auto flex items-center gap-2 md:hidden">
          <GlobalSearch />
          <ThemeToggle />
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
