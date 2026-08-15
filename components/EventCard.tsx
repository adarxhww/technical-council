"use client";

import { Clock, MapPin } from "lucide-react";
import { useState } from "react";

export interface EventItem {
  day: string;
  month: string;
  date: string;
  title: string;
  tag: string;
  subtitle: string;
  description: string;
  duration: string;
  venue: string;
  link?: string;
}

export function EventCard({ event }: { event: EventItem }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isCompleted =
    event.date !== "" &&
    new Date(`${event.date}T23:59:59`) < new Date();

  return (
    <div className="glass card-hover flex flex-col items-start justify-between gap-6 rounded-[28px] p-6 md:flex-row md:items-center md:p-8">

      {/* Date Box & Content */}
      <div className="flex items-center gap-4 md:gap-6">

        {/* Date */}
        <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-white text-center shadow-sm soft-border dark:bg-slate-900/70 dark:border-white/10">
          <div>
            <div className="text-xl font-black tracking-wider text-slate-900 dark:text-white">
              {event.day}
            </div>

            <div className="text-xs font-bold text-slate-500 dark:text-slate-500">
              {event.month}
            </div>
          </div>
        </div>

        {/* Event Details */}
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2">

            {/* Event Title */}
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {event.title}
            </h3>

            {/* Tag */}
            <span className="rounded-full bg-blue-50 px-3 py-0.5 text-xs font-bold text-blue-600 soft-border dark:border-blue-400/20 dark:bg-blue-500/15 dark:text-blue-300">
              {event.tag}
            </span>
          </div>

          {/* Subtitle */}
          <p className="mb-1 text-sm font-bold text-slate-700 dark:text-slate-300">
            {event.subtitle}
          </p>

          {/* Description */}
          <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            {event.description}
          </p>
        </div>
      </div>

      {/* Meta & Action */}
      <div className="flex w-full flex-col items-start justify-between gap-6 border-t border-slate-200 pt-4 dark:border-white/10 md:w-auto md:flex-row md:items-center md:justify-end md:border-t-0 md:pt-0">

        {/* Time & Venue */}
        <div className="flex flex-col gap-1 text-xs font-medium text-slate-600 dark:text-slate-400">

          {/* Duration */}
          <div className="flex items-center gap-1.5">
            <Clock
              size={14}
              className="text-slate-500 dark:text-slate-500"
            />

            <span className="text-slate-600 dark:text-slate-400">
              {event.duration} Duration
            </span>
          </div>

          {/* Venue */}
          <div className="flex items-center gap-1.5">
            <MapPin
              size={14}
              className="text-emerald-500"
            />

            <span className="text-slate-600 dark:text-slate-400">
              {event.venue}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div
          onClick={() => {
            if (!isCompleted) {
              setIsExpanded(!isExpanded);
            }
          }}
          className={`flex h-12 shrink-0 items-center overflow-hidden rounded-full font-bold text-white shadow-md transition-all duration-300 ease-in-out ${
            isCompleted
              ? "cursor-default bg-slate-500 px-6"
              : `cursor-pointer bg-gradient-to-r from-blue-600 to-emerald-500 hover:opacity-95 ${
                  isExpanded
                    ? "max-w-[220px] px-6"
                    : "max-w-[150px] justify-center px-6"
                }`
          }`}
        >
          {isCompleted ? (
            <span className="whitespace-nowrap text-sm font-bold text-white">
              Ended
            </span>
          ) : event.link ? (
            <a
              href={event.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={`whitespace-nowrap text-sm font-bold text-white transition-all duration-300 hover:underline ${
                isExpanded
                  ? "opacity-100"
                  : "overflow-hidden opacity-90"
              }`}
            >
              Register Now →
            </a>
          ) : (
            <span
              className={`whitespace-nowrap text-sm font-bold text-white transition-all duration-300 ${
                isExpanded
                  ? "opacity-100"
                  : "overflow-hidden opacity-90"
              }`}
            >
              {isExpanded
                ? "Not Started Yet."
                : "Register Now →"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}