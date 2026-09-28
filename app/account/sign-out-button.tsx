"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSignOut() {
    setPending(true);
    setError("");

    try {
      const result = await signOut();

      if (result.error) {
        setError(result.error.message ?? "Could not sign out.");
        return;
      }

      router.replace("/sign-in");
      router.refresh();
    } catch {
      setError("Could not sign out. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button type="button" onClick={handleSignOut} disabled={pending} className="button-secondary">
        {pending ? "Signing out..." : "Sign out"}
      </button>
      {error && <p role="alert">{error}</p>}
    </>
  );
}
