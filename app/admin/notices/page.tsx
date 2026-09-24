"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Notice = {
  id: string;
  title: string;
  date: string;
  description: string;
  published: boolean;
  created_at: string;
  updated_at: string;
};

export default function NoticesPage() {
  const supabase = createClient();

  const [notices, setNotices] = useState<Notice[]>([]);
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadNotices() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("notices")
      .select(
        "id, title, date, description, published, created_at, updated_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Notices load error:", error);
      setError(error.message);
      setNotices([]);
    } else {
      setNotices(data ?? []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadNotices();
  }, []);

  const publishedCount = useMemo(
    () => notices.filter((notice) => notice.published).length,
    [notices]
  );

  const draftCount = notices.length - publishedCount;

  const filteredNotices = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) {
      return notices;
    }

    return notices.filter(
      (notice) =>
        notice.title.toLowerCase().includes(query) ||
        notice.description.toLowerCase().includes(query) ||
        notice.date.toLowerCase().includes(query)
    );
  }, [notices, search]);

  function openAddModal() {
    setEditingNotice(null);
    setTitle("");
    setDate("");
    setDescription("");
    setError("");
    setShowModal(true);
  }

  function openEditModal(notice: Notice) {
    setEditingNotice(notice);
    setTitle(notice.title);
    setDate(notice.date);
    setDescription(notice.description);
    setError("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingNotice(null);
    setTitle("");
    setDate("");
    setDescription("");
    setError("");
  }

  async function saveNotice() {
    const cleanTitle = title.trim();
    const cleanDate = date.trim();
    const cleanDescription = description.trim();

    if (!cleanTitle || !cleanDate || !cleanDescription) {
      setError("Please fill in all fields.");
      return;
    }

    setSaving(true);
    setError("");

    if (editingNotice) {
      const { data, error } = await supabase
        .from("notices")
        .update({
          title: cleanTitle,
          date: cleanDate,
          description: cleanDescription,
        })
        .eq("id", editingNotice.id)
        .select(
          "id, title, date, description, published, created_at, updated_at"
        )
        .single();

      if (error) {
        console.error("Notice update error:", error);
        setError(error.message);
        setSaving(false);
        return;
      }

      setNotices((current) =>
        current.map((notice) =>
          notice.id === editingNotice.id ? data : notice
        )
      );
    } else {
      const { data, error } = await supabase
        .from("notices")
        .insert({
          title: cleanTitle,
          date: cleanDate,
          description: cleanDescription,
          published: false,
        })
        .select(
          "id, title, date, description, published, created_at, updated_at"
        )
        .single();

      if (error) {
        console.error("Notice insert error:", error);
        setError(error.message);
        setSaving(false);
        return;
      }

      setNotices((current) => [data, ...current]);
    }

    setSaving(false);
    closeModal();
  }

  async function togglePublished(notice: Notice) {
    const { data, error } = await supabase
      .from("notices")
      .update({
        published: !notice.published,
      })
      .eq("id", notice.id)
      .select(
        "id, title, date, description, published, created_at, updated_at"
      )
      .single();

    if (error) {
      console.error("Notice publish update error:", error);
      window.alert(error.message);
      return;
    }

    setNotices((current) =>
      current.map((item) => (item.id === notice.id ? data : item))
    );
  }

  async function deleteNotice(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this notice?"
    );

    if (!confirmed) {
      return;
    }

    const { error } = await supabase
      .from("notices")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Notice delete error:", error);
      window.alert(error.message);
      return;
    }

    setNotices((current) =>
      current.filter((notice) => notice.id !== id)
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveNotice();
  }

  return (
    <div className="min-h-screen w-full bg-transparent">
      <div className="w-full px-5 py-7 sm:px-8 lg:px-10 lg:py-9">
        <div className="mx-auto w-full max-w-[1500px]">

          {/* HEADER */}
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
                Notices
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Create, edit and manage notices for the Technical Council
                homepage.
              </p>
            </div>

            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-emerald-600 hover:to-blue-700"
            >
              <Plus size={17} />
              Add Notice
            </button>
          </div>

          {/* ERROR */}
          {error && !showModal && (
            <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {/* STATS */}
          <section className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Total Notices
                  </p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                    {notices.length}
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <Bell size={19} />
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-400">
                All notices
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
                Currently visible on homepage
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Hidden
                  </p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                    {draftCount}
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

          {/* NOTICE MANAGEMENT */}
          <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-950">
                  All Notices
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Manage announcements displayed on the homepage.
                </p>
              </div>

              <div className="relative w-full lg:w-72">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search notices..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/[0.08]"
                />
              </div>
            </div>

            <div className="space-y-3 p-5">
              {loading ? (
                <>
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="h-28 animate-pulse rounded-xl border border-slate-200 bg-slate-50"
                    />
                  ))}
                </>
              ) : (
                <>
                  {filteredNotices.map((notice) => (
                    <div
                      key={notice.id}
                      className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 transition hover:bg-white hover:shadow-sm"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                        <div className="flex min-w-0 items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm">
                            <Bell size={17} />
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-sm font-semibold text-slate-900">
                                {notice.title}
                              </h3>

                              <span
                                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                  notice.published
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {notice.published
                                  ? "Published"
                                  : "Hidden"}
                              </span>
                            </div>

                            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                              {notice.date}
                            </p>

                            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                              {notice.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2 lg:ml-6">
                          <button
                            type="button"
                            onClick={() => togglePublished(notice)}
                            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                              notice.published
                                ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                          >
                            {notice.published ? (
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
                            onClick={() => openEditModal(notice)}
                            title="Edit notice"
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm transition hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteNotice(notice.id)}
                            title="Delete notice"
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm transition hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredNotices.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                      <Bell
                        size={30}
                        className="mx-auto text-slate-300"
                      />

                      <p className="mt-4 text-sm font-semibold text-slate-600">
                        {search
                          ? "No notices found"
                          : "No notices yet"}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {search
                          ? "Try a different search term."
                          : "Add your first notice to get started."}
                      </p>

                      {!search && (
                        <button
                          type="button"
                          onClick={openAddModal}
                          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-emerald-600 hover:to-blue-700"
                        >
                          <Plus size={16} />
                          Add Notice
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

      {/* MODAL */}
      {showModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/30 p-5 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              closeModal();
            }
          }}
        >
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.20)]">

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  {editingNotice ? "Edit Notice" : "Add Notice"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Create an announcement for the Technical Council
                  homepage.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close modal"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 disabled:opacity-50"
              >
                <X size={17} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-5 p-5">

                {error && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="notice-title"
                    className="mb-2 block text-xs font-semibold text-slate-500"
                  >
                    Title
                  </label>

                  <input
                    id="notice-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="e.g. Tech Fusion !!"
                    autoFocus
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/[0.08]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="notice-date"
                    className="mb-2 block text-xs font-semibold text-slate-500"
                  >
                    Date
                  </label>

                  <input
                    id="notice-date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    placeholder="e.g. AUG 2026"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/[0.08]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="notice-description"
                    className="mb-2 block text-xs font-semibold text-slate-500"
                  >
                    Description
                  </label>

                  <textarea
                    id="notice-description"
                    value={description}
                    onChange={(event) =>
                      setDescription(event.target.value)
                    }
                    rows={4}
                    placeholder="Write the notice..."
                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/[0.08]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-slate-950 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    !title.trim() ||
                    !date.trim() ||
                    !description.trim()
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-emerald-600 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {saving
                    ? "Saving..."
                    : editingNotice
                    ? "Save Changes"
                    : "Add Notice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}