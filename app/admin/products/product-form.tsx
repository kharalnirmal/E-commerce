"use client";

import { useActionState } from "react";
import { createProduct } from "./action";

type CategoryOption = {
  id: string;
  name: string;
};

const initialState = { message: "" };
export function ProductForm({ categories }: { categories: CategoryOption[] }) {
  const [state, formAction, isPending] = useActionState(
    createProduct,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-lg">
      <label className="flex flex-col gap-1">
        Name
        <input
          name="name"
          required
          minLength={2}
          maxLength={120}
          className="p-2 border"
        />
      </label>
      <label className="flex flex-col gap-1">
        Description
        <textarea
          name="description"
          maxLength={5000}
          className="p-2 border"
        ></textarea>
      </label>

      <label className="flex flex-col gap-1">
        Price
        <input
          name="price"
          type="number"
          min="0"
          step="0.01"
          required
          className="p-2 border"
        />
      </label>
      <label className="flex flex-col gap-1">
        Stock
        <input
          name="stock"
          type="number"
          min="0"
          step="1"
          defaultValue="0"
          required
          className="p-2 border"
        />
      </label>

      <label className="flex flex-col gap-1">
        Image URL
        <input name="imageUrl" type="url" className="p-2 border" />
      </label>

      <label className="flex flex-col gap-1">
        Category
        <select
          name="categoryId"
          required
          defaultValue=""
          className="p-2 border"
        >
          <option value="" disabled>
            Select a Category
          </option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <button
        type="submit"
        disabled={isPending || categories.length === 0}
        className="bg-black disabled:opacity-50 p-2 text-white"
      >
        {isPending ? "Saving..." : "Create product"}
      </button>
      <p role="status">{state.message}</p>
    </form>
  );
}
