"use client";

import { useActionState } from "react";
import { toggleFeatured } from "./action";

export function FeaturedToggle({ productId, featured }: { productId: string; featured: boolean }) {
  const action = toggleFeatured.bind(null, productId);
  const [message, formAction, pending] = useActionState(action, "");

  return (
    <form action={formAction} className="mt-4">
      <button type="submit" disabled={pending} className="button-secondary">
        {pending ? "Updating..." : featured ? "Remove from edit" : "Feature product"}
      </button>
      <p role="status" className="mt-2 min-h-5 text-sm">{message}</p>
    </form>
  );
}
