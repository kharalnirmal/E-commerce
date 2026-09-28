"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";

type Theme = "light" | "dark";

function currentTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem("chauk-theme");
  if (stored === "light" || stored === "dark") return stored;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function subscribe(onChange: () => void) {
  const media = matchMedia("(prefers-color-scheme: dark)");
  const handleChange = () => {
    document.documentElement.dataset.theme = currentTheme();
    onChange();
  };
  window.addEventListener("storage", handleChange);
  window.addEventListener("chauk-theme-change", handleChange);
  media.addEventListener("change", handleChange);
  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener("chauk-theme-change", handleChange);
    media.removeEventListener("change", handleChange);
  };
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, currentTheme, () => "light");

  useLayoutEffect(() => {
    const activeTheme = currentTheme();
    document.documentElement.dataset.theme = activeTheme;
  }, []);

  function toggleTheme() {
    const next = currentTheme() === "dark" ? "light" : "dark";
    localStorage.setItem("chauk-theme", next);
    document.documentElement.dataset.theme = next;
    window.dispatchEvent(new Event("chauk-theme-change"));
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="nav-action"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
    >
      {theme === "dark" ? "Light" : "Dark"}
    </button>
  );
}
