"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { demoIdentities, type DemoIdentity } from "@/lib/demo";

export function DevUI({ activeIdentity }: { activeIdentity: DemoIdentity | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [pending, setPending] = useState<DemoIdentity | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      closeRef.current?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  async function switchIdentity(identity: DemoIdentity) {
    setPending(identity);
    setError("");
    try {
      const response = await fetch("/api/demo/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ identity }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      router.push(result.destination);
      router.refresh();
      setOpen(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not switch identity.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      <dialog
        ref={dialogRef}
        aria-labelledby="demo-title"
        onClose={() => {
          setOpen(false);
          triggerRef.current?.focus();
        }}
        className="fixed bottom-18 left-auto right-3 top-auto m-0 w-[min(20rem,calc(100vw-1.5rem))] border border-[var(--line)] bg-[var(--surface)] p-4 text-[var(--ink)] shadow-2xl backdrop:bg-black/50 sm:right-5"
      >
          <div className="flex items-center justify-between gap-4 border-b border-[var(--line-soft)] pb-3">
            <h2 id="demo-title" className="text-lg font-semibold tracking-[-0.03em]">Browse the demo</h2>
            <button ref={closeRef} type="button" onClick={() => setOpen(false)} aria-label="Close demo menu" className="text-action">Close</button>
          </div>
          <p className="mt-3 text-sm text-[var(--muted)]">Choose who you want to browse as.</p>
          <div className="mt-4 grid border-t border-[var(--line-soft)]">
            {(Object.entries(demoIdentities) as [DemoIdentity, (typeof demoIdentities)[DemoIdentity]][]).map(([key, identity]) => (
              <button
                key={key}
                type="button"
                onClick={() => switchIdentity(key)}
                disabled={pending !== null}
                aria-pressed={activeIdentity === key}
                className="flex min-h-14 items-center justify-between gap-4 border-b border-[var(--line-soft)] px-1 text-left text-sm hover:bg-[var(--surface-muted)]"
              >
                <span className="font-semibold">{identity.name.split(" ")[0]}</span>
                <span className="text-xs text-[var(--muted)]">{activeIdentity === key ? "Active" : identity.description}</span>
              </button>
            ))}
          </div>
          <p role="status" aria-live="polite" className="mt-3 min-h-5 text-sm">
            {pending ? `Switching to ${demoIdentities[pending].name.split(" ")[0]}...` : activeIdentity ? `${demoIdentities[activeIdentity].name.split(" ")[0]} is active.` : "Browsing as a visitor."}
          </p>
          {error && <p role="alert" className="mt-3 text-sm">{error}</p>}
      </dialog>
      <button ref={triggerRef} type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open} className="border border-[var(--line)] bg-[var(--ink)] px-4 py-2 text-xs font-bold uppercase tracking-[0.1em] text-[var(--paper)] shadow-lg">
        Demo
      </button>
    </div>
  );
}
