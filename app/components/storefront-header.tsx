import Link from "next/link";
import { MobileMenu } from "./mobile-menu";
import { ThemeToggle } from "./theme-toggle";

export function StorefrontHeader() {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-[var(--line)] bg-[color-mix(in_srgb,var(--paper)_92%,transparent)] backdrop-blur-md">
      <div className="shell flex min-h-20 items-center gap-6">
        <Link href="/" className="text-2xl font-black tracking-[-0.08em]" aria-label="CHAUK home">
          CHAUK
        </Link>
        <nav className="hidden items-center gap-7 md:flex" aria-label="Main navigation">
          <Link href="/products" className="utility-label">Shop</Link>
          <Link href="/#weekly-edit" className="utility-label">Edit</Link>
          <Link href="/#categories" className="utility-label">Categories</Link>
        </nav>
        <div className="ml-auto hidden items-center gap-3 md:flex">
          <Link href="/products#catalog-search" className="utility-label px-2">Search</Link>
          <Link href="/cart" className="utility-label px-2">Cart</Link>
          <Link href="/sign-in" className="utility-label px-2">Account</Link>
          <ThemeToggle />
        </div>
        <div className="ml-auto flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
