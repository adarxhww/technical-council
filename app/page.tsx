"use client";

import Link from "next/link";

import {
  ArrowRight,
  CalendarDays,
  Camera,
  Code2,
  Cpu,
  Mail,
  Megaphone,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

type Event = {
  id: string;
  date: string;
  time: string | null;
  title: string;
  type: string | null;
  description: string | null;
  published: boolean;
};

type Notice = {
  id: string;
  title: string;
  date: string;
  description: string;
  published: boolean;
  attachment_url: string | null;
  attachment_text: string | null;
  attachment_enabled: boolean | null;
};

type GalleryImage = {
  id: string;
  title: string;
  image_url: string;
  homepage_slideshow: boolean;
  display_order: number;
  published: boolean;
};

const supabase = createClient();

async function getUpcomingEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from("events")
    .select("id, date, time, title, type, description, published")
    .eq("published", true)
    .order("date", { ascending: true });

  if (error) {
    console.error("Failed to load events:", error);
    return [];
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (data ?? [])
    .filter((event) => {
      if (!event.date) return false;

      const eventDate = new Date(event.date);

      if (Number.isNaN(eventDate.getTime())) {
        return false;
      }

      eventDate.setHours(0, 0, 0, 0);

      return eventDate >= today;
    })
    .sort(
      (a, b) =>
        new Date(a.date).getTime() -
        new Date(b.date).getTime()
    )
    .slice(0, 3);
}

async function getPublishedNotices(): Promise<Notice[]> {
  const { data, error } = await supabase
    .from("notices")
    .select(
      "id, title, date, description, published, attachment_url, attachment_text, attachment_enabled"
    )
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(3);

  if (error) {
    console.error("Failed to load notices:", error);
    return [];
  }

  return (data ?? []).map((notice) => ({
    ...notice,
    attachment_url:
      typeof notice.attachment_url === "string"
        ? notice.attachment_url.trim()
        : null,
    attachment_text:
      typeof notice.attachment_text === "string"
        ? notice.attachment_text.trim()
        : null,
    attachment_enabled:
      notice.attachment_enabled === true
        ? true
        : notice.attachment_enabled === false
        ? false
        : null,
  })) as Notice[];
}

async function getHomepageGalleryImages(): Promise<GalleryImage[]> {
  const { data, error } = await supabase
    .from("gallery_items")
    .select(
      "id, title, image_url, homepage_slideshow, display_order, published"
    )
    .eq("published", true)
    .eq("homepage_slideshow", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to load homepage gallery:", error);
    return [];
  }

  return data ?? [];
}

function formatEventDate(date: string) {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return {
      day: "",
      month: "",
      year: "",
    };
  }

  return {
    day: parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
    }),
    month: parsed.toLocaleDateString("en-IN", {
      month: "short",
    }),
    year: parsed.toLocaleDateString("en-IN", {
      year: "numeric",
    }),
  };
}

function formatNoticeDate(date: string) {
  if (!date) return "";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed
    .toLocaleDateString("en-IN", {
      month: "short",
      year: "numeric",
    })
    .toUpperCase();
}

function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[28px] border border-slate-200/80 bg-white/75 shadow-[0_18px_55px_rgba(60,70,120,0.09)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/60 dark:shadow-[0_18px_55px_rgba(0,0,0,0.28)] ${className}`}
    >
      {children}
    </div>
  );
}

function HomepageGallery({
  images,
}: {
  images: GalleryImage[];
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const hasImages = images.length > 0;

  useEffect(() => {
    if (images.length <= 1) return;

    const interval = window.setInterval(() => {
      setCurrentIndex(
        (current) => (current + 1) % images.length
      );
    }, 2000);

    return () => window.clearInterval(interval);
  }, [images.length]);

  useEffect(() => {
    if (
      currentIndex >= images.length &&
      images.length > 0
    ) {
      setCurrentIndex(0);
    }
  }, [currentIndex, images.length]);

  const showPrevious = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (images.length <= 1) return;

    setCurrentIndex(
      (current) =>
        (current - 1 + images.length) % images.length
    );
  };

  const showNext = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (images.length <= 1) return;

    setCurrentIndex(
      (current) => (current + 1) % images.length
    );
  };

  const currentImage = images[currentIndex];

  return (
    <Link
      href="/gallery"
      className="group relative h-[300px] overflow-hidden rounded-[28px] border border-slate-200/80 bg-gradient-to-br from-blue-100 via-white to-emerald-100 shadow-[0_18px_55px_rgba(60,70,120,0.09)] dark:border-white/10 dark:from-blue-950/50 dark:via-slate-900 dark:to-emerald-950/50"
    >
      {hasImages && currentImage ? (
        <>
          <img
            key={currentImage.id}
            src={currentImage.image_url}
            alt={currentImage.title}
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/35 to-transparent dark:from-slate-950/85 dark:via-slate-950/30 dark:to-transparent" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-white to-emerald-100 dark:from-blue-950/50 dark:via-slate-900 dark:to-emerald-950/50" />
      )}

      <div className="absolute left-7 top-7 z-20">
        <span className="rounded-full bg-white/80 px-3 py-1.5 text-[10px] font-bold text-slate-600 shadow-sm backdrop-blur-xl dark:bg-slate-800/75 dark:text-slate-300">
          TECHNICAL EVENTS
        </span>

        <h3 className="mt-3 text-2xl font-bold text-slate-950 dark:text-white">
          Learn. Build. Share.
        </h3>
      </div>

      {images.length > 1 && (
        <div className="absolute bottom-6 left-7 z-30 flex items-center gap-2">
          <button
            type="button"
            onClick={showPrevious}
            aria-label="Previous gallery image"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/80 bg-white/80 text-slate-700 shadow-lg backdrop-blur-xl transition hover:scale-105 hover:bg-white dark:border-white/10 dark:bg-slate-900/75 dark:text-white dark:hover:bg-slate-900"
          >
            <ArrowRight
              size={16}
              className="rotate-180"
            />
          </button>

          <div className="flex items-center gap-1.5 rounded-full border border-white/80 bg-white/75 px-3 py-2 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/75">
            {images.map((image, index) => (
              <span
                key={image.id}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentIndex
                    ? "w-5 bg-slate-900 dark:bg-white"
                    : "w-1.5 bg-slate-400/60 dark:bg-slate-500"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={showNext}
            aria-label="Next gallery image"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/80 bg-white/80 text-slate-700 shadow-lg backdrop-blur-xl transition hover:scale-105 hover:bg-white dark:border-white/10 dark:bg-slate-900/75 dark:text-white dark:hover:bg-slate-900"
          >
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      <div
        className="absolute bottom-[-35px] right-[-20px] z-20 flex h-56 w-56 rotate-[-8deg] items-center justify-center rounded-[55px] border border-white/25 shadow-2xl transition duration-500 group-hover:rotate-0 group-hover:scale-105"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.30)",
          backdropFilter: "none",
          WebkitBackdropFilter: "none",
        }}
      >
        <Camera
          size={75}
          strokeWidth={1}
          className="relative z-10 text-blue-400/80"
        />
      </div>

      <div className="absolute bottom-6 right-7 z-20 max-w-sm text-right text-sm text-slate-600 dark:text-slate-300">
        Explore the moments that make our community what it
        is.
      </div>
    </Link>
  );
}

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [galleryImages, setGalleryImages] = useState<
    GalleryImage[]
  >([]);

  useEffect(() => {
    async function loadHomepageData() {
      const [
        eventsData,
        noticesData,
        galleryData,
      ] = await Promise.all([
        getUpcomingEvents(),
        getPublishedNotices(),
        getHomepageGalleryImages(),
      ]);

      setEvents(eventsData);
      setNotices(noticesData);
      setGalleryImages(galleryData);
    }

    loadHomepageData();
  }, []);

  return (
    <main className="min-h-screen overflow-x-clip bg-[#f6fbfc] text-slate-950 dark:bg-[#08090d] dark:text-slate-100">
      {/* =========================================================
          GLOBAL BACKGROUND
      ========================================================= */}

      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#f6fbfc] dark:bg-[#08090d]">
        <div className="absolute left-[-180px] top-[100px] h-[520px] w-[520px] rounded-full bg-blue-300/35 blur-[130px] dark:bg-blue-700/15" />

        <div className="absolute left-[28%] top-[120px] h-[430px] w-[430px] rounded-full bg-cyan-200/30 blur-[125px] dark:bg-cyan-700/10" />

        <div className="absolute right-[-160px] top-[170px] h-[520px] w-[520px] rounded-full bg-emerald-300/35 blur-[140px] dark:bg-emerald-700/10" />

        <div className="absolute bottom-[-180px] left-[35%] h-[450px] w-[450px] rounded-full bg-sky-200/30 blur-[130px] dark:bg-sky-700/10" />

        <div className="absolute left-[48%] top-[42%] h-[280px] w-[280px] rounded-full bg-teal-200/20 blur-[110px] dark:bg-teal-700/10" />
      </div>

      {/* =========================================================
          HERO
      ========================================================= */}

      <section className="relative mx-auto w-full max-w-7xl overflow-hidden px-5 pb-12 pt-8 lg:px-8 lg:pb-16 lg:pt-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[760px] overflow-hidden">
          <div className="absolute left-[5%] top-[10%] h-[350px] w-[350px] rounded-full bg-blue-400/20 blur-[125px] dark:bg-blue-500/10" />

          <div className="absolute right-[5%] top-[10%] h-[400px] w-[400px] rounded-full bg-emerald-400/20 blur-[130px] dark:bg-emerald-500/10" />

          <div className="absolute left-[42%] top-[30%] h-[300px] w-[300px] rounded-full bg-cyan-300/20 blur-[110px] dark:bg-cyan-500/10" />
        </div>

        <div
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[650px] opacity-[0.25] dark:opacity-[0.1]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(100,116,139,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(100,116,139,0.08) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage:
              "linear-gradient(to bottom, black, transparent)",
            WebkitMaskImage:
              "linear-gradient(to bottom, black, transparent)",
          }}
        />

        <div className="relative w-full min-w-0 overflow-hidden rounded-[40px] border border-white/75 bg-white/35 p-2 shadow-[0_30px_100px_rgba(45,100,130,0.12)] backdrop-blur-2xl dark:border-white/[0.08] dark:bg-slate-900/30 dark:shadow-[0_30px_100px_rgba(0,0,0,0.25)]">
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[38px]">
            <div className="absolute left-[-100px] top-[-120px] h-[340px] w-[340px] rounded-full bg-blue-400/20 blur-[110px]" />

            <div className="absolute right-[-100px] top-[-80px] h-[360px] w-[360px] rounded-full bg-emerald-400/20 blur-[115px]" />

            <div className="absolute bottom-[-120px] left-[35%] h-[320px] w-[320px] rounded-full bg-cyan-300/15 blur-[110px]" />
          </div>

          <div className="relative min-w-0 rounded-[34px] border border-white/55 bg-white/25 px-5 py-7 backdrop-blur-xl dark:border-white/[0.05] dark:bg-slate-950/20 sm:px-8 sm:py-9 lg:px-10 lg:py-10">
            <div className="grid min-w-0 items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="relative min-w-0">
                <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-white/80 bg-white/75 px-3 py-2 text-[10px] font-semibold text-slate-600 shadow-[0_8px_30px_rgba(70,80,120,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/65 dark:text-slate-300 sm:px-4 sm:text-sm">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]" />

                  <span className="whitespace-nowrap">
                    Rajkiya Engineering College, Ambedkar Nagar
                  </span>
                </div>

                <h1 className="max-w-3xl text-4xl font-bold leading-[0.98] tracking-[-0.045em] text-slate-950 dark:text-white sm:text-6xl lg:text-7xl">
                  Where

                  <span className="relative block bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 bg-clip-text pb-3 text-transparent">
                    technology
                  </span>

                  meets{" "}

                  <span className="tc-innovation">
                    innovation.
                  </span>
                </h1>

                <div className="mt-2 flex items-center gap-2">
                  <span className="h-[3px] w-11 rounded-full bg-blue-500" />

                  <span className="h-[3px] w-7 rounded-full bg-cyan-500" />

                  <span className="h-[3px] w-5 rounded-full bg-emerald-500" />
                </div>

                <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-400 sm:text-lg">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Ideas start here. Skills grow here. Innovation
                    begins here.
                  </span>{" "}
                  The Technical Council brings together students
                  who love technology, engineering and building
                  things that matter.
                </p>

                <div className="mt-7 flex flex-row gap-2 sm:gap-3">
                  <Link
                    href="/events"
                    className="group relative inline-flex flex-1 items-center justify-center gap-1.5 overflow-hidden rounded-full bg-slate-950 px-4 py-3 text-xs font-semibold text-white shadow-[0_12px_35px_rgba(15,23,42,0.22)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(16,185,129,0.22)] sm:flex-none sm:gap-2 sm:px-6 sm:py-3.5 sm:text-sm dark:bg-white dark:text-slate-950"
                  >
                    <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-blue-500/0 via-white/20 to-emerald-500/0 transition-transform duration-700 group-hover:translate-x-full dark:via-slate-900/10" />

                    <span className="relative whitespace-nowrap">
                      Explore Events
                    </span>

                    <ArrowRight
                      size={15}
                      className="relative shrink-0 transition-transform group-hover:translate-x-1 sm:h-[17px] sm:w-[17px]"
                    />
                  </Link>

                  <Link
                    href="/team"
                    className="inline-flex flex-1 items-center justify-center rounded-full border border-white/80 bg-white/70 px-4 py-3 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-lg sm:flex-none sm:px-6 sm:py-3.5 sm:text-sm dark:border-white/10 dark:bg-slate-900/65 dark:text-slate-200 dark:hover:bg-slate-900"
                  >
                    <span className="whitespace-nowrap">
                      Meet the Team
                    </span>
                  </Link>
                </div>

                <div className="mt-8 flex w-full min-w-0 flex-nowrap gap-2 sm:gap-3">
                  <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-2xl border border-white/80 bg-white/65 px-2.5 py-3 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/55 sm:flex-none sm:gap-2 sm:px-4">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 sm:h-8 sm:w-8 sm:rounded-xl">
                      <Users
                        size={12}
                        className="sm:h-[15px] sm:w-[15px]"
                      />
                    </div>

                    <div className="min-w-0">
                      <span className="block text-sm font-bold leading-none text-slate-950 dark:text-white sm:text-lg">
                        30+
                      </span>

                      <span className="mt-1 block whitespace-nowrap text-[9px] text-slate-500 dark:text-slate-400 sm:text-xs">
                        Members
                      </span>
                    </div>
                  </div>

                  <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-2xl border border-white/80 bg-white/65 px-2.5 py-3 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/55 sm:flex-none sm:gap-2 sm:px-4">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400 sm:h-8 sm:w-8 sm:rounded-xl">
                      <CalendarDays
                        size={12}
                        className="sm:h-[15px] sm:w-[15px]"
                      />
                    </div>

                    <div className="min-w-0">
                      <span className="block text-sm font-bold leading-none text-slate-950 dark:text-white sm:text-lg">
                        5+
                      </span>

                      <span className="mt-1 block whitespace-nowrap text-[9px] text-slate-500 dark:text-slate-400 sm:text-xs">
                        Events
                      </span>
                    </div>
                  </div>

                  <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-2xl border border-white/80 bg-white/65 px-2.5 py-3 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/55 sm:flex-none sm:gap-2 sm:px-4">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 sm:h-8 sm:w-8 sm:rounded-xl">
                      <Sparkles
                        size={12}
                        className="sm:h-[15px] sm:w-[15px]"
                      />
                    </div>

                    <div className="min-w-0">
                      <span className="block text-sm font-bold leading-none text-slate-950 dark:text-white sm:text-lg">
                        1
                      </span>

                      <span className="mt-1 block whitespace-nowrap text-[9px] text-slate-500 dark:text-slate-400 sm:text-xs">
                        Community
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative min-w-0 w-full">
                <div className="pointer-events-none absolute -inset-8 rounded-[60px] bg-gradient-to-br from-blue-400/20 via-cyan-300/15 to-emerald-400/20 blur-3xl dark:from-blue-500/10 dark:via-cyan-500/10 dark:to-emerald-500/10" />

                <div className="relative min-w-0 w-full rounded-[34px] bg-gradient-to-br from-blue-300/50 via-cyan-300/30 to-emerald-300/50 p-[1px] shadow-[0_30px_90px_rgba(30,120,130,0.14)] dark:from-blue-500/20 dark:via-cyan-500/15 dark:to-emerald-500/20">
                  <GlassCard className="relative min-h-[390px] min-w-0 w-full overflow-hidden rounded-[33px] p-5 sm:min-h-[410px]">
                    <div className="absolute right-[-50px] top-[-50px] h-52 w-52 rounded-full bg-emerald-300/25 blur-[75px] dark:bg-emerald-700/10" />

                    <div className="absolute bottom-[-60px] left-[-50px] h-56 w-56 rounded-full bg-blue-300/25 blur-[75px] dark:bg-blue-700/10" />

                    <div className="absolute left-[35%] top-[30%] h-32 w-32 rounded-full bg-cyan-300/20 blur-[65px] dark:bg-cyan-700/10" />

                    <div className="relative flex min-h-[360px] min-w-0 flex-col justify-between">
                      <div className="flex min-w-0 items-center justify-between gap-3">
                        <span className="min-w-0 truncate rounded-full border border-white/60 bg-slate-100/80 px-3 py-1.5 text-[10px] font-bold tracking-wide text-slate-500 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-800/70 dark:text-slate-300">
                          TECHNICAL COUNCIL
                        </span>

                        <div className="flex shrink-0 gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full bg-red-300 shadow-sm" />

                          <span className="h-2.5 w-2.5 rounded-full bg-yellow-300 shadow-sm" />

                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-sm" />
                        </div>
                      </div>

                      <div className="flex min-h-0 flex-1 items-center justify-center overflow-visible py-3">
                        <div className="relative flex h-56 w-56 max-w-[calc(100vw-100px)] items-center justify-center rounded-[58px] border border-white/80 bg-white/55 shadow-[0_30px_70px_rgba(30,110,130,0.15)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-800/55 dark:shadow-[0_30px_70px_rgba(0,0,0,0.3)]">
                          <div className="absolute inset-6 rounded-[45px] bg-gradient-to-br from-blue-500/15 via-cyan-500/15 to-emerald-400/20" />

                          <div className="absolute inset-0 rounded-[58px] bg-gradient-to-br from-white/40 via-transparent to-transparent dark:from-white/[0.06] dark:via-transparent" />

                          <div className="relative flex h-28 w-28 items-center justify-center rounded-[34px] bg-gradient-to-br from-blue-500 via-cyan-500 to-emerald-500 text-white shadow-2xl shadow-cyan-500/25">
                            <Cpu
                              size={52}
                              strokeWidth={1.5}
                            />
                          </div>

                          <div className="absolute -right-4 top-10 rounded-2xl border border-white/80 bg-white/80 p-3 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-800/75">
                            <Code2
                              size={19}
                              className="text-blue-600 dark:text-blue-400"
                            />
                          </div>

                          <div className="absolute -bottom-4 left-7 rounded-2xl border border-white/80 bg-white/80 p-3 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-800/75">
                            <Sparkles
                              size={19}
                              className="text-emerald-600 dark:text-emerald-400"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="w-full min-w-0 rounded-3xl border border-white/80 bg-white/60 p-4 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-800/55">
                        <div className="text-lg font-bold text-slate-950 dark:text-white sm:text-xl">
                          Build. Learn. Innovate.
                        </div>

                        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400 sm:text-sm">
                          A space where curiosity turns into
                          capability and ideas turn into action.
                        </p>
                      </div>
                    </div>
                  </GlassCard>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          NOTICE BOARD
      ========================================================= */}

      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
          <GlassCard className="relative overflow-hidden p-6">
            <div className="absolute right-[-60px] top-[-60px] h-48 w-48 rounded-full bg-blue-300/25 blur-[70px] dark:bg-blue-700/10" />

            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                  <Megaphone size={20} />
                </div>

                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                  Live Updates
                </span>
              </div>

              <p className="mt-5 text-xs font-bold tracking-widest text-blue-600 dark:text-blue-400">
                NOTICE BOARD
              </p>

              <h2 className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">
                Don&apos;t miss what&apos;s next.
              </h2>

              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
                Important announcements, upcoming activities and
                council updates — all in one place.
              </p>
            </div>
          </GlassCard>

          <div className="grid gap-3 sm:grid-cols-3">
            {notices.map((notice, index) => {
              const hasAttachment =
                Boolean(notice.attachment_url?.trim()) &&
                Boolean(notice.attachment_text?.trim()) &&
                notice.attachment_enabled === true;

              return (
                <GlassCard
                  key={notice.id}
                  className="group flex min-h-[190px] flex-col p-4 transition duration-300 hover:-translate-y-1 hover:bg-white dark:hover:bg-slate-900/80"
                >
                  {/* TOP ROW — ICON + DATE */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                      {index === 0 ? (
                        <Megaphone size={17} />
                      ) : (
                        <CalendarDays size={17} />
                      )}
                    </div>

                    <span className="text-[9px] font-bold tracking-wide text-slate-400 dark:text-slate-500">
                      {formatNoticeDate(notice.date)}
                    </span>
                  </div>

                  {/* TITLE + VIEW DOCS */}
                  <div className="mt-4 flex items-start justify-between gap-3">
                    <h3 className="min-w-0 flex-1 text-base font-bold leading-6 text-slate-950 dark:text-white">
                      {notice.title}
                    </h3>

                    {hasAttachment && (
                      <a
                        href={notice.attachment_url!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex max-w-[45%] shrink-0 items-center gap-1.5 rounded-lg border border-blue-200/80 bg-blue-50/80 px-2.5 py-1.5 text-[9px] font-semibold text-blue-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-100 hover:shadow-md dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/15"
                      >
                        <span className="truncate">
                          {notice.attachment_text}
                        </span>

                        <ArrowRight
                          size={11}
                          className="shrink-0 transition-transform group-hover:translate-x-0.5"
                        />
                      </a>
                    )}
                  </div>

                  {/* DESCRIPTION */}
                  <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    {notice.description}
                  </p>
                </GlassCard>
              );
            })}

            {notices.length === 0 && (
              <GlassCard className="p-4 sm:col-span-3">
                <div className="flex min-h-[120px] items-center justify-center text-center">
                  <div>
                    <Megaphone className="mx-auto h-6 w-6 text-slate-300 dark:text-slate-600" />

                    <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
                      No published notices
                    </p>
                  </div>
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================
          EVENTS
      ========================================================= */}

      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        <div className="mb-7 flex items-end justify-between gap-5">
          <div>
            <p className="mb-1 text-xs font-bold tracking-widest text-cyan-600 dark:text-cyan-400">
              MARK YOUR CALENDAR
            </p>

            <h2 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
              What&apos;s coming up?
            </h2>

            <p className="mt-2 max-w-xl text-sm text-slate-500 dark:text-slate-400 sm:text-base">
              From first steps to bold ideas — there&apos;s always
              something happening.
            </p>
          </div>

          <Link
            href="/events"
            className="hidden items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 sm:flex"
          >
            See all
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {events.map((event, index) => {
            const eventDate = formatEventDate(event.date);

            return (
              <GlassCard
                key={event.id}
                className="group relative overflow-hidden p-5 transition duration-300 hover:-translate-y-1.5"
              >
                <div className="absolute right-4 top-3 text-6xl font-black text-slate-100 dark:text-slate-800/70">
                  0{index + 1}
                </div>

                <div className="relative">
                  <div className="flex items-start gap-4">
                    <div className="flex h-[68px] w-[76px] shrink-0 flex-col items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg dark:bg-white dark:text-slate-950">
                      {index === 0 ? (
                        <>
                          <span className="text-xl font-bold leading-none">
                            {eventDate.day}
                          </span>

                          <span className="mt-1 text-[9px] font-semibold uppercase tracking-widest text-slate-300 dark:text-slate-500">
                            {eventDate.month} {eventDate.year}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-base font-bold uppercase leading-none">
                            {eventDate.month}
                          </span>

                          <span className="mt-1 text-[9px] font-semibold tracking-widest text-slate-300 dark:text-slate-500">
                            {eventDate.year}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="min-w-0 pt-1">
                      {event.type && (
                        <span className="relative -left-3 top-2 inline-block max-w-full rounded-full bg-cyan-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400">
                          {event.type}
                        </span>
                      )}

                      <h3 className="mt-3 text-base font-bold text-slate-950 dark:text-white">
                        {event.title}
                      </h3>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {event.description ||
                      "Stay tuned for more details about this event."}
                  </p>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500">
                      <CalendarDays size={13} />

                      <span>
                        REC Ambedkar Nagar
                        {event.time ? ` · ${event.time}` : ""}
                      </span>
                    </div>

                    <Link
                      href="/events"
                      className="text-xs font-bold text-slate-900 transition group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400"
                    >
                      Details →
                    </Link>
                  </div>
                </div>
              </GlassCard>
            );
          })}

          {events.length === 0 && (
            <GlassCard className="p-6 lg:col-span-3">
              <div className="flex min-h-[180px] flex-col items-center justify-center text-center">
                <CalendarDays className="h-8 w-8 text-slate-300 dark:text-slate-600" />

                <h3 className="mt-4 text-base font-bold text-slate-950 dark:text-white">
                  No upcoming events
                </h3>

                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  New published events will appear here automatically.
                </p>
              </div>
            </GlassCard>
          )}
        </div>
      </section>

      {/* =========================================================
          GALLERY
      ========================================================= */}

      <section className="border-y border-slate-200/70 bg-white/35 dark:border-white/10 dark:bg-slate-900/20">
        <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
          <div className="mb-7 flex items-end justify-between gap-5">
            <div>
              <p className="mb-1 text-xs font-bold tracking-widest text-emerald-600 dark:text-emerald-400">
                CAPTURED MOMENTS
              </p>

              <h2 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                Ideas in action.
              </h2>

              <p className="mt-2 max-w-xl text-sm text-slate-500 dark:text-slate-400 sm:text-base">
                A glimpse of the people, moments and experiences
                shaping our technical journey.
              </p>
            </div>

            <Link
              href="/gallery"
              className="hidden items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 sm:flex"
            >
              View Gallery
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-[1.35fr_0.65fr]">
            <HomepageGallery images={galleryImages} />

            <div className="grid gap-4">
              <Link
                href="/gallery"
                className="group relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-gradient-to-br from-emerald-100 via-white to-blue-100 p-6 shadow-[0_18px_55px_rgba(60,70,120,0.08)] dark:border-white/10 dark:from-emerald-950/40 dark:via-slate-900 dark:to-blue-950/40"
              >
                <div className="relative z-10">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 text-emerald-600 shadow-sm dark:bg-slate-800/75 dark:text-emerald-400">
                    <Users size={21} />
                  </div>

                  <h3 className="mt-5 font-bold text-slate-950 dark:text-white">
                    People behind the ideas.
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    The community that makes it happen.
                  </p>
                </div>
              </Link>

              <Link
                href="/gallery"
                className="group relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-gradient-to-br from-cyan-100 via-white to-emerald-100 p-6 shadow-[0_18px_55px_rgba(60,70,120,0.08)] dark:border-white/10 dark:from-cyan-950/40 dark:via-slate-900 dark:to-emerald-950/40"
              >
                <div className="relative z-10">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 text-emerald-600 shadow-sm dark:bg-slate-800/75 dark:text-emerald-400">
                    <Sparkles size={21} />
                  </div>

                  <h3 className="mt-5 font-bold text-slate-950 dark:text-white">
                    Moments worth remembering.
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    Take a look at our journey.
                  </p>
                </div>
              </Link>
            </div>
          </div>

          <div className="mt-5 sm:hidden">
            <Link
              href="/gallery"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              View Full Gallery
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================
          TECHNICAL COMMUNITY
      ========================================================= */}

      <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
          <GlassCard className="relative overflow-hidden p-7">
            <div className="absolute bottom-[-80px] right-[-70px] h-56 w-56 rounded-full bg-blue-300/20 blur-[80px] dark:bg-blue-700/10" />

            <div className="relative">
              <span className="text-xs font-bold tracking-widest text-blue-600 dark:text-blue-400">
                WHY WE EXIST
              </span>

              <h2 className="mt-2 text-3xl font-bold leading-tight text-slate-950 dark:text-white">
                More than a council.

                <span className="block text-slate-400 dark:text-slate-600">
                  A place to grow.
                </span>
              </h2>

              <p className="mt-4 text-sm leading-6 text-slate-500 dark:text-slate-400">
                We create an environment where students can explore
                technology, collaborate with others and turn
                curiosity into real skills.
              </p>
            </div>
          </GlassCard>

          <div className="grid gap-4 sm:grid-cols-3">
            <GlassCard className="p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                <Cpu size={19} />
              </div>

              <h3 className="mt-4 text-sm font-bold text-slate-950 dark:text-white">
                Explore
              </h3>

              <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                Discover new technologies and possibilities.
              </p>
            </GlassCard>

            <GlassCard className="p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400">
                <Users size={19} />
              </div>

              <h3 className="mt-4 text-sm font-bold text-slate-950 dark:text-white">
                Collaborate
              </h3>

              <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                Learn together and build stronger ideas.
              </p>
            </GlassCard>

            <GlassCard className="p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                <Zap size={19} />
              </div>

              <h3 className="mt-4 text-sm font-bold text-slate-950 dark:text-white">
                Create
              </h3>

              <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                Turn concepts into something real.
              </p>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* =========================================================
          FINAL CTA
      ========================================================= */}

      <section className="mx-auto max-w-7xl px-5 pb-16 pt-4 lg:px-8">
        <div className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/75 p-7 shadow-[0_18px_55px_rgba(60,70,120,0.09)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/60 dark:shadow-[0_18px_55px_rgba(0,0,0,0.28)] sm:p-10">
          <div className="relative flex flex-col items-start justify-between gap-7 sm:flex-row sm:items-center">
            <div className="max-w-2xl">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                <Mail size={20} />
              </div>

              <h2 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                Have an idea?

                <span className="block text-slate-400 dark:text-slate-600">
                  Let&apos;s make it happen.
                </span>
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Questions, suggestions, collaborations or just want
                to say hello? We&apos;d love to hear from you.
              </p>
            </div>

            <Link
              href="/contact"
              className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white shadow-xl transition duration-300 hover:-translate-y-1 dark:bg-white dark:text-slate-950"
            >
              Get In Touch

              <ArrowRight
                size={17}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}