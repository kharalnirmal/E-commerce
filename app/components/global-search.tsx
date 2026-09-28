"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { RemoteImage } from "./remote-image";

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
        <SearchIcon />
        <span>Search</span>
      </button>
      <dialog
        ref={dialogRef}
        aria-label="Search products"
        className="search-dialog"
        onClose={() => triggerRef.current?.focus()}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            close();
          }
        }}
      >
        <div className="search-panel">
          <div className="search-panel-head">
            <span className="utility-label">Search CHOWK</span>
            <button type="button" className="search-close" aria-label="Close search" onClick={close}>
              <CloseIcon />
            </button>
          </div>
          <form action="/products" method="get" onSubmit={close}>
            <label className="search-label" htmlFor={inputId}>Search products</label>
            <div className="search-field">
              <SearchIcon />
              <input
                ref={inputRef}
                id={inputId}
                name="q"
                type="search"
                value={query}
                onChange={(event) => {
                  const nextQuery = event.target.value;
                  setQuery(nextQuery);
                  setProducts([]);
                  setLoading(nextQuery.trim().length >= 2);
                  setFailed(false);
                }}
                placeholder="Lamp, canvas, Kathmandu..."
                className="search-input"
                autoComplete="off"
                enterKeyHint="search"
              />
              {query && (
                <button
                  type="button"
                  className="search-clear"
                  onClick={() => {
                    setQuery("");
                    setProducts([]);
                    setLoading(false);
                    setFailed(false);
                    inputRef.current?.focus();
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </form>
          <div className="search-results" aria-live="polite" aria-busy={loading}>
            {loading && (
              <div className="search-note search-loading" role="status">
                <span className="search-spinner" aria-hidden="true" />
                Searching the market...
              </div>
            )}
            {!loading && query.trim().length < 2 && (
              <p className="search-note">Search by product, maker, or place.</p>
            )}
            {!loading && failed && (
              <div className="search-empty" role="alert">
                <strong>Search is unavailable</strong>
                <p>Try again, or browse the complete collection.</p>
              </div>
            )}
            {!loading && !failed && query.trim().length >= 2 && products.length === 0 && (
              <div className="search-empty">
                <strong>No results for &ldquo;{query.trim()}&rdquo;</strong>
                <p>Check the spelling or try a broader term.</p>
              </div>
            )}
            {!loading && products.length > 0 && (
              <p className="search-result-count">Top results</p>
            )}
            {!loading && products.map((product) => (
              <Link key={product.id} href={`/products/${product.slug}`} className="search-result" onClick={close}>
                <span className="search-result-image" aria-hidden="true">
                  {product.imageUrl ? (
                    <RemoteImage
                      src={product.imageUrl}
                      alt=""
                      proxyPath={`/api/catalog-image/product/${product.id}`}
                    />
                  ) : (
                    <span className="search-image-placeholder">CH</span>
                  )}
                </span>
                <span className="search-result-copy">
                  <strong>{product.name}</strong>
                  <small>{product.maker}</small>
                </span>
                <span className="search-result-meta">
                  <strong>{product.price}</strong>
                  <small>{product.stock > 0 ? "In stock" : "Sold out"}</small>
                </span>
                <span className="search-result-arrow" aria-hidden="true">&rarr;</span>
              </Link>
            ))}
          </div>
          {query.trim().length >= 2 && (
            <Link href={`/products?q=${encodeURIComponent(query.trim())}`} className="search-all-results" onClick={close}>
              <span>View all results</span>
              <span aria-hidden="true">&rarr;</span>
            </Link>
          )}
        </div>
      </dialog>
    </>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}
