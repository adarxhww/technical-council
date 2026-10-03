"use client";

import { Clock, MapPin } from "lucide-react";

export type EventButtonType =
  | "register_now"
  | "upcoming"
  | "closed"
  | "ended"
  | "custom";

export type EventButtonColor = "register" | "ended";

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

  buttonType: EventButtonType;

  customButtonText?: string | null;
  customButtonColor?: EventButtonColor | null;
  customButtonLink?: string | null;
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

  const isoMatch = dateValue.match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

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
      month:
        monthNames[Number(month) - 1] ??
        fallbackMonth,
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

function normalizeButtonType(
  value: unknown,
  customButtonText?: string | null
): EventButtonType {
  const validButtonTypes: EventButtonType[] = [
    "register_now",
    "upcoming",
    "closed",
    "ended",
    "custom",
  ];

  /*
   * If the database contains an unexpected or old
   * button type, use Register Now.
   */
  if (
    typeof value !== "string" ||
    !validButtonTypes.includes(
      value as EventButtonType
    )
  ) {
    return "register_now";
  }

  /*
   * A custom button must have custom text.
   * Otherwise use Register Now.
   */
  if (
    value === "custom" &&
    !customButtonText?.trim()
  ) {
    return "register_now";
  }

  return value as EventButtonType;
}

export function EventCard({
  event,
  onRegister,
}: EventCardProps) {
  const { month, year } = getMonthYear(
    event.date,
    event.day,
    event.month
  );

  /*
   * Normalize the button type coming from Supabase.
   */
  const buttonType = normalizeButtonType(
    event.buttonType,
    event.customButtonText
  );

  /*
   * Button text.
   */
  const buttonText =
    buttonType === "register_now"
      ? "Register Now →"
      : buttonType === "upcoming"
        ? "Upcoming"
        : buttonType === "closed"
          ? "Closed"
          : buttonType === "ended"
            ? "Ended"
            : event.customButtonText?.trim() ?? "";

  /*
   * Button color.
   *
   * Register Now:
   * blue → emerald gradient
   *
   * Upcoming:
   * blue → emerald gradient
   *
   * Custom:
   * admin-selected color
   *
   * Closed / Ended:
   * slate
   */
  const buttonColor =
    buttonType === "ended" ||
    buttonType === "closed" ||
    (buttonType === "custom" &&
      event.customButtonColor === "ended")
      ? "ended"
      : "register";

  /*
   * Disabled buttons.
   */
  const isDisabled =
    buttonType === "upcoming" ||
    buttonType === "closed" ||
    buttonType === "ended";

  function handleButtonClick() {
    if (isDisabled) {
      return;
    }

    /*
     * REGISTER NOW
     *
     * Uses the registration page linked
     * to this event.
     */
    if (buttonType === "register_now") {
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
      }

      return;
    }

    /*
     * CUSTOM BUTTON
     *
     * Uses the custom URL entered by admin.
     */
    if (buttonType === "custom") {
      if (event.customButtonLink) {
        window.open(
          event.customButtonLink,
          "_blank",
          "noopener,noreferrer"
        );
      }

      return;
    }
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
      <div className="flex w-full shrink-0 flex-row items-center justify-between gap-5 border-t border-slate-200 pt-4 dark:border-white/10 md:w-[330px] md:flex-row md:items-center md:justify-normal md:border-t-0 md:pt-0">
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

        {/* EVENT BUTTON */}
        <button
          type="button"
          onClick={handleButtonClick}
          disabled={isDisabled}
          className={`flex h-12 w-[150px] shrink-0 items-center justify-center overflow-hidden rounded-full font-bold text-white shadow-md transition-all duration-300 ${
            buttonColor === "ended"
              ? "bg-slate-500"
              : "bg-gradient-to-r from-blue-600 to-emerald-500 hover:opacity-95"
          } ${
            isDisabled
              ? "cursor-default"
              : "cursor-pointer"
          }`}
        >
          <span className="whitespace-nowrap text-sm font-bold">
            {buttonText}
          </span>
        </button>
      </div>
    </div>
  );
}