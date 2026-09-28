"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { demoIdentities, type DemoIdentity } from "@/lib/demo";
import { resetDemo } from "@/app/admin/reset-action";

export function DevUI({ activeIdentity }: { activeIdentity: DemoIdentity | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [pending, setPending] = useState<DemoIdentity | null>(null);
  const [error, setError] = useState("");
  const [resetState, resetAction, resetPending] = useActionState(resetDemo, { message: "" });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
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
        aria-label="Demo identities"
        onClose={() => {
          setOpen(false);
          triggerRef.current?.focus();
        }}
        className="brutal-card fixed bottom-20 left-auto right-4 top-auto m-0 w-[min(22rem,calc(100vw-2rem))] bg-[var(--surface)] p-5 text-[var(--ink)] backdrop:bg-black/45"
      >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="utility-label text-[var(--vermilion)]">DevUI · school demo</p>
              <h2 className="mt-1 text-2xl font-bold">Choose a perspective</h2>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close DevUI" className="utility-label">Close</button>
          </div>
          <p className="mt-3 text-sm">Active: {activeIdentity ? demoIdentities[activeIdentity].name : "Visitor"}</p>
          <div className="mt-5 grid gap-2">
            {(Object.entries(demoIdentities) as [DemoIdentity, (typeof demoIdentities)[DemoIdentity]][]).map(([key, identity]) => (
              <button
                key={key}
                type="button"
                onClick={() => switchIdentity(key)}
                disabled={pending !== null}
                className="button-secondary justify-between"
              >
                <span>{identity.name}</span><span>{identity.description}</span>
              </button>
            ))}
          </div>
          {activeIdentity === "nirmal" && (
            <form action={resetAction} className="mt-6 border-t-2 border-[var(--line)] pt-5">
              <label className="grid gap-2">
                <span className="utility-label">Type RESET to restore demo</span>
                <input name="confirmation" required className="min-h-11 rounded-lg border-2 border-[var(--line)] bg-[var(--paper)] px-3" />
              </label>
              <button type="submit" disabled={resetPending} className="button-primary mt-3 w-full">
                {resetPending ? "Restoring..." : "Restore canonical snapshot"}
              </button>
              <p role="status" className="mt-2 min-h-5 text-sm">{resetState.message}</p>
            </form>
          )}
          {error && <p role="alert" className="mt-3 text-sm">{error}</p>}
      </dialog>
      <button ref={triggerRef} type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="button-primary">
        {open ? "Hide DevUI" : "Open DevUI"}
      </button>
    </div>
  );
}
