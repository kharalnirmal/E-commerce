"use client";

import Link from "next/link";
import { useRef } from "react";

const links = [
  ["Shop", "/products"],
  ["Edit", "/#weekly-edit"],
  ["Categories", "/#categories"],
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
        className="button-secondary md:hidden"
        onClick={() => dialogRef.current?.showModal()}
        aria-haspopup="dialog"
      >
        Menu
      </button>
      <dialog
        ref={dialogRef}
        aria-label="Main menu"
        className="m-0 h-dvh max-h-none w-full max-w-none bg-[var(--vermilion)] p-0 text-[#fff9ed] backdrop:bg-black/50"
      >
        <div className="shell flex h-full flex-col py-5">
          <div className="flex items-center justify-between border-b-2 border-current pb-4">
            <span className="text-2xl font-black tracking-[-0.08em]">CHAUK</span>
            <button
              type="button"
              className="rounded-full border-2 px-4 py-2 font-mono text-xs uppercase"
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
                className="flex items-baseline justify-between border-b-2 border-current py-3 text-[clamp(2.6rem,12vw,5.5rem)] font-bold leading-none tracking-[-0.06em]"
              >
                {label}
                <span className="font-mono text-xs">0{index + 1}</span>
              </Link>
            ))}
          </nav>
        </div>
      </dialog>
    </>
  );
}
