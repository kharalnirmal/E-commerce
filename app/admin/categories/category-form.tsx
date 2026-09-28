"use client";

import { useActionState } from "react";
import { createCategory } from "./action";

const initialState = { message: "" };

export default function CategoryForm() {
  const [state, formAction, isPending] = useActionState(
    createCategory,
    initialState,
  );

  return (
    <form action={formAction} className="brutal-card flex max-w-xl flex-col gap-3 p-6">
      <label htmlFor="name" className="utility-label">Category name</label>

      <input
        id="name"
        name="name"
        type="text"
        minLength={2}
        maxLength={80}
        required
        className="min-h-12 rounded-lg border-2 border-[var(--line)] bg-[var(--paper)] px-3"
      />

      <button
        type="submit"
        disabled={isPending}
        className="button-primary"
      >
        {isPending ? "Saving..." : "Create category"}
      </button>

      <p role="status">{state.message}</p>
    </form>
  );
}
