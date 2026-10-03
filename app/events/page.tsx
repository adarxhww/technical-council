"use client";

import { useEffect, useMemo, useState } from "react";

import { CalendarDays } from "lucide-react";

import {
  EventCard,
  type EventItem,
  type EventButtonColor,
  type EventButtonType,
} from "@/components/EventCard";

import { createClient } from "@/lib/supabase/client";

type Filter = "all" | "upcoming" | "completed";

type SupabaseEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  type: string;
  description: string;
  published: boolean;
  registration_page_id: string | null;

  button_type: EventButtonType | null;
  custom_button_text: string | null;
  custom_button_color: EventButtonColor | null;
  custom_button_link: string | null;
};

type RegistrationPage = {
  id: string;
  slug: string;
  status: "draft" | "published" | "closed";
};

export default function EventsPage() {
  const supabase = useMemo(() => createClient(), []);

  const [activeFilter, setActiveFilter] =
    useState<Filter>("all");

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    setLoading(true);
    setError("");

    /*
     * Fetch public events.
     *
     * IMPORTANT:
     * Event date is used ONLY for the
     * All / Upcoming / Completed filters.
     *
     * The event button is controlled manually
     * through the button fields.
     */
    const {
      data: eventData,
      error: eventError,
    } = await supabase
      .from("events")
      .select(
        [
          "id",
          "title",
          "date",
          "time",
          "location",
          "type",
          "description",
          "published",
          "registration_page_id",
          "button_type",
          "custom_button_text",
          "custom_button_color",
          "custom_button_link",
        ].join(", ")
      )
      .eq("published", true)
      .order("date", {
        ascending: true,
      });

    if (eventError) {
      console.error(
        "Public events error:",
        eventError
      );

      setError("Unable to load events.");
      setEvents([]);
      setLoading(false);

      return;
    }

    /*
     * Fetch published registration pages.
     *
     * The event's registration_page_id determines
     * which registration form belongs to Register Now.
     */
    const {
      data: registrationData,
      error: registrationError,
    } = await supabase
      .from("registration_pages")
      .select("id, slug, status")
      .eq("status", "published");

    if (registrationError) {
      console.error(
        "Registration pages error:",
        registrationError
      );
    }

    const registrations =
      (registrationData ?? []) as RegistrationPage[];

    const registrationMap = new Map<
      string,
      RegistrationPage
    >();

    registrations.forEach((registration) => {
      registrationMap.set(
        registration.id,
        registration
      );
    });

    const mappedEvents: EventItem[] = (
      (eventData ?? []) as SupabaseEvent[]
    ).map((event) => {
      /*
       * Select only the registration page explicitly
       * linked to this event.
       */
      const registration = event.registration_page_id
        ? registrationMap.get(
            event.registration_page_id
          )
        : undefined;

      /*
       * Normalize the button configuration.
       *
       * If the database contains an old/invalid custom
       * configuration without custom text, treat it as
       * Register Now instead of rendering an empty button.
       */
      const hasCustomButtonText =
        Boolean(event.custom_button_text?.trim());

      const buttonType: EventButtonType =
        event.button_type === "custom" &&
        !hasCustomButtonText
          ? "register_now"
          : event.button_type ?? "register_now";

      return {
        id: event.id,

        day: getDay(event.date),

        month: getMonthAndYear(event.date),

        date: event.date,

        title: event.title,

        tag: event.type,

        subtitle: getSubtitle(event.description),

        description: event.description,

        /*
         * Keep the database time as the actual time
         * property so EventCard can display it.
         */
        time: event.time,

        /*
         * Keep duration available as well.
         */
        duration: event.time,

        venue: event.location,

        /*
         * Register Now uses the registration page
         * explicitly linked to this event.
         */
        link: registration
          ? `/events/${registration.slug}/register`
          : undefined,

        /*
         * Manual button configuration.
         */
        buttonType,

        customButtonText:
          event.custom_button_text,

        customButtonColor:
          event.custom_button_color,

        customButtonLink:
          event.custom_button_link,
      };
    });

    setEvents(mappedEvents);
    setLoading(false);
  }

  /*
   * DATE FILTERING ONLY
   *
   * This does NOT control the event button.
   */
  const today = new Date();

  const filteredEvents = events.filter((event) => {
    if (!event.date) {
      return activeFilter === "all";
    }

    const eventDate = parseEventDate(event.date);

    if (!eventDate) {
      return activeFilter === "all";
    }

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
            className="h-48 w-48 -translate-y-8 object-contain md:h-72 md:w-72 md:-translate-y-10"
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
            Discover, learn and grow with our exciting
            technical events.
          </p>
        </div>
      </section>

      {/* Filters */}
      <div className="glass mb-7 flex flex-wrap gap-2 rounded-[24px] p-3">
        {[
          {
            label: "All Events",
            value: "all" as Filter,
          },
          {
            label: "Upcoming",
            value: "upcoming" as Filter,
          },
          {
            label: "Completed",
            value: "completed" as Filter,
          },
        ].map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() =>
              setActiveFilter(filter.value)
            }
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
        {loading ? (
          <div className="glass rounded-[28px] p-10 text-center">
            <h3 className="text-xl font-extrabold">
              Loading events...
            </h3>
          </div>
        ) : error ? (
          <div className="glass rounded-[28px] p-10 text-center">
            <h3 className="text-xl font-extrabold">
              Unable to load events
            </h3>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Please try again later.
            </p>
          </div>
        ) : filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <EventCard
              key={event.id}
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

function parseEventDate(value: string) {
  if (!value) {
    return null;
  }

  // ISO date: 2026-09-15
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = new Date(
      `${value}T23:59:59`
    );

    return Number.isNaN(parsed.getTime())
      ? null
      : parsed;
  }

  // Existing long date format:
  // 28 September 2026
  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime())
    ? null
    : parsed;
}

function getDay(value: string) {
  const date = parseEventDate(value);

  if (!date) {
    return "-";
  }

  return date
    .getDate()
    .toString()
    .padStart(2, "0");
}

function getMonthAndYear(value: string) {
  const date = parseEventDate(value);

  if (!date) {
    return "";
  }

  const month = date
    .toLocaleDateString("en-US", {
      month: "short",
    })
    .toUpperCase();

  const year = date.getFullYear();

  return `${month} ${year}`;
}

function getSubtitle(description: string) {
  if (!description) {
    return "";
  }

  const firstSentence = description
    .split(/[.!?]/)[0]
    .trim();

  return firstSentence
    ? `${firstSentence}!`
    : "";
}