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

import { createClient } from "@/lib/supabase/server";

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
};

async function getUpcomingEvents(): Promise<Event[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("events")
    .select(
      "id, date, time, title, type, description, published"
    )
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
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notices")
    .select(
      "id, title, date, description, published"
    )
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(3);

  if (error) {
    console.error("Failed to load notices:", error);
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

export default async function Home() {
  const [events, notices] = await Promise.all([
    getUpcomingEvents(),
    getPublishedNotices(),
  ]);

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f9fc] text-slate-950 dark:bg-[#0b0b0b] dark:text-slate-100">
      {/* =========================================================
          BACKGROUND
      ========================================================= */}

      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#f7f9fc] dark:bg-[#0b0b0b]">
        <div className="absolute left-[-180px] top-[80px] h-[420px] w-[420px] rounded-full bg-blue-200/35 blur-[120px] dark:bg-blue-700/15" />

        <div className="absolute right-[-180px] top-[240px] h-[480px] w-[480px] rounded-full bg-violet-200/30 blur-[130px] dark:bg-violet-700/15" />

        <div className="absolute bottom-[-180px] left-[30%] h-[420px] w-[420px] rounded-full bg-sky-100/40 blur-[120px] dark:bg-sky-700/10" />
      </div>

      {/* =========================================================
          HERO
      ========================================================= */}

      <section className="mx-auto max-w-7xl px-5 pb-12 pt-12 lg:px-8 lg:pb-16 lg:pt-20">
        <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          {/* LEFT */}

          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-300 sm:text-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.7)]" />

              Rajkiya Engineering College, Ambedkar Nagar
            </div>

            <h1 className="max-w-3xl text-4xl font-bold leading-[0.98] tracking-[-0.045em] text-slate-950 dark:text-white sm:text-6xl lg:text-7xl">
              Where

              <span className="block bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-500 bg-clip-text pb-3 text-transparent">
                technology
              </span>

              meets innovation.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-400 sm:text-lg">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Ideas start here. Skills grow here. Innovation begins here.
              </span>{" "}
              The Technical Council brings together students who love
              technology, engineering and building things that matter.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/events"
                className="group inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-slate-900/15 transition duration-300 hover:-translate-y-1 dark:bg-white dark:text-slate-950"
              >
                Explore Events

                <ArrowRight
                  size={17}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>

              <Link
                href="/team"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                Meet the Team
              </Link>
            </div>

            {/* MINI STATS */}

            <div className="mt-8 flex flex-nowrap gap-3">
              {/* MEMBERS */}

              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-white/75 px-3 py-3 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/65 sm:flex-none sm:px-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                  <Users size={15} />
                </div>

                <div className="min-w-0">
                  <span className="block text-base font-bold leading-none text-slate-950 dark:text-white sm:text-lg">
                    30+
                  </span>

                  <span className="mt-1 block truncate text-[10px] text-slate-500 dark:text-slate-400 sm:text-xs">
                    Members
                  </span>
                </div>
              </div>

              {/* EVENTS */}

              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-white/75 px-3 py-3 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/65 sm:flex-none sm:px-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
                  <CalendarDays size={15} />
                </div>

                <div className="min-w-0">
                  <span className="block text-base font-bold leading-none text-slate-950 dark:text-white sm:text-lg">
                    5+
                  </span>

                  <span className="mt-1 block truncate text-[10px] text-slate-500 dark:text-slate-400 sm:text-xs">
                    Events
                  </span>
                </div>
              </div>

              {/* COMMUNITY */}

              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-white/75 px-3 py-3 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/65 sm:flex-none sm:px-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <Sparkles size={15} />
                </div>

                <div className="min-w-0">
                  <span className="block text-base font-bold leading-none text-slate-950 dark:text-white sm:text-lg">
                    1
                  </span>

                  <span className="mt-1 block truncate text-[10px] text-slate-500 dark:text-slate-400 sm:text-xs">
                    Community
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT HERO */}

          <div className="relative">
            <div className="absolute inset-12 rounded-full bg-blue-300/25 blur-[100px] dark:bg-blue-700/10" />

            <GlassCard className="relative min-h-[390px] overflow-hidden p-5 sm:min-h-[410px]">
              <div className="absolute right-[-50px] top-[-50px] h-52 w-52 rounded-full bg-violet-300/25 blur-[75px] dark:bg-violet-700/10" />

              <div className="absolute bottom-[-60px] left-[-50px] h-56 w-56 rounded-full bg-blue-300/25 blur-[75px] dark:bg-blue-700/10" />

              <div className="relative flex min-h-[360px] flex-col justify-between">
                {/* TOP BAR */}

                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-slate-100/90 px-3 py-1.5 text-[10px] font-bold tracking-wide text-slate-500 shadow-sm dark:bg-slate-800/80 dark:text-slate-300">
                    TECHNICAL COUNCIL
                  </span>

                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-300" />
                    <span className="h-2.5 w-2.5 rounded-full bg-green-300" />
                  </div>
                </div>

                {/* CENTER */}

                <div className="flex flex-1 items-center justify-center">
                  <div className="relative flex h-56 w-56 items-center justify-center rounded-[58px] border border-slate-200 bg-white/65 shadow-[0_30px_70px_rgba(70,90,160,0.15)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-800/60 dark:shadow-[0_30px_70px_rgba(0,0,0,0.3)]">
                    <div className="absolute inset-6 rounded-[45px] bg-gradient-to-br from-blue-500/15 via-violet-500/10 to-fuchsia-400/20" />

                    <div className="relative flex h-28 w-28 items-center justify-center rounded-[34px] bg-gradient-to-br from-blue-500 to-violet-600 text-white shadow-2xl shadow-violet-500/25">
                      <Cpu size={52} strokeWidth={1.5} />
                    </div>

                    <div className="absolute -right-4 top-10 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-800/85">
                      <Code2
                        size={19}
                        className="text-blue-600 dark:text-blue-400"
                      />
                    </div>

                    <div className="absolute -bottom-4 left-7 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-800/85">
                      <Sparkles
                        size={19}
                        className="text-violet-600 dark:text-violet-400"
                      />
                    </div>
                  </div>
                </div>

                {/* BOTTOM MESSAGE */}

                <div className="rounded-3xl border border-slate-200/80 bg-white/70 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-slate-800/65">
                  <div className="text-lg font-bold text-slate-950 dark:text-white sm:text-xl">
                    Build. Learn. Innovate.
                  </div>

                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400 sm:text-sm">
                    A space where curiosity turns into capability and ideas
                    turn into action.
                  </p>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* =========================================================
          NOTICE BOARD
      ========================================================= */}

      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
          {/* NOTICE INTRO */}

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
                Important announcements, upcoming activities and council
                updates — all in one place.
              </p>
            </div>
          </GlassCard>

          {/* NOTICES FROM SUPABASE */}

          <div className="grid gap-3 sm:grid-cols-3">
            {notices.map((notice, index) => (
              <GlassCard
                key={notice.id}
                className="group p-4 transition duration-300 hover:-translate-y-1 hover:bg-white dark:hover:bg-slate-900/80"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
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

                <h3 className="mt-4 text-sm font-bold leading-5 text-slate-950 dark:text-white">
                  {notice.title}
                </h3>

                <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  {notice.description}
                </p>
              </GlassCard>
            ))}

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
            <p className="mb-1 text-xs font-bold tracking-widest text-violet-600 dark:text-violet-400">
              MARK YOUR CALENDAR
            </p>

            <h2 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
              What&apos;s coming up?
            </h2>

            <p className="mt-2 max-w-xl text-sm text-slate-500 dark:text-slate-400 sm:text-base">
              From first steps to bold ideas — there&apos;s always something
              happening.
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
                {/* Decorative number */}

                <div className="absolute right-4 top-3 text-6xl font-black text-slate-100 dark:text-slate-800/70">
                  0{index + 1}
                </div>

                <div className="relative">
                  <div className="flex items-start gap-4">
                    {/* DATE */}
                    
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
      <span className="text-base font-bold leading-none uppercase">
        {eventDate.month}
      </span>

      <span className="mt-1 text-[9px] font-semibold tracking-widest text-slate-300 dark:text-slate-500">
        {eventDate.year}
      </span>
    </>
                       )}
                     </div>

                    {/* EVENT DETAILS */}

                    <div className="min-w-0 pt-1">
                      {event.type && (
                        <span className="relative -left-3 top-2 inline-block max-w-full rounded-full bg-violet-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
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
                A glimpse of the people, moments and experiences shaping our
                technical journey.
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

          {/* VISUAL GALLERY */}

          <div className="grid gap-4 md:grid-cols-[1.35fr_0.65fr]">
            {/* LARGE */}

            <Link
              href="/gallery"
              className="group relative h-[300px] overflow-hidden rounded-[28px] border border-slate-200/80 bg-gradient-to-br from-blue-100 via-white to-violet-100 shadow-[0_18px_55px_rgba(60,70,120,0.09)] dark:border-white/10 dark:from-blue-950/50 dark:via-slate-900 dark:to-violet-950/50"
            >
              <div className="absolute left-7 top-7 z-10">
                <span className="rounded-full bg-white/80 px-3 py-1.5 text-[10px] font-bold text-slate-600 shadow-sm backdrop-blur-xl dark:bg-slate-800/75 dark:text-slate-300">
                  TECHNICAL EVENTS
                </span>

                <h3 className="mt-3 text-2xl font-bold text-slate-950 dark:text-white">
                  Learn. Build. Share.
                </h3>
              </div>

              <div className="absolute bottom-[-35px] right-[-20px] flex h-56 w-56 rotate-[-8deg] items-center justify-center rounded-[55px] border border-slate-200 bg-white/55 shadow-2xl backdrop-blur-xl transition duration-500 group-hover:rotate-0 group-hover:scale-105 dark:border-white/10 dark:bg-slate-800/55">
                <Camera
                  size={75}
                  strokeWidth={1}
                  className="text-blue-500/70 dark:text-blue-400/70"
                />
              </div>

              <div className="absolute bottom-6 left-7 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                Explore the moments that make our community what it is.
              </div>
            </Link>

            {/* RIGHT STACK */}

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
                className="group relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-gradient-to-br from-violet-100 via-white to-fuchsia-100 p-6 shadow-[0_18px_55px_rgba(60,70,120,0.08)] dark:border-white/10 dark:from-violet-950/40 dark:via-slate-900 dark:to-fuchsia-950/40"
              >
                <div className="relative z-10">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 text-violet-600 shadow-sm dark:bg-slate-800/75 dark:text-violet-400">
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
          {/* LEFT MESSAGE */}

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
                technology, collaborate with others and turn curiosity into
                real skills.
              </p>
            </div>
          </GlassCard>

          {/* FEATURES */}

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
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
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
        <GlassCard className="relative overflow-hidden p-7 sm:p-10">
          <div className="absolute right-[-100px] top-[-140px] h-[330px] w-[330px] rounded-full bg-blue-300/25 blur-[100px] dark:bg-blue-700/10" />

          <div className="absolute bottom-[-130px] left-[25%] h-[280px] w-[280px] rounded-full bg-violet-300/20 blur-[100px] dark:bg-violet-700/10" />

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
                Questions, suggestions, collaborations or just want to say
                hello? We&apos;d love to hear from you.
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
        </GlassCard>
      </section>
    </main>
  );
}