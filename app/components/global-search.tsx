"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

type Suggestion = {
  id: string;
  name: string;
  slug: string;
  maker: string;
  price: string;
  stock: number;
  imageUrl: string | null;
};

export function GlobalSearch() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setFailed(false);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Search request failed.");
        const data = (await response.json()) as { products: Suggestion[] };
        setProducts(data.products);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setProducts([]);
          setFailed(true);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 180);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function close() {
    dialogRef.current?.close();
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="nav-action"
        aria-haspopup="dialog"
        onClick={() => {
          dialogRef.current?.showModal();
          window.requestAnimationFrame(() => inputRef.current?.focus());
        }}
      >
        Search
      </button>
      <dialog
        ref={dialogRef}
        aria-label="Search products"
        className="search-dialog"
        onClose={() => triggerRef.current?.focus()}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            close();
          }
        }}
      >
        <div className="search-panel">
          <div className="search-panel-head">
            <strong>Search CHOWK</strong>
            <button type="button" className="text-action" onClick={close}>Close</button>
          </div>
          <label className="sr-only" htmlFor={inputId}>Search products</label>
          <input
            ref={inputRef}
            id={inputId}
            type="search"
            value={query}
            onChange={(event) => {
              const nextQuery = event.target.value;
              setQuery(nextQuery);
              if (nextQuery.trim().length < 2) {
                setProducts([]);
                setLoading(false);
                setFailed(false);
              }
            }}
            placeholder="Product, maker, place..."
            className="search-input"
          />
          <div className="search-results" aria-live="polite">
            {loading && <p className="search-note">Searching...</p>}
            {!loading && query.trim().length < 2 && <p className="search-note">Type at least two characters.</p>}
            {!loading && failed && <p className="search-note" role="alert">Search could not be loaded. Use the full catalog below.</p>}
            {!loading && !failed && query.trim().length >= 2 && products.length === 0 && <p className="search-note">No matching products.</p>}
            {products.map((product) => (
              <Link key={product.id} href={`/products/${product.slug}`} className="search-result" onClick={close}>
                <span><strong>{product.name}</strong><small>{product.maker}</small></span>
                <span><strong>{product.price}</strong><small>{product.stock > 0 ? "Available" : "Sold out"}</small></span>
              </Link>
            ))}
          </div>
          {query.trim() && (
            <Link href={`/products?q=${encodeURIComponent(query.trim())}`} className="button-primary w-full" onClick={close}>
              View all results
            </Link>
          )}
        </div>
      </dialog>
    </>
  );
}
