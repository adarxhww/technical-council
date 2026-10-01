"use client";

import { Camera, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type GalleryImage = {
  id: string;
  title: string;
  image_url: string;
};

export default function HomeGallerySlideshow({
  images,
}: {
  images: GalleryImage[];
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setCurrentIndex((current) => (current + 1) % images.length);
    }, 2000);

    return () => {
      window.clearInterval(interval);
    };
  }, [images.length]);

  useEffect(() => {
    if (images.length === 0) {
      setCurrentIndex(0);
      return;
    }

    if (currentIndex >= images.length) {
      setCurrentIndex(0);
    }
  }, [currentIndex, images.length]);

  const showPrevious = () => {
    if (images.length <= 1) {
      return;
    }

    setCurrentIndex(
      (current) => (current - 1 + images.length) % images.length
    );
  };

  const showNext = () => {
    if (images.length <= 1) {
      return;
    }

    setCurrentIndex(
      (current) => (current + 1) % images.length
    );
  };

  const activeImage = images[currentIndex];

  return (
    <div className="group relative h-[300px] overflow-hidden rounded-[28px] border border-slate-200/80 bg-gradient-to-br from-blue-100 via-white to-emerald-100 shadow-[0_18px_55px_rgba(60,70,120,0.09)] dark:border-white/10 dark:from-blue-950/50 dark:via-slate-900 dark:to-emerald-950/50">
      {/* Gallery navigation link */}
      <Link
        href="/gallery"
        aria-label="Open Technical Council gallery"
        className="absolute inset-0 z-10"
      />

      {/* Active image */}
      {activeImage?.image_url && (
        <img
          key={activeImage.id}
          src={activeImage.image_url}
          alt={
            activeImage.title ||
            "Technical Council gallery image"
          }
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
        />
      )}

      {/* Keep the existing card appearance over the image */}
      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-white/95 via-white/35 to-transparent dark:from-slate-950/90 dark:via-slate-950/30 dark:to-transparent" />

      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-white/70 via-transparent to-transparent dark:from-slate-950/70 dark:via-transparent" />

      {/* Existing title */}
      <div className="pointer-events-none absolute left-7 top-7 z-20">
        <span className="rounded-full bg-white/80 px-3 py-1.5 text-[10px] font-bold text-slate-600 shadow-sm backdrop-blur-xl dark:bg-slate-800/75 dark:text-slate-300">
          TECHNICAL EVENTS
        </span>

        <h3 className="mt-3 text-2xl font-bold text-slate-950 dark:text-white">
          Learn. Build. Share.
        </h3>
      </div>

      {/* Existing Camera overlay — ALWAYS PRESENT */}
      <div className="pointer-events-none absolute bottom-[-35px] right-[-20px] z-20 flex h-56 w-56 rotate-[-8deg] items-center justify-center rounded-[55px] border border-slate-200 bg-white/55 shadow-2xl backdrop-blur-xl transition duration-500 group-hover:rotate-0 group-hover:scale-105 dark:border-white/10 dark:bg-slate-800/55">
        <Camera
          size={75}
          strokeWidth={1}
          className="text-blue-500/70 dark:text-blue-400/70"
        />
      </div>

      {/* Existing bottom text */}
      <div className="pointer-events-none absolute bottom-6 left-7 z-20 max-w-sm text-sm text-slate-500 dark:text-slate-400">
        Explore the moments that make our community what it
        is.
      </div>

      {/* Previous / Next buttons */}
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={showPrevious}
            aria-label="Previous gallery image"
            className="absolute left-4 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/80 text-slate-700 shadow-lg backdrop-blur-xl transition hover:scale-105 hover:bg-white dark:border-white/10 dark:bg-slate-900/75 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            <ChevronLeft size={20} />
          </button>

          <button
            type="button"
            onClick={showNext}
            aria-label="Next gallery image"
            className="absolute right-4 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/80 text-slate-700 shadow-lg backdrop-blur-xl transition hover:scale-105 hover:bg-white dark:border-white/10 dark:bg-slate-900/75 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            <ChevronRight size={20} />
          </button>

          {/* Slide indicators */}
          <div className="absolute bottom-4 right-5 z-30 flex items-center gap-1.5">
            {images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                aria-label={`Show gallery image ${index + 1}`}
                onClick={() => setCurrentIndex(index)}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentIndex
                    ? "w-5 bg-slate-800 dark:bg-white"
                    : "w-1.5 bg-slate-400/70 dark:bg-slate-500/80"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}