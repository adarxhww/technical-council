"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { EventCard, type EventItem } from "@/components/EventCard";

const events: EventItem[] = [
  {
    day: "AUG",
    month: "2026",
    date: "2026-08-20",
    title: "Tech Fusion !!",
    tag: "Welcome Ceremony",
    subtitle: "Chaos, Fun, and Fresh Beginnings!",
    description:
      "Dive into wild random mini-games, fun icebreakers, and spontaneous challenges. Laugh out loud and kickstart an amazing journey!.",
    duration: "3 Hours",
    venue: "Auditorium",
    // link: "https://www.youtube.com/",
  },
  {
    day: "SEP",
    month: "2026",
    date: "2026-09-15",
    title: "Aptitude Test",
    tag: "Competitive",
    subtitle: "Sharpen Your Mind, Outshine the Rest!",
    description:
      "Test your skills and challenge yourself to reach new heights. This assessment pushes your analytical boundaries and highlights your core strengths.",
    duration: "1 Hour",
    venue: "CSA Hall",
  },
  {
    day: "OCT",
    month: "2026",
    date: "2026-10-15",
    title: "Ideathon",
    tag: "Innovation Challenge",
    subtitle: "From Thought to Impact!",
    description:
      "Ideate, innovate, and implement because your unique idea can truly change the world. Dive into an intense brainstorming arena where creativity meets execution.",
    duration: "3 Hours",
    venue: "Auditorium",
  },
  {
    day: "NOV",
    month: "2026",
    date: "2026-11-15",
    title: "E-Sport",
    tag: "Gaming",
    subtitle: "Game On, Glory Awaits!",
    description:
      "Compete fiercely, conquer the opposition, and claim your crown as the ultimate gaming champion. Bring your absolute A-game to the digital arena.",
    duration: "3 Hours",
    venue: "SAC",
  },
  {
    day: "FEB",
    month: "2027",
    date: "2027-02-15",
    title: "Treasure Hunt",
    tag: "Adventure",
    subtitle: "Decode the Clues, Uncover the Mystery!",
    description:
      "Solve intricate puzzles, explore hidden corners, and experience the thrill of the ultimate hunt. Gather your team and race against the clock.",
    duration: "3 Hours",
    venue: "REC Campus",
  },
  {
    day: "-",
    month: "",
    date: "2027-02-15",
    title: "Kaun Banega Genius (KBG)",
    tag: "Intellectual Battle",
    subtitle: "The Ultimate Battle of Wits!",
    description:
      "Think critically, answer smartly, and win big because everyone wants to know if you are the next genius. Step onto the grand stage of knowledge.",
    duration: "2 Hours",
    venue: "To Be Announced",
  },
];

type Filter = "all" | "upcoming" | "completed";

export default function EventsPage() {
  const [activeFilter, setActiveFilter] = useState<Filter>("all");

  const today = new Date();

  const filteredEvents = events.filter((event) => {
    // Events without a date stay visible under All Events.
    if (!event.date) {
      return activeFilter === "all";
    }

    const eventDate = new Date(`${event.date}T23:59:59`);

    if (activeFilter === "upcoming") {
      return eventDate >= today;
    }

    if (activeFilter === "completed") {
      return eventDate < today;
    }

    return true;
  });

  return (
    <main className="events-page container pb-20 pt-16">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[34px] p-7 md:p-12">
        {/* Background glow */}
        <div className="blur-orb right-10 top-10 h-48 w-48 bg-blue-300 dark:bg-blue-500" />

        <div className="blur-orb right-1/3 top-20 h-40 w-40 bg-violet-300 dark:bg-violet-500" />

        {/* 3D Calendar Illustration */}
        <div className="pointer-events-none absolute right-0 top-8 z-0 opacity-75 md:right-0 md:top-8 md:opacity-100">
          <img
            src="/images/calendar-3d.png"
            alt="3D calendar illustration"
            className="h-48 w-48 -translate-x-0 -translate-y-8 object-contain md:h-72 md:w-72 md:-translate-y-10"
          />
        </div>

        {/* Heading */}
        <div className="relative z-10 max-w-2xl">
          <span
            className="
              mb-5 inline-flex items-center gap-2
              rounded-full bg-white px-4 py-2
              text-xs font-bold text-slate-900
              border border-white shadow-sm
              dark:bg-slate-900/60
              dark:text-slate-200
              dark:border-white/10
            "
          >
            <CalendarDays
              size={15}
              className="text-emerald-500"
            />
            Stay Updated, Get Involved
          </span>

          <h1 className="section-title text-slate-900 dark:text-white">
            Upcoming Events
          </h1>

          <p className="hero-description mt-5 text-lg leading-8 text-slate-500">
            Discover, learn and grow with our exciting technical events.
          </p>
        </div>
      </section>

      {/* Filters */}
      <div className="glass mb-7 flex flex-wrap gap-2 rounded-[24px] p-3">
        {[
          { label: "All Events", value: "all" as Filter },
          { label: "Upcoming", value: "upcoming" as Filter },
          { label: "Completed", value: "completed" as Filter },
        ].map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setActiveFilter(filter.value)}
            className={
              activeFilter === filter.value
                ? "btn-primary rounded-full px-4 py-2 text-sm font-bold"
                : "rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-700 soft-border dark:bg-white/10 dark:text-slate-200"
            }
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Events */}
      <div className="grid gap-4">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <EventCard
              key={event.title}
              event={event}
            />
          ))
        ) : (
          <div className="glass rounded-[28px] p-10 text-center">
            <h3 className="text-xl font-extrabold">
              No events found
            </h3>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              There are no events in this category yet.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}