"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type ButtonType =
  | "register_now"
  | "upcoming"
  | "closed"
  | "ended"
  | "custom";

type ButtonColor = "register" | "ended";

type EventItem = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  type: string;
  description: string;
  published: boolean;

  button_type: ButtonType;
  custom_button_text: string | null;
  custom_button_color: ButtonColor | null;
  custom_button_link: string | null;

  registration_page_id: string | null;
};

type RegistrationPage = {
  id: string;
  slug: string;
  status: "draft" | "published" | "closed";
};

export default function EventsPage() {
  const supabase = useMemo(() => createClient(), []);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [registrationPages, setRegistrationPages] = useState<
    RegistrationPage[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] =
    useState<EventItem | null>(null);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");

  // Registration form
  const [registrationPageId, setRegistrationPageId] =
    useState("");

  // Public button configuration
  const [buttonType, setButtonType] =
    useState<ButtonType>("register_now");

  const [customButtonText, setCustomButtonText] =
    useState("");

  const [customButtonColor, setCustomButtonColor] =
    useState<ButtonColor>("register");

  const [customButtonLink, setCustomButtonLink] =
    useState("");

  useEffect(() => {
    loadEvents();
    loadRegistrationPages();
  }, []);

  async function loadEvents() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
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
          "button_type",
          "custom_button_text",
          "custom_button_color",
          "custom_button_link",
          "registration_page_id",
        ].join(", ")
      )
      .order("date", {
        ascending: true,
      });

    if (error) {
      console.error("Events load error:", error);
      setError(error.message);
      setEvents([]);
    } else {
      setEvents((data ?? []) as EventItem[]);
    }

    setLoading(false);
  }

  async function loadRegistrationPages() {
    const { data, error } = await supabase
      .from("registration_pages")
      .select("id, slug, status")
      .in("status", ["published", "closed"])
      .order("slug", {
        ascending: true,
      });

    if (error) {
      console.error(
        "Registration pages load error:",
        error
      );

      setRegistrationPages([]);
      return;
    }

    setRegistrationPages(
      (data ?? []) as RegistrationPage[]
    );
  }

  function resetForm() {
    setTitle("");
    setDate("");
    setTime("");
    setLocation("");
    setType("");
    setDescription("");

    setRegistrationPageId("");

    setButtonType("register_now");
    setCustomButtonText("");
    setCustomButtonColor("register");
    setCustomButtonLink("");

    setEditingEvent(null);
  }

  function openAddModal() {
    resetForm();
    setError("");
    setShowModal(true);
  }

  function openEditModal(event: EventItem) {
    setError("");
    setEditingEvent(event);

    setTitle(event.title);
    setDate(event.date);
    setTime(event.time);
    setLocation(event.location);
    setType(event.type);
    setDescription(event.description);

    setRegistrationPageId(
      event.registration_page_id ?? ""
    );

    setButtonType(
      event.button_type ?? "register_now"
    );

    setCustomButtonText(
      event.custom_button_text ?? ""
    );

    setCustomButtonColor(
      event.custom_button_color ?? "register"
    );

    setCustomButtonLink(
      event.custom_button_link ?? ""
    );

    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    resetForm();
  }

  async function saveEvent() {
    const cleanTitle = title.trim();
    const cleanDate = date.trim();
    const cleanTime = time.trim();
    const cleanLocation = location.trim();
    const cleanType = type.trim();
    const cleanDescription = description.trim();

    const cleanCustomButtonText =
      customButtonText.trim();

    const cleanCustomButtonLink =
      customButtonLink.trim();

    if (
      !cleanTitle ||
      !cleanDate ||
      !cleanTime ||
      !cleanLocation ||
      !cleanType ||
      !cleanDescription
    ) {
      setError(
        "Please fill in all required event fields."
      );
      return;
    }

    if (
      buttonType === "custom" &&
      (!cleanCustomButtonText ||
        !cleanCustomButtonLink)
    ) {
      setError(
        "Custom button text and custom button link are required."
      );
      return;
    }

    setSaving(true);
    setError("");

    /*
     * Button data is stored independently from the
     * registration form relationship.
     */
    const buttonData = {
      button_type: buttonType,

      custom_button_text:
        buttonType === "custom"
          ? cleanCustomButtonText
          : null,

      custom_button_color:
        buttonType === "custom"
          ? customButtonColor
          : null,

      custom_button_link:
        buttonType === "custom"
          ? cleanCustomButtonLink
          : null,
    };

    const eventData = {
      title: cleanTitle,
      date: cleanDate,
      time: cleanTime,
      location: cleanLocation,
      type: cleanType,
      description: cleanDescription,

      /*
       * Registration relationship stays independent
       * from the public button type.
       */
      registration_page_id:
        registrationPageId || null,

      ...buttonData,
    };

    if (editingEvent) {
      const { data, error } = await supabase
        .from("events")
        .update(eventData)
        .eq("id", editingEvent.id)
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
            "button_type",
            "custom_button_text",
            "custom_button_color",
            "custom_button_link",
            "registration_page_id",
          ].join(", ")
        )
        .single();

      if (error) {
        console.error(
          "Event update error:",
          error
        );

        setError(error.message);
        setSaving(false);
        return;
      }

      setEvents((current) =>
        current.map((event) =>
          event.id === editingEvent.id
            ? (data as EventItem)
            : event
        )
      );
    } else {
      const { data, error } = await supabase
        .from("events")
        .insert({
          ...eventData,
          published: false,
        })
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
            "button_type",
            "custom_button_text",
            "custom_button_color",
            "custom_button_link",
            "registration_page_id",
          ].join(", ")
        )
        .single();

      if (error) {
        console.error(
          "Event create error:",
          error
        );

        setError(error.message);
        setSaving(false);
        return;
      }

      setEvents((current) => [
        ...current,
        data as EventItem,
      ]);
    }

    setSaving(false);
    closeModal();
  }

  async function togglePublished(event: EventItem) {
    setError("");

    const nextPublished = !event.published;

    const { error } = await supabase
      .from("events")
      .update({
        published: nextPublished,
      })
      .eq("id", event.id);

    if (error) {
      console.error(
        "Event publish update error:",
        error
      );

      setError(error.message);
      return;
    }

    setEvents((current) =>
      current.map((item) =>
        item.id === event.id
          ? {
              ...item,
              published: nextPublished,
            }
          : item
      )
    );
  }

  async function deleteEvent(event: EventItem) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${event.title}"?`
    );

    if (!confirmed) {
      return;
    }

    setError("");

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", event.id);

    if (error) {
      console.error(
        "Event delete error:",
        error
      );

      setError(error.message);
      return;
    }

    setEvents((current) =>
      current.filter(
        (item) => item.id !== event.id
      )
    );
  }

  const publishedCount = events.filter(
    (event) => event.published
  ).length;

  const hiddenCount =
    events.length - publishedCount;

  const filteredEvents = events.filter(
    (event) => {
      const query = search
        .toLowerCase()
        .trim();

      if (!query) {
        return true;
      }

      return (
        event.title
          .toLowerCase()
          .includes(query) ||
        event.type
          .toLowerCase()
          .includes(query) ||
        event.location
          .toLowerCase()
          .includes(query) ||
        event.date
          .toLowerCase()
          .includes(query) ||
        event.description
          .toLowerCase()
          .includes(query)
      );
    }
  );

  return (
    <div className="min-h-screen w-full bg-transparent">
      <div className="w-full px-5 py-7 sm:px-8 lg:px-10 lg:py-9">
        <div className="mx-auto w-full max-w-[1500px]">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Link
                href="/admin"
                className="mb-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-950"
              >
                <ArrowLeft size={16} />
                Back to Dashboard
              </Link>

              <p className="mb-1 text-sm font-medium text-slate-500">
                Admin Portal
              </p>

              <h1 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                Events
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Create, edit and manage Technical Council events.
              </p>
            </div>

            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-emerald-600 hover:to-blue-700"
            >
              <Plus size={17} />
              Add Event
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          )}

          {/* Stats */}
          <section className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Total Events
                  </p>

                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                    {events.length}
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <CalendarDays size={19} />
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-400">
                All scheduled events
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Published
                  </p>

                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                    {publishedCount}
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <CheckCircle2 size={19} />
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-400">
                Visible on the website
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Hidden
                  </p>

                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                    {hiddenCount}
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <EyeOff size={19} />
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-400">
                Not visible to visitors
              </p>
            </div>
          </section>

          {/* Events */}
          <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-950">
                  All Events
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Manage events displayed across the Technical Council website.
                </p>
              </div>

              <div className="relative w-full lg:w-72">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search events..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/[0.08]"
                />
              </div>
            </div>

            <div className="space-y-3 p-5">
              {loading ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                  <p className="text-sm font-semibold text-slate-600">
                    Loading events...
                  </p>
                </div>
              ) : (
                <>
                  {filteredEvents.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 transition hover:bg-white hover:shadow-sm"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm">
                            <CalendarDays size={17} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-sm font-semibold text-slate-900">
                                {event.title}
                              </h3>

                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                                {event.type}
                              </span>

                              <span
                                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                  event.published
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {event.published
                                  ? "Published"
                                  : "Hidden"}
                              </span>
                            </div>

                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
                                <CalendarDays size={13} />
                                {formatDisplayDate(event.date)}
                              </span>

                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
                                <Clock3 size={13} />
                                {event.time}
                              </span>

                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
                                <MapPin size={13} />
                                {event.location}
                              </span>
                            </div>

                            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-500">
                              {event.description}
                            </p>

                            {/* Registration form status */}
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                Registration
                              </span>

                              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                                {getRegistrationPageLabel(
                                  event.registration_page_id,
                                  registrationPages
                                )}
                              </span>
                            </div>

                            {/* Button status */}
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                Public Button
                              </span>

                              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-600">
                                {getButtonTypeLabel(
                                  event.button_type,
                                  event.custom_button_text
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2 lg:ml-6">
                          <button
                            type="button"
                            onClick={() =>
                              togglePublished(event)
                            }
                            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                              event.published
                                ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                          >
                            {event.published ? (
                              <>
                                <EyeOff size={14} />
                                Hide
                              </>
                            ) : (
                              <>
                                <Eye size={14} />
                                Publish
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(event)
                            }
                            title="Edit event"
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm transition hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              deleteEvent(event)
                            }
                            title="Delete event"
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm transition hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredEvents.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                      <CalendarDays
                        size={30}
                        className="mx-auto text-slate-300"
                      />

                      <p className="mt-4 text-sm font-semibold text-slate-600">
                        {search
                          ? "No events found"
                          : "No events yet"}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {search
                          ? "Try a different search term."
                          : "Add your first event to get started."}
                      </p>

                      {!search && (
                        <button
                          type="button"
                          onClick={openAddModal}
                          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-emerald-600 hover:to-blue-700"
                        >
                          <Plus size={16} />
                          Add Event
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/30 p-5 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.20)]">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  {editingEvent
                    ? "Edit Event"
                    : "Add Event"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Add event information for the Technical Council website.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                aria-label="Close modal"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
              >
                <X size={17} />
              </button>
            </div>

            <div className="max-h-[70vh] space-y-5 overflow-y-auto p-5">
              {/* Event Title */}
              <div>
                <label
                  htmlFor="event-title"
                  className="mb-2 block text-xs font-semibold text-slate-500"
                >
                  Event Title
                </label>

                <input
                  id="event-title"
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  placeholder="e.g. Technical Council Orientation"
                  autoFocus
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/[0.08]"
                />
              </div>

              {/* Date + Time */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="event-date"
                    className="mb-2 block text-xs font-semibold text-slate-500"
                  >
                    Date
                  </label>

                  <input
                    id="event-date"
                    type="date"
                    value={date}
                    onChange={(event) =>
                      setDate(event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/[0.08]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="event-time"
                    className="mb-2 block text-xs font-semibold text-slate-500"
                  >
                    Time
                  </label>

                  <input
                    id="event-time"
                    value={time}
                    onChange={(event) =>
                      setTime(event.target.value)
                    }
                    placeholder="e.g. 10:00 AM"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/[0.08]"
                  />
                </div>
              </div>

              {/* Location + Type */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="event-location"
                    className="mb-2 block text-xs font-semibold text-slate-500"
                  >
                    Location
                  </label>

                  <input
                    id="event-location"
                    value={location}
                    onChange={(event) =>
                      setLocation(event.target.value)
                    }
                    placeholder="e.g. Seminar Hall"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/[0.08]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="event-type"
                    className="mb-2 block text-xs font-semibold text-slate-500"
                  >
                    Event Type
                  </label>

                  <input
                    id="event-type"
                    value={type}
                    onChange={(event) =>
                      setType(event.target.value)
                    }
                    placeholder="e.g. Workshop"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/[0.08]"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="event-description"
                  className="mb-2 block text-xs font-semibold text-slate-500"
                >
                  Description
                </label>

                <textarea
                  id="event-description"
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                  rows={4}
                  placeholder="Write a short description of the event..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/[0.08]"
                />
              </div>

              {/* REGISTRATION FORM */}
              <div className="border-t border-slate-100 pt-5">
                <div className="mb-3">
                  <p className="text-sm font-semibold text-slate-900">
                    Registration Form
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Select the registration form that should open when this event uses the Register Now button.
                  </p>
                </div>

                <select
                  value={registrationPageId}
                  onChange={(event) =>
                    setRegistrationPageId(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/[0.08]"
                >
                  <option value="">
                    No registration form linked
                  </option>

                  {registrationPages.map(
                    (registrationPage) => (
                      <option
                        key={registrationPage.id}
                        value={registrationPage.id}
                      >
                        {registrationPage.slug}
                        {registrationPage.status ===
                        "closed"
                          ? " — Closed"
                          : ""}
                      </option>
                    )
                  )}
                </select>

                {registrationPages.length === 0 && (
                  <p className="mt-2 text-xs text-amber-600">
                    No published or closed registration forms are available.
                  </p>
                )}

                {registrationPageId && (
                  <p className="mt-2 text-xs text-slate-400">
                    The selected form remains linked to this event even if the public button is changed to Upcoming, Closed, Ended, or Custom.
                  </p>
                )}
              </div>

              {/* PUBLIC BUTTON CONFIGURATION */}
              <div className="border-t border-slate-100 pt-5">
                <div className="mb-3">
                  <p className="text-sm font-semibold text-slate-900">
                    Public Event Button
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Choose manually which button visitors should see. The event date does not change this button.
                  </p>
                </div>

                <div className="space-y-2">
                  {/* Register Now */}
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:bg-white">
                    <input
                      type="radio"
                      name="button-type"
                      value="register_now"
                      checked={
                        buttonType ===
                        "register_now"
                      }
                      onChange={() =>
                        setButtonType(
                          "register_now"
                        )
                      }
                      className="h-4 w-4 accent-blue-600"
                    />

                    <span className="text-sm font-semibold text-slate-700">
                      Register Now
                    </span>

                    <span className="ml-auto rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 px-3 py-1 text-[10px] font-bold text-white">
                      Register Now →
                    </span>
                  </label>

                  {/* Upcoming */}
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:bg-white">
                    <input
                      type="radio"
                      name="button-type"
                      value="upcoming"
                      checked={
                        buttonType ===
                        "upcoming"
                      }
                      onChange={() =>
                        setButtonType(
                          "upcoming"
                        )
                      }
                      className="h-4 w-4 accent-blue-600"
                    />

                    <span className="text-sm font-semibold text-slate-700">
                      Upcoming
                    </span>

                    <span className="ml-auto rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 px-3 py-1 text-[10px] font-bold text-white">
                      Upcoming
                    </span>
                  </label>

                  {/* Closed */}
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:bg-white">
                    <input
                      type="radio"
                      name="button-type"
                      value="closed"
                      checked={
                        buttonType ===
                        "closed"
                      }
                      onChange={() =>
                        setButtonType(
                          "closed"
                        )
                      }
                      className="h-4 w-4 accent-blue-600"
                    />

                    <span className="text-sm font-semibold text-slate-700">
                      Closed
                    </span>

                    <span className="ml-auto rounded-full bg-slate-500 px-3 py-1 text-[10px] font-bold text-white">
                      Closed
                    </span>
                  </label>

                  {/* Ended */}
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:bg-white">
                    <input
                      type="radio"
                      name="button-type"
                      value="ended"
                      checked={
                        buttonType ===
                        "ended"
                      }
                      onChange={() =>
                        setButtonType(
                          "ended"
                        )
                      }
                      className="h-4 w-4 accent-blue-600"
                    />

                    <span className="text-sm font-semibold text-slate-700">
                      Ended
                    </span>

                    <span className="ml-auto rounded-full bg-slate-500 px-3 py-1 text-[10px] font-bold text-white">
                      Ended
                    </span>
                  </label>

                  {/* Custom */}
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:bg-white">
                    <input
                      type="radio"
                      name="button-type"
                      value="custom"
                      checked={
                        buttonType ===
                        "custom"
                      }
                      onChange={() =>
                        setButtonType(
                          "custom"
                        )
                      }
                      className="h-4 w-4 accent-blue-600"
                    />

                    <span className="text-sm font-semibold text-slate-700">
                      Custom
                    </span>

                    <span className="ml-auto rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 px-3 py-1 text-[10px] font-bold text-white">
                      Custom
                    </span>
                  </label>
                </div>

                {/* Custom Button Settings */}
                {buttonType === "custom" && (
                  <div className="mt-4 space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    {/* Custom Text */}
                    <div>
                      <label
                        htmlFor="custom-button-text"
                        className="mb-2 block text-xs font-semibold text-slate-500"
                      >
                        Button Text
                      </label>

                      <input
                        id="custom-button-text"
                        value={customButtonText}
                        onChange={(event) =>
                          setCustomButtonText(
                            event.target.value
                          )
                        }
                        placeholder="e.g. View Details"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/[0.08]"
                      />
                    </div>

                    {/* Custom Link */}
                    <div>
                      <label
                        htmlFor="custom-button-link"
                        className="mb-2 block text-xs font-semibold text-slate-500"
                      >
                        Button Link / Action
                      </label>

                      <input
                        id="custom-button-link"
                        value={customButtonLink}
                        onChange={(event) =>
                          setCustomButtonLink(
                            event.target.value
                          )
                        }
                        placeholder="e.g. https://example.com"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/[0.08]"
                      />
                    </div>

                    {/* Custom Color */}
                    <div>
                      <p className="mb-2 text-xs font-semibold text-slate-500">
                        Button Color
                      </p>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                          <input
                            type="radio"
                            name="custom-button-color"
                            value="register"
                            checked={
                              customButtonColor ===
                              "register"
                            }
                            onChange={() =>
                              setCustomButtonColor(
                                "register"
                              )
                            }
                            className="h-4 w-4 accent-blue-600"
                          />

                          <div className="flex min-w-0 flex-1 flex-col gap-2">
                            <span className="text-xs font-semibold text-slate-700">
                              Register Now Color
                            </span>

                            <span className="h-7 w-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-500" />
                          </div>
                        </label>

                        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                          <input
                            type="radio"
                            name="custom-button-color"
                            value="ended"
                            checked={
                              customButtonColor ===
                              "ended"
                            }
                            onChange={() =>
                              setCustomButtonColor(
                                "ended"
                              )
                            }
                            className="h-4 w-4 accent-blue-600"
                          />

                          <div className="flex min-w-0 flex-1 flex-col gap-2">
                            <span className="text-xs font-semibold text-slate-700">
                              Ended Color
                            </span>

                            <span className="h-7 w-full rounded-full bg-slate-500" />
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Preview */}
                    <div className="border-t border-slate-200 pt-4">
                      <p className="mb-2 text-xs font-semibold text-slate-500">
                        Preview
                      </p>

                      <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white p-5">
                        <div
                          className={`flex h-12 w-[150px] items-center justify-center rounded-full text-sm font-bold text-white shadow-md ${
                            customButtonColor ===
                            "ended"
                              ? "bg-slate-500"
                              : "bg-gradient-to-r from-blue-600 to-emerald-500"
                          }`}
                        >
                          {customButtonText.trim() ||
                            "Enter Button Text"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-slate-950"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveEvent}
                disabled={
                  saving ||
                  !title.trim() ||
                  !date.trim() ||
                  !time.trim() ||
                  !location.trim() ||
                  !type.trim() ||
                  !description.trim() ||
                  (buttonType === "custom" &&
                    (!customButtonText.trim() ||
                      !customButtonLink.trim()))
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-emerald-600 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving
                  ? "Saving..."
                  : editingEvent
                    ? "Save Changes"
                    : "Add Event"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getButtonTypeLabel(
  buttonType: ButtonType | null | undefined,
  customButtonText?: string | null
) {
  switch (buttonType) {
    case "register_now":
      return "Register Now";

    case "upcoming":
      return "Upcoming";

    case "closed":
      return "Closed";

    case "ended":
      return "Ended";

    case "custom":
      return customButtonText?.trim()
        ? `Custom: ${customButtonText.trim()}`
        : "Custom";

    default:
      return "Register Now";
  }
}

function getRegistrationPageLabel(
  registrationPageId: string | null,
  registrationPages: RegistrationPage[]
) {
  if (!registrationPageId) {
    return "Not linked";
  }

  const registrationPage =
    registrationPages.find(
      (page) => page.id === registrationPageId
    );

  if (!registrationPage) {
    return "Linked form unavailable";
  }

  return registrationPage.slug;
}

function formatDisplayDate(value: string) {
  if (!value) {
    return "";
  }

  const parsed = new Date(
    `${value}T00:00:00`
  );

  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  return value;
}