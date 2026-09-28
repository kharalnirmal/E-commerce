"use client";

import { useActionState } from "react";
import { createProduct, updateProduct } from "./action";

type CategoryOption = { id: string; name: string };
type ProductDefaults = {
  id: string;
  name: string;
  slug: string;
  maker: string;
  origin: string;
  description: string | null;
  price: string;
  lowStockThreshold: number;
  categoryId: string;
  images: string[];
};

const initialState = { message: "" };
const inputClass = "min-h-11 rounded-lg border-2 border-[var(--line)] bg-[var(--paper)] p-2";

export function ProductForm({ categories, product }: { categories: CategoryOption[]; product?: ProductDefaults }) {
  const action = product ? updateProduct.bind(null, product.id) : createProduct;
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="brutal-card grid max-w-4xl gap-4 p-6 sm:grid-cols-2">
      <label className="flex flex-col gap-1">Name<input name="name" required minLength={2} maxLength={120} defaultValue={product?.name} className={inputClass} /></label>
      {product && <label className="flex flex-col gap-1">Slug<input name="slug" required maxLength={140} defaultValue={product.slug} className={inputClass} /></label>}
      <label className="flex flex-col gap-1">Maker<input name="maker" required minLength={2} maxLength={120} defaultValue={product?.maker} className={inputClass} /></label>
      <label className="flex flex-col gap-1">Origin<input name="origin" required minLength={2} maxLength={120} defaultValue={product?.origin} className={inputClass} /></label>
      <label className="flex flex-col gap-1">Price<input name="price" type="number" min="0" step="0.01" required defaultValue={product?.price} className={inputClass} /></label>
      {!product && <label className="flex flex-col gap-1">Initial stock<input name="stock" type="number" min="0" step="1" defaultValue="0" required className={inputClass} /></label>}
      <label className="flex flex-col gap-1">Low-stock threshold<input name="lowStockThreshold" type="number" min="0" step="1" defaultValue={product?.lowStockThreshold ?? 5} required className={inputClass} /></label>
      <label className="flex flex-col gap-1">Category<select name="categoryId" required defaultValue={product?.categoryId ?? ""} className={inputClass}><option value="" disabled>Select a category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
      <label className="flex flex-col gap-1 sm:col-span-2">Description<textarea name="description" maxLength={5000} defaultValue={product?.description ?? ""} className={`${inputClass} min-h-28`} /></label>
      <label className="flex flex-col gap-1 sm:col-span-2">Gallery URLs, one per line<textarea name="images" maxLength={24588} defaultValue={product?.images.join("\n")} placeholder="https://example.com/front.jpg" className={`${inputClass} min-h-32 font-mono text-sm`} /></label>
      <button type="submit" disabled={isPending || categories.length === 0} className="button-primary sm:col-span-2">{isPending ? "Saving..." : product ? "Save product details" : "Create product"}</button>
      <p role="status" aria-live="polite" className="sm:col-span-2">{state.message}</p>
    </form>
  );
}
