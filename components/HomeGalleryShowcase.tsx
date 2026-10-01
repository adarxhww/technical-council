"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Camera } from "lucide-react";

type GalleryImage = {
  id: string;
  title: string;
  image_url: string;
  display_order: number;
};

export default function HomeGalleryShowcase({
  images,
}: {
  images: GalleryImage[];
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const hasImages = images.length > 0;

  const currentImage = hasImages
    ? images[currentIndex]
    : null;

  const goPrevious = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!hasImages) return;

    setCurrentIndex((current) =>
      current === 0 ? images.length - 1 : current - 1
    );
  };

  const goNext = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!hasImages) return;

    setCurrentIndex((current) =>
      current === images.length - 1 ? 0 : current + 1
    );
  };

  return (
    <Link
      href="/gallery"
      className="group relative h-[300px] overflow-hidden rounded-[28px] border border-slate-200/80 bg-gradient-to-br from-blue-100 via-white to-emerald-100 shadow-[0_18px_55px_rgba(60,70,120,0.09)] dark:border-white/10 dark:from-blue-950/50 dark:via-slate-900 dark:to-emerald-950/50"
    >
      {/* Homepage image */}
      {currentImage && (
        <>
          <img
            src={currentImage.image_url}
            alt={currentImage.title}
            className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
          />

          {/* Image readability overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/5 to-black/55" />
        </>
      )}

      {/* Existing heading */}
      <div className="absolute left-7 top-7 z-10">
        <span
          className={
            currentImage
              ? "rounded-full bg-black/30 px-3 py-1.5 text-[10px] font-bold text-white shadow-sm backdrop-blur-xl"
              : "rounded-full bg-white/80 px-3 py-1.5 text-[10px] font-bold text-slate-600 shadow-sm backdrop-blur-xl dark:bg-slate-800/75 dark:text-slate-300"
          }
        >
          TECHNICAL EVENTS
        </span>

        <h3
          className={
            currentImage
              ? "mt-3 text-2xl font-bold text-white"
              : "mt-3 text-2xl font-bold text-slate-950 dark:text-white"
          }
        >
          Learn. Build. Share.
        </h3>
      </div>

      {/* Empty state */}
      {!currentImage && (
        <div className="absolute bottom-[-35px] right-[-20px] flex h-56 w-56 rotate-[-8deg] items-center justify-center rounded-[55px] border border-slate-200 bg-white/55 shadow-2xl backdrop-blur-xl transition duration-500 group-hover:rotate-0 group-hover:scale-105 dark:border-white/10 dark:bg-slate-800/55">
          <Camera
            size={75}
            strokeWidth={1}
            className="text-blue-500/70 dark:text-blue-400/70"
          />
        </div>
      )}

      {/* Existing description */}
      <div
        className={
          currentImage
            ? "absolute bottom-6 left-7 z-10 max-w-sm text-sm text-white/90"
            : "absolute bottom-6 left-7 max-w-sm text-sm text-slate-500 dark:text-slate-400"
        }
      >
        Explore the moments that make our community what it
        is.
      </div>

      {/* Previous / Next */}
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={goPrevious}
            aria-label="Previous gallery image"
            className="absolute left-4 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/30 text-white opacity-0 shadow-lg backdrop-blur-xl transition duration-300 hover:bg-black/50 group-hover:opacity-100"
          >
            <ArrowLeft size={17} />
          </button>

          <button
            type="button"
            onClick={goNext}
            aria-label="Next gallery image"
            className="absolute right-4 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/30 text-white opacity-0 shadow-lg backdrop-blur-xl transition duration-300 hover:bg-black/50 group-hover:opacity-100"
          >
            <ArrowRight size={17} />
          </button>

          {/* Slide indicators */}
          <div className="absolute bottom-5 right-6 z-20 flex items-center gap-1.5">
            {images.map((image, index) => (
              <span
                key={image.id}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "w-5 bg-white"
                    : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </Link>
  );
}