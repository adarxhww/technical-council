"use client";

import { useEffect, useState } from "react";

import {
  Camera,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

/* =====================================================
   TYPES
   ===================================================== */

type GalleryItem = {
  id: string;
  title: string;
  category: string;
  date: string;
  image_path: string;
  image_url: string;
  published: boolean;
};

type GalleryGroup = {
  id: string;
  title: string;
  categories: string[];
  images: string[];
};

/* =====================================================
   GALLERY PAGE
   ===================================================== */

export default function GalleryPage() {
  const supabase = createClient();

  const [photos, setPhotos] = useState<GalleryGroup[]>([]);
  const [filters, setFilters] = useState<string[]>(["All"]);

  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const [slideIndexes, setSlideIndexes] = useState<
    Record<string, number>
  >({});

  const [activeGallery, setActiveGallery] =
    useState<GalleryGroup | null>(null);

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const [loading, setLoading] = useState(true);

  /* =====================================================
     LOAD GALLERY FROM SUPABASE
     ===================================================== */

  useEffect(() => {
    const loadGallery = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("gallery_items")
        .select(
          `
            id,
            title,
            category,
            date,
            image_path,
            image_url,
            published
          `
        )
        .eq("published", true)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error("Gallery load error:", error);

        setPhotos([]);
        setFilters(["All"]);
        setLoading(false);

        return;
      }

      const items = (data ?? []) as GalleryItem[];

      /* =====================================================
         GROUP PHOTOS BY TITLE
         ===================================================== */

      const grouped = new Map<string, GalleryGroup>();

      items.forEach((item) => {
        const existing = grouped.get(item.title);

        if (existing) {
          existing.images.push(item.image_url);

          if (
            !existing.categories.includes(
              item.category
            )
          ) {
            existing.categories.push(item.category);
          }
        } else {
          grouped.set(item.title, {
            id: item.id,
            title: item.title,
            categories: [item.category],
            images: [item.image_url],
          });
        }
      });

      const galleryGroups = Array.from(
        grouped.values()
      );

      setPhotos(galleryGroups);

      /* =====================================================
         BUILD FILTERS FROM DATABASE
         ===================================================== */

      const categorySet = new Set<string>();

      items.forEach((item) => {
        if (item.category.trim()) {
          categorySet.add(item.category);
        }
      });

      setFilters([
        "All",
        ...Array.from(categorySet).sort((a, b) =>
          a.localeCompare(b)
        ),
      ]);

      setLoading(false);
    };

    loadGallery();
  }, []);

  /* =====================================================
     FILTER + SEARCH
     ===================================================== */

  const filteredPhotos = photos.filter((photo) => {
    const matchesFilter =
      activeFilter === "All" ||
      photo.categories.includes(activeFilter);

    const matchesSearch = photo.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  /* =====================================================
     OPEN POPUP
     ===================================================== */

  const openGallery = (photo: GalleryGroup) => {
    const currentIndex =
      slideIndexes[photo.id] ?? 0;

    setActiveGallery(photo);
    setActiveImageIndex(currentIndex);
  };

  /* =====================================================
     CLOSE POPUP
     ===================================================== */

  const closeGallery = () => {
    setActiveGallery(null);
    setActiveImageIndex(0);
  };

  /* =====================================================
     PREVIOUS IMAGE
     ===================================================== */

  const previousImage = () => {
    if (!activeGallery) return;

    setActiveImageIndex((current) => {
      if (current === 0) {
        return activeGallery.images.length - 1;
      }

      return current - 1;
    });
  };

  /* =====================================================
     NEXT IMAGE
     ===================================================== */

  const nextImage = () => {
    if (!activeGallery) return;

    setActiveImageIndex(
      (current) =>
        (current + 1) %
        activeGallery.images.length
    );
  };

  /* =====================================================
     KEYBOARD CONTROLS
     ===================================================== */

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!activeGallery) return;

      if (event.key === "Escape") {
        closeGallery();
      }

      if (event.key === "ArrowLeft") {
        previousImage();
      }

      if (event.key === "ArrowRight") {
        nextImage();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [activeGallery]);

  /* =====================================================
     PAGE
     ===================================================== */

  return (
    <main className="gallery-page container pb-20 pt-16">
      {/* =====================================================
          HERO
          ===================================================== */}

      <section className="relative overflow-hidden rounded-[34px] p-7 md:p-12">
        {/* Background glow */}

        <div className="blur-orb right-20 top-8 z-0 h-56 w-56 bg-blue-300 dark:bg-blue-500" />

        <div className="blur-orb right-1/3 top-24 z-0 h-44 w-44 bg-violet-300 dark:bg-violet-500" />

        {/* 3D Gallery Illustration */}

        <div className="pointer-events-none absolute right-4 top-4 z-10 opacity-75 md:opacity-100">
          <img
            src="/images/gallery-3d.png"
            alt="Gallery camera illustration"
            className="h-72 w-72 -translate-y-16 object-contain md:h-[420px] md:w-[420px] md:-translate-y-20"
          />
        </div>

        {/* Hero Content */}

        <div className="relative z-20 max-w-2xl">
          <span className="gallery-badge mb-5 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs font-bold soft-border dark:bg-white/10 dark:text-white">
            <Camera
              size={15}
              className="text-emerald-500"
            />

            Moments of Innovation
          </span>

          <h1 className="section-title">
            Gallery
          </h1>

          <p className="gallery-hero-description mt-5 max-w-2xl text-lg leading-8 text-slate-500 dark:text-slate-400">
            Relive the best moments from our events,
            workshops and activities. Every moment inspires
            the next.
          </p>
        </div>
      </section>

      {/* =====================================================
          FILTER BAR
          ===================================================== */}

      <div className="gallery-filter-bar glass mt-5 flex flex-wrap gap-2 rounded-[24px] p-3">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() =>
              setActiveFilter(filter)
            }
            className={`gallery-filter-button rounded-full px-4 py-2 text-sm font-bold transition-all duration-300 ${
              activeFilter === filter
                ? "btn-primary"
                : "bg-white text-slate-700 soft-border hover:bg-slate-50 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
            }`}
          >
            {filter}
          </button>
        ))}

        {/* Search */}

        <div className="gallery-search ml-auto flex min-w-[220px] items-center gap-2 rounded-full bg-white px-4 py-2 text-sm text-slate-400 soft-border dark:bg-white/10">
          <Search size={16} />

          <input
            value={searchQuery}
            onChange={(event) =>
              setSearchQuery(
                event.target.value
              )
            }
            className="w-full bg-transparent text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200"
            placeholder="Search photos..."
          />
        </div>
      </div>

      {/* =====================================================
          LOADING
          ===================================================== */}

      {loading ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map(
            (_, index) => (
              <div
                key={index}
                className="glass animate-pulse overflow-hidden rounded-[26px]"
              >
                <div className="aspect-[4/3] bg-slate-200/70 dark:bg-white/10" />
              </div>
            )
          )}
        </div>
      ) : filteredPhotos.length > 0 ? (
        /* =====================================================
           GALLERY GRID
           ===================================================== */

        <div className="gallery-grid mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPhotos.map((photo, i) => {
            const currentImageIndex =
              slideIndexes[photo.id] ?? 0;

            const currentImage =
              photo.images[currentImageIndex];

            /*
             * IMPORTANT:
             * Posters/Banners always use the original
             * 210:297 portrait ratio.
             */

            const isPoster =
              photo.title ===
                "Posters/Banners" ||
              photo.categories.includes(
                "Posters/Banners"
              );

            return (
              <button
                key={photo.id}
                type="button"
                onClick={() =>
                  openGallery(photo)
                }
                className={`gallery-card glass group relative overflow-hidden rounded-[26px] text-left ${
                  i === 0 && !isPoster
                    ? "lg:col-span-2"
                    : ""
                }`}
              >
                {/* =====================================================
                    IMAGE CONTAINER
                    ===================================================== */}

                <div
                  className={`relative overflow-hidden ${
                    isPoster
                      ? "aspect-[210/297] bg-white"
                      : "aspect-[4/3]"
                  }`}
                >
                  <img
                    key={currentImage}
                    src={currentImage}
                    alt={photo.title}
                    className={`absolute inset-0 h-full w-full transition-all duration-700 ease-in-out ${
                      isPoster
                        ? "object-contain"
                        : "object-cover group-hover:scale-105"
                    }`}
                  />

                  {/* =====================================================
                      OVERLAY
                      ===================================================== */}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-90" />

                  {/* =====================================================
                      IMAGE INDICATORS
                      ===================================================== */}

                  {photo.images.length > 1 && (
                    <div className="absolute left-1/2 top-4 flex -translate-x-1/2 gap-1.5">
                      {photo.images.map(
                        (_, imageIndex) => (
                          <span
                            key={imageIndex}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              imageIndex ===
                              currentImageIndex
                                ? "w-6 bg-white"
                                : "w-1.5 bg-white/50"
                            }`}
                          />
                        )
                      )}
                    </div>
                  )}

                  {/* =====================================================
                      CLICK HINT
                      ===================================================== */}

                  <div className="absolute right-4 top-4 rounded-full bg-black/30 px-3 py-1.5 text-[11px] font-semibold text-white opacity-0 backdrop-blur-md transition-opacity duration-300 group-hover:opacity-100">
                    Click to view
                  </div>

                  {/* =====================================================
                      BOTTOM INFORMATION
                      ===================================================== */}

                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-extrabold text-white">
                          {photo.title}
                        </h3>

                        <p className="mt-1 text-xs font-medium text-white/70">
                          {photo.images.length}{" "}
                          {photo.images.length ===
                          1
                            ? "photo"
                            : "photos"}
                        </p>
                      </div>

                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/15 text-white backdrop-blur-md">
                        <Camera size={18} />
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        /* =====================================================
           NO RESULTS
           ===================================================== */

        <div className="glass mt-5 flex min-h-[220px] items-center justify-center rounded-[26px]">
          <div className="text-center">
            <Camera
              size={38}
              className="mx-auto mb-3 text-slate-400"
            />

            <h3 className="font-bold text-slate-700 dark:text-slate-200">
              No photos found
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              Try another category or search term.
            </p>
          </div>
        </div>
      )}

      {/* =====================================================
          FULL SCREEN POPUP
          ===================================================== */}

      {activeGallery && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4 backdrop-blur-xl"
          onClick={closeGallery}
        >
          <div
            className="relative flex h-full w-full max-w-7xl items-center justify-center"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {/* =====================================================
                CLOSE
                ===================================================== */}

            <button
              type="button"
              onClick={closeGallery}
              aria-label="Close gallery"
              className="absolute right-2 top-2 z-30 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20 md:right-4 md:top-4"
            >
              <X size={22} />
            </button>

            {/* =====================================================
                TITLE
                ===================================================== */}

            <div className="absolute left-2 top-3 z-20 md:left-4 md:top-5">
              <h2 className="text-lg font-bold text-white md:text-xl">
                {activeGallery.title}
              </h2>

              <p className="mt-1 text-xs text-white/60">
                {activeImageIndex + 1} /{" "}
                {activeGallery.images.length}
              </p>
            </div>

            {/* =====================================================
                MAIN IMAGE
                ===================================================== */}

            <div className="flex h-[75vh] w-full items-center justify-center">
              <img
                key={activeImageIndex}
                src={
                  activeGallery.images[
                    activeImageIndex
                  ]
                }
                alt={`${activeGallery.title} ${
                  activeImageIndex + 1
                }`}
                className="max-h-full max-w-[90%] rounded-2xl object-contain shadow-2xl transition-all duration-300 ease-out"
              />
            </div>

            {/* =====================================================
                PREVIOUS
                ===================================================== */}

            {activeGallery.images.length > 1 && (
              <button
                type="button"
                onClick={previousImage}
                aria-label="Previous image"
                className="absolute left-1 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20 md:left-4 md:h-14 md:w-14"
              >
                <ChevronLeft size={28} />
              </button>
            )}

            {/* =====================================================
                NEXT
                ===================================================== */}

            {activeGallery.images.length > 1 && (
              <button
                type="button"
                onClick={nextImage}
                aria-label="Next image"
                className="absolute right-1 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20 md:right-4 md:h-14 md:w-14"
              >
                <ChevronRight size={28} />
              </button>
            )}

            {/* =====================================================
                BOTTOM INDICATORS
                ===================================================== */}

            {activeGallery.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                {activeGallery.images.map(
                  (_, index) => (
                    <button
                      key={index}
                      type="button"
                      aria-label={`Go to image ${
                        index + 1
                      }`}
                      onClick={() =>
                        setActiveImageIndex(
                          index
                        )
                      }
                      className={`h-2 rounded-full transition-all duration-300 ${
                        index ===
                        activeImageIndex
                          ? "w-8 bg-white"
                          : "w-2 bg-white/40 hover:bg-white/70"
                      }`}
                    />
                  )
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}