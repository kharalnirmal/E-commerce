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
    <form action={formAction} className="flex flex-col gap-3">
      <label htmlFor="name">Category name</label>

      <input
        id="name"
        name="name"
        type="text"
        minLength={2}
        maxLength={80}
        required
        className="px-3 py-2 border rounded"
      />

      <button
        type="submit"
        disabled={isPending}
        className="bg-black disabled:opacity-50 px-4 py-2 rounded text-white"
      >
        {isPending ? "Saving..." : "Create category"}
      </button>

      <p role="status">{state.message}</p>
    </form>
  );
}
