"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const slides = [
  {
    image: "https://images.unsplash.com/photo-1605640840605-14ac1855827b?auto=format&fit=crop&w=1800&q=88",
    alt: "A lively market street in Nepal",
  },
  {
    image: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1800&q=88",
    alt: "Hand-finished vessels arranged in a maker's studio",
  },
  {
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1800&q=88",
    alt: "A durable canvas carry-all ready for travel",
  },
] as const;

export function HeroCarousel() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setReducedMotion(mediaQuery.matches);
    updateMotionPreference();
    mediaQuery.addEventListener("change", updateMotionPreference);
    return () => mediaQuery.removeEventListener("change", updateMotionPreference);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion) return;
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [paused, reducedMotion]);

  const selectSlide = (index: number) => setActiveSlide((index + slides.length) % slides.length);

  return (
    <section
      className="hero-carousel"
      aria-roledescription="carousel"
      aria-label="CHOWK highlights"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
      }}
    >
      <div className="hero-carousel-copy">
        <div className="hero-carousel-heading">
          <h1 data-testid="kinetic-hero">Objects worth<br />meeting.</h1>
          <p className="hero-intro">
            Independent design and enduring craft, made for everyday life.
          </p>
          <div className="hero-carousel-actions">
            <Link href="/products" className="hero-primary-action">Shop collection <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </div>

      <div className="hero-carousel-media">
        {slides.map((slide, index) => (
          <figure
            key={slide.image}
            className="hero-carousel-slide"
            data-active={index === activeSlide}
            aria-hidden={index !== activeSlide}
          >
            <Image
              src={slide.image}
              alt={index === activeSlide ? slide.alt : ""}
              fill
              preload={index === 0}
              sizes="(max-width: 767px) calc(100vw - 2rem), 58vw"
              className="hero-carousel-image"
            />
          </figure>
        ))}
        <div className="hero-carousel-controls">
          <button type="button" onClick={() => selectSlide(activeSlide - 1)} aria-label="Show previous highlight">←</button>
          <button type="button" onClick={() => selectSlide(activeSlide + 1)} aria-label="Show next highlight">→</button>
        </div>
      </div>
    </section>
  );
}
