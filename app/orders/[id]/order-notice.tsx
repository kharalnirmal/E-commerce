"use client";

import { type ReactNode, useEffect, useRef } from "react";

export function OrderNotice({ children, tone = "status" }: { children: ReactNode; tone?: "status" | "error" }) {
  const noticeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    noticeRef.current?.focus();
  }, []);

  return (
    <div
      ref={noticeRef}
      tabIndex={-1}
      role={tone === "error" ? "alert" : "status"}
      className="mt-6 border-l-2 border-[var(--line)] bg-[var(--paper-deep)] px-5 py-4 font-semibold"
    >
      {children}
    </div>
  );
}
