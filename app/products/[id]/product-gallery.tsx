"use client";

import { useState } from "react";
import { RemoteImage } from "@/app/components/remote-image";

type GalleryImage = { id: string; url: string; proxyPath: string };

export function ProductGallery({ productName, images }: { productName: string; images: GalleryImage[] }) {
  const [selected, setSelected] = useState(0);
  const current = images[selected];

  function move(direction: number) {
    setSelected((index) => (index + direction + images.length) % images.length);
  }

  return (
    <div
      className="product-gallery"
      onKeyDown={(event) => {
        if (images.length < 2) return;
        if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
        if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
      }}
    >
      <div className="image-frame aspect-[4/5]" aria-live="polite">
        <RemoteImage src={current.url} alt={`${productName}, view ${selected + 1} of ${images.length}`} eager proxyPath={current.proxyPath} />
      </div>
      {images.length > 1 && (
        <div aria-label="Product gallery" className="gallery-thumbnails">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              className="gallery-thumbnail"
              aria-label={`Show ${productName} view ${index + 1}`}
              aria-pressed={selected === index}
              onClick={() => setSelected(index)}
            >
              <RemoteImage src={image.url} alt="" proxyPath={image.proxyPath} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
