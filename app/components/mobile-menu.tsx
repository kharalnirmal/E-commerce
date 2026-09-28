"use client";

import Link from "next/link";
import { useRef } from "react";

const links = [
  ["Shop", "/products"],
  ["Featured", "/#featured"],
  ["Collections", "/#collections"],
  ["Search", "/products#catalog-search"],
  ["Cart", "/cart"],
  ["Account", "/sign-in"],
] as const;

export function MobileMenu() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        className="nav-action md:hidden"
        onClick={() => dialogRef.current?.showModal()}
        aria-haspopup="dialog"
      >
        Menu
      </button>
      <dialog
        ref={dialogRef}
        aria-label="Main menu"
        className="m-0 h-dvh max-h-none w-full max-w-none bg-[var(--paper)] p-0 text-[var(--ink)] backdrop:bg-black/60"
      >
        <div className="shell flex h-full flex-col py-5">
          <div className="flex items-center justify-between border-b border-[var(--line-soft)] pb-4">
            <span className="wordmark">CHOWK</span>
            <button
              type="button"
              className="text-action"
              onClick={() => dialogRef.current?.close()}
            >
              Close
            </button>
          </div>
          <nav className="flex flex-1 flex-col justify-center" aria-label="Mobile navigation">
            {links.map(([label, href], index) => (
              <Link
                key={label}
                href={href}
                onClick={() => dialogRef.current?.close()}
                 className="flex items-baseline justify-between border-b border-[var(--line-soft)] py-4 text-[clamp(2.2rem,11vw,4.5rem)] font-semibold leading-none tracking-[-0.055em]"
              >
                {label}
                 <span className="text-xs tracking-widest">0{index + 1}</span>
              </Link>
            ))}
          </nav>
        </div>
      </dialog>
    </>
  );
}
