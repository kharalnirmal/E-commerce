"use client";

import { useActionState } from "react";
import { createCategory, setCategoryArchived, updateCategory } from "./action";

type Category = { id: string; name: string; slug: string; description: string | null; imageUrl: string | null; position: number; archived: boolean };
type Option = { id: string; name: string };
const initialState = { message: "" };
const inputClass = "min-h-11 rounded-lg border-2 border-[var(--line)] bg-[var(--paper)] px-3";

export default function CategoryForm({ category, replacements = [] }: { category?: Category; replacements?: Option[] }) {
  const save = category ? updateCategory.bind(null, category.id) : createCategory;
  const [saveState, saveAction, savePending] = useActionState(save, initialState);
  const lifecycle = category ? setCategoryArchived.bind(null, category.id, !category.archived) : setCategoryArchived.bind(null, "", false);
  const [lifecycleState, lifecycleAction, lifecyclePending] = useActionState(lifecycle, initialState);

  return (
    <div className="brutal-card p-6">
      <form action={saveAction} className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1">Category name<input name="name" minLength={2} maxLength={80} required defaultValue={category?.name} className={inputClass} /></label>
        <label className="grid gap-1">Slug<input name="slug" maxLength={100} defaultValue={category?.slug} placeholder="Generated from name" className={inputClass} /></label>
        <label className="grid gap-1">Display position<input name="position" type="number" step="1" required defaultValue={category?.position ?? 0} className={inputClass} /></label>
        <label className="grid gap-1">Image URL<input name="imageUrl" type="url" defaultValue={category?.imageUrl ?? ""} className={inputClass} /></label>
        <label className="grid gap-1 sm:col-span-2">Description<textarea name="description" maxLength={1000} defaultValue={category?.description ?? ""} className={`${inputClass} min-h-24 py-2`} /></label>
        <button type="submit" disabled={savePending} className="button-primary sm:col-span-2">{savePending ? "Saving..." : category ? "Save category" : "Create category"}</button>
        <p role="status" className="sm:col-span-2">{saveState.message}</p>
      </form>
      {category && <form action={lifecycleAction} className="mt-5 border-t-2 border-[var(--line)] pt-5">
        {!category.archived && <label className="mb-3 grid gap-1">Reassign products when populated<select name="replacementCategoryId" defaultValue="" className={inputClass}><option value="">Select an active replacement</option>{replacements.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label>}
        <button type="submit" disabled={lifecyclePending} className="button-secondary">{lifecyclePending ? "Saving..." : category.archived ? "Restore category" : "Archive category"}</button>
        <p role="status" className="mt-2">{lifecycleState.message}</p>
      </form>}
    </div>
  );
}
