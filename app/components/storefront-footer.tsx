import Link from "next/link";

export function StorefrontFooter() {
  return (
    <footer className="mt-24 border-t-2 border-[var(--line)] bg-[var(--ink)] py-10 text-[var(--paper)]">
      <div className="shell grid gap-8 md:grid-cols-2">
        <div>
          <p className="text-5xl font-black tracking-[-0.07em]">CHAUK</p>
          <p className="editorial mt-2 text-xl">Goods meet here. सामान यहाँ भेटिन्छ।</p>
        </div>
        <div className="flex flex-wrap items-end gap-6 md:justify-end">
          <Link href="/products" className="utility-label">Shop all</Link>
          <Link href="/sign-in" className="utility-label">Account</Link>
          <span className="utility-label">Kathmandu / {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}
