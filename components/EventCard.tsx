"use client";

import { Clock, MapPin } from "lucide-react";
import { useState } from "react";

export interface EventItem {
  id?: string;
  day: string;
  month: string;
  date: string;
  title: string;
  tag: string;
  subtitle: string;
  description: string;
  duration: string;
  venue: string;
  time?: string;
  link?: string;
}

interface EventCardProps {
  event: EventItem;
  onRegister?: (event: EventItem) => void;
}

function getMonthYear(
  dateValue: string,
  fallbackMonth: string,
  fallbackYear: string
) {
  if (!dateValue) {
    return {
      month: fallbackMonth,
      year: fallbackYear,
    };
  }

  const isoMatch = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (isoMatch) {
    const [, year, month] = isoMatch;

    const monthNames = [
      "JAN",
      "FEB",
      "MAR",
      "APR",
      "MAY",
      "JUN",
      "JUL",
      "AUG",
      "SEP",
      "OCT",
      "NOV",
      "DEC",
    ];

    return {
      month: monthNames[Number(month) - 1] ?? fallbackMonth,
      year,
    };
  }

  const parsed = new Date(dateValue);

  if (!Number.isNaN(parsed.getTime())) {
    return {
      month: parsed
        .toLocaleString("en-US", {
          month: "short",
        })
        .toUpperCase(),
      year: parsed.getFullYear().toString(),
    };
  }

  return {
    month: fallbackMonth,
    year: fallbackYear,
  };
}

export function EventCard({
  event,
  onRegister,
}: EventCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isCompleted =
    event.date !== "" &&
    new Date(`${event.date}T23:59:59`) < new Date();

  const { month, year } = getMonthYear(
    event.date,
    event.day,
    event.month
  );

  function handleRegister() {
    if (isCompleted) {
      return;
    }

    if (onRegister) {
      onRegister(event);
      return;
    }

    if (event.link) {
      window.open(
        event.link,
        "_blank",
        "noopener,noreferrer"
      );
      return;
    }

    setIsExpanded((current) => !current);
  }

  return (
    <div className="glass card-hover flex flex-col gap-6 rounded-[28px] p-6 md:flex-row md:items-center md:p-8">

      {/* LEFT — DATE + EVENT INFORMATION */}
      <div className="flex min-w-0 flex-1 items-center gap-4 md:gap-6">

        {/* MONTH + YEAR */}
        <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-white text-center shadow-sm soft-border dark:border-white/10 dark:bg-slate-900/70">
          <div>
            <div className="text-xl font-black tracking-wider text-slate-900 dark:text-white">
              {month}
            </div>

            <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {year}
            </div>
          </div>
        </div>

        {/* EVENT DETAILS */}
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {event.title}
            </h3>

            <span className="rounded-full bg-blue-50 px-3 py-0.5 text-xs font-bold text-blue-600 soft-border dark:border-blue-400/20 dark:bg-blue-500/15 dark:text-blue-300">
              {event.tag}
            </span>
          </div>

          <p className="mb-1 text-sm font-bold text-slate-700 dark:text-slate-300">
            {event.subtitle}
          </p>

          <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            {event.description}
          </p>
        </div>
      </div>

      {/* RIGHT — FIXED WIDTH META + BUTTON */}
      <div className="flex shrink-0 flex-col gap-5 border-t border-slate-200 pt-4 dark:border-white/10 md:w-[330px] md:flex-row md:items-center md:border-t-0 md:pt-0">

        {/* TIME + VENUE */}
        <div className="grid w-[140px] shrink-0 grid-cols-[20px_1fr] gap-x-2 gap-y-2">

          {/* TIME ICON */}
          <Clock
            size={16}
            className="mt-0.5 text-slate-500 dark:text-slate-400"
          />

          {/* TIME */}
          <span className="whitespace-nowrap text-xs font-medium leading-5 text-slate-600 dark:text-slate-400">
            {event.time || "Time TBA"}
          </span>

          {/* VENUE ICON */}
          <MapPin
            size={16}
            className="mt-0.5 text-emerald-500"
          />

          {/* VENUE */}
          <span className="whitespace-nowrap text-xs font-medium leading-5 text-slate-600 dark:text-slate-400">
            {event.venue || "Venue TBA"}
          </span>
        </div>

        {/* REGISTER BUTTON */}
        <button
          type="button"
          onClick={handleRegister}
          disabled={isCompleted}
          className={`flex h-12 shrink-0 items-center justify-center overflow-hidden rounded-full font-bold text-white shadow-md transition-all duration-300 ${
            isCompleted
              ? "cursor-default bg-slate-500 px-6"
              : `cursor-pointer bg-gradient-to-r from-blue-600 to-emerald-500 hover:opacity-95 ${
                  isExpanded
                    ? "w-[180px]"
                    : "w-[150px]"
                }`
          }`}
        >
          {isCompleted ? (
            <span className="whitespace-nowrap text-sm font-bold">
              Ended
            </span>
          ) : (
            <span className="whitespace-nowrap text-sm font-bold">
              {isExpanded
                ? "Not Started Yet."
                : "Register Now →"}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}