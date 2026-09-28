"use client";

import { useEffect, useRef, useState } from "react";
import { getOpeningState } from "@/lib/storefront";

const storageKey = "chowk-session-entry";

export function OpeningSequence() {
  const [visible, setVisible] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const state = getOpeningState(sessionStorage.getItem(storageKey), window.location.pathname);
    if (!state.show) {
      sessionStorage.setItem(storageKey, state.stored);
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let hideTimer: number | undefined;
    const showTimer = window.setTimeout(() => {
      sessionStorage.setItem(storageKey, state.stored);
      setVisible(true);
      hideTimer = window.setTimeout(() => setVisible(false), reducedMotion ? 80 : 1250);
    }, 0);
    return () => {
      window.clearTimeout(showTimer);
      if (hideTimer !== undefined) window.clearTimeout(hideTimer);
    };
  }, []);

  useEffect(() => {
    if (visible && dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal();
  }, [visible]);

  if (!visible) return null;

  return (
    <dialog ref={dialogRef} className="opening-sequence" aria-label="CHOWK opening" data-testid="opening-sequence" onCancel={() => setVisible(false)}>
      <p className="opening-wordmark" aria-label="CHOWK">CHOWK</p>
      <p className="opening-caption">Objects worth meeting</p>
      <button type="button" className="opening-skip" onClick={() => setVisible(false)}>Skip</button>
    </dialog>
  );
}
