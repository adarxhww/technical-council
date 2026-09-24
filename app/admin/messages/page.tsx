"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import {
  Archive,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  Mail,
  MailOpen,
  RefreshCw,
  Search,
  Trash2,
  User,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type MessageStatus = "unread" | "read" | "replied";

type Message = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: MessageStatus;
  created_at: string;
  updated_at: string;
};

export default function MessagesPage() {
  const supabase = createClient();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");

  const [filter, setFilter] = useState<
    "all" | "unread" | "read" | "replied"
  >("all");

  const [selectedMessageId, setSelectedMessageId] =
    useState<string | null>(null);

  const [errorMessage, setErrorMessage] = useState("");

  const [actionLoading, setActionLoading] = useState<
    string | null
  >(null);

  /* =====================================================
     LOAD MESSAGES
  ===================================================== */

  async function loadMessages(showRefresh = false) {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setErrorMessage("");

    try {
      const { data, error } = await supabase
        .from("contact_messages")
        .select(
          "id, name, email, subject, message, status, created_at, updated_at"
        )
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(
          "Messages load error:",
          error
        );

        setErrorMessage(error.message);
        return;
      }

      setMessages((data ?? []) as Message[]);
    } catch (error) {
      console.error(
        "Messages load error:",
        error
      );

      setErrorMessage(
        "Unable to load messages."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadMessages();
  }, []);

  /* =====================================================
     REAL-TIME UPDATES
  ===================================================== */

  useEffect(() => {
    const channel = supabase
      .channel("contact-messages-admin")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contact_messages",
        },
        () => {
          loadMessages(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /* =====================================================
     COUNTS
  ===================================================== */

  const unreadCount = messages.filter(
    (message) =>
      message.status === "unread"
  ).length;

  const repliedCount = messages.filter(
    (message) =>
      message.status === "replied"
  ).length;

  const inboxCount = messages.length;

  /* =====================================================
     FILTERED MESSAGES
  ===================================================== */

  const filteredMessages = useMemo(() => {
    const query = search
      .toLowerCase()
      .trim();

    return messages.filter((message) => {
      const matchesSearch =
        !query ||
        message.name
          .toLowerCase()
          .includes(query) ||
        message.email
          .toLowerCase()
          .includes(query) ||
        message.subject
          .toLowerCase()
          .includes(query) ||
        message.message
          .toLowerCase()
          .includes(query);

      let matchesFilter = true;

      if (filter === "unread") {
        matchesFilter =
          message.status === "unread";
      }

      if (filter === "read") {
        matchesFilter =
          message.status === "read";
      }

      if (filter === "replied") {
        matchesFilter =
          message.status === "replied";
      }

      return (
        matchesSearch &&
        matchesFilter
      );
    });
  }, [messages, search, filter]);

  /* =====================================================
     SELECTED MESSAGE
  ===================================================== */

  const selectedMessage =
    selectedMessageId
      ? messages.find(
          (message) =>
            message.id ===
            selectedMessageId
        ) ?? null
      : null;

  /* =====================================================
     TIME FORMAT
  ===================================================== */

  function formatTime(
    dateString: string
  ) {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return new Intl.DateTimeFormat(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }
    ).format(date);
  }

  function formatRelativeTime(
    dateString: string
  ) {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const diff =
      Date.now() - date.getTime();

    const minutes = Math.floor(
      diff / 60000
    );

    if (minutes < 1) {
      return "Just now";
    }

    if (minutes < 60) {
      return `${minutes} min ago`;
    }

    const hours = Math.floor(
      minutes / 60
    );

    if (hours < 24) {
      return `${hours} hr${
        hours === 1 ? "" : "s"
      } ago`;
    }

    const days = Math.floor(
      hours / 24
    );

    if (days < 7) {
      return `${days} day${
        days === 1 ? "" : "s"
      } ago`;
    }

    return new Intl.DateTimeFormat(
      "en-IN",
      {
        day: "numeric",
        month: "short",
      }
    ).format(date);
  }

  /* =====================================================
     UPDATE STATUS
  ===================================================== */

  async function updateStatus(
    id: string,
    status: MessageStatus
  ) {
    setActionLoading(id);
    setErrorMessage("");

    try {
      const { error } = await supabase
        .from("contact_messages")
        .update({
          status,
        })
        .eq("id", id);

      if (error) {
        console.error(
          "Message status update error:",
          error
        );

        setErrorMessage(
          error.message
        );

        return;
      }

      setMessages((current) =>
        current.map((message) =>
          message.id === id
            ? {
                ...message,
                status,
              }
            : message
        )
      );
    } finally {
      setActionLoading(null);
    }
  }

  /* =====================================================
     SELECT MESSAGE
  ===================================================== */

  async function selectMessage(
    id: string
  ) {
    setSelectedMessageId(id);

    const message = messages.find(
      (item) => item.id === id
    );

    if (
      message &&
      message.status === "unread"
    ) {
      await updateStatus(id, "read");
    }
  }

  /* =====================================================
     DELETE
  ===================================================== */

  async function deleteMessage(
    id: string
  ) {
    const confirmed =
      window.confirm(
        "Are you sure you want to permanently delete this message?"
      );

    if (!confirmed) {
      return;
    }

    setActionLoading(id);
    setErrorMessage("");

    try {
      const { error } = await supabase
        .from("contact_messages")
        .delete()
        .eq("id", id);

      if (error) {
        console.error(
          "Message delete error:",
          error
        );

        setErrorMessage(
          error.message
        );

        return;
      }

      setMessages((current) =>
        current.filter(
          (message) =>
            message.id !== id
        )
      );

      if (
        selectedMessageId === id
      ) {
        setSelectedMessageId(null);
      }
    } finally {
      setActionLoading(null);
    }
  }

  /* =====================================================
     MARK ALL AS READ
  ===================================================== */

  async function markAllAsRead() {
    if (unreadCount === 0) {
      return;
    }

    setActionLoading("all");
    setErrorMessage("");

    try {
      const { error } = await supabase
        .from("contact_messages")
        .update({
          status: "read",
        })
        .eq("status", "unread");

      if (error) {
        console.error(
          "Mark all as read error:",
          error
        );

        setErrorMessage(
          error.message
        );

        return;
      }

      setMessages((current) =>
        current.map((message) =>
          message.status === "unread"
            ? {
                ...message,
                status: "read",
              }
            : message
        )
      );
    } finally {
      setActionLoading(null);
    }
  }

  /* =====================================================
     CLOSE
  ===================================================== */

  function closeMessage() {
    setSelectedMessageId(null);
  }

  /* =====================================================
     STATUS UI
  ===================================================== */

  function getStatusBadge(
    status: MessageStatus
  ) {
    if (status === "unread") {
      return (
        <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">
          Unread
        </span>
      );
    }

    if (status === "replied") {
      return (
        <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
          Replied
        </span>
      );
    }

    return (
      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">
        Read
      </span>
    );
  }

  return (
    <div className="min-h-screen w-full bg-transparent">
      <div className="w-full px-5 py-7 sm:px-8 lg:px-10 lg:py-9">
        <div className="mx-auto w-full max-w-[1500px]">
          {/* =====================================================
              HEADER
          ===================================================== */}

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
                Messages
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                View and manage messages
                received through the
                Technical Council website.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  loadMessages(true)
                }
                disabled={refreshing}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={
                    refreshing
                      ? "animate-spin"
                      : ""
                  }
                />

                Refresh
              </button>

              <button
                type="button"
                onClick={markAllAsRead}
                disabled={
                  unreadCount === 0 ||
                  actionLoading === "all"
                }
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Check size={16} />

                {actionLoading === "all"
                  ? "Updating..."
                  : "Mark all as read"}
              </button>
            </div>
          </div>

          {/* =====================================================
              ERROR
          ===================================================== */}

          {errorMessage && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <X
                size={18}
                className="mt-0.5 shrink-0"
              />

              <div>
                <p className="font-semibold">
                  Unable to complete the
                  action
                </p>

                <p className="mt-0.5 text-xs">
                  {errorMessage}
                </p>
              </div>
            </div>
          )}

          {/* =====================================================
              STATS
          ===================================================== */}

          <section className="grid gap-4 sm:grid-cols-3">
            {/* Inbox */}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Inbox
                  </p>

                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                    {inboxCount}
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <Mail size={19} />
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-400">
                Total received messages
              </p>
            </div>

            {/* Unread */}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Unread
                  </p>

                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                    {unreadCount}
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <MailOpen size={19} />
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-400">
                Messages needing attention
              </p>
            </div>

            {/* Replied */}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Replied
                  </p>

                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                    {repliedCount}
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 size={19} />
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-400">
                Messages marked as replied
              </p>
            </div>
          </section>

          {/* =====================================================
              MESSAGES
          ===================================================== */}

          <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Toolbar */}

            <div className="border-b border-slate-100 px-5 py-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-950">
                    Contact Messages
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Messages submitted through
                    the public contact form.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  {/* Search */}

                  <div className="relative w-full sm:w-72">
                    <Search
                      size={16}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      value={search}
                      onChange={(event) =>
                        setSearch(
                          event.target.value
                        )
                      }
                      placeholder="Search messages..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/[0.08]"
                    />
                  </div>

                  {/* Filter */}

                  <select
                    value={filter}
                    onChange={(event) =>
                      setFilter(
                        event.target
                          .value as
                          | "all"
                          | "unread"
                          | "read"
                          | "replied"
                      )
                    }
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/[0.08]"
                  >
                    <option value="all">
                      All Messages
                    </option>

                    <option value="unread">
                      Unread
                    </option>

                    <option value="read">
                      Read
                    </option>

                    <option value="replied">
                      Replied
                    </option>
                  </select>
                </div>
              </div>
            </div>

            {/* =================================================
                MESSAGE LAYOUT
            ================================================= */}

            <div className="grid min-h-[560px] lg:grid-cols-[390px_minmax(0,1fr)]">
              {/* =================================================
                  MESSAGE LIST
              ================================================= */}

              <div
                className={`border-slate-100 lg:border-r ${
                  selectedMessage
                    ? "hidden lg:block"
                    : "block"
                }`}
              >
                {loading ? (
                  <div className="divide-y divide-slate-100">
                    {Array.from({
                      length: 6,
                    }).map(
                      (_, index) => (
                        <div
                          key={index}
                          className="animate-pulse px-5 py-4"
                        >
                          <div className="flex gap-3">
                            <div className="h-10 w-10 shrink-0 rounded-full bg-slate-100" />

                            <div className="min-w-0 flex-1">
                              <div className="h-3 w-28 rounded bg-slate-100" />

                              <div className="mt-2 h-3 w-40 rounded bg-slate-100" />

                              <div className="mt-2 h-3 w-full rounded bg-slate-100" />

                              <div className="mt-1 h-3 w-3/4 rounded bg-slate-100" />
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ) : filteredMessages.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {filteredMessages.map(
                      (message) => (
                        <button
                          key={message.id}
                          type="button"
                          onClick={() =>
                            selectMessage(
                              message.id
                            )
                          }
                          className={`w-full px-5 py-4 text-left transition hover:bg-slate-50 ${
                            selectedMessageId ===
                            message.id
                              ? "bg-blue-50/50"
                              : ""
                          }`}
                        >
                          <div className="flex gap-3">
                            {/* Avatar */}

                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                message.status ===
                                "unread"
                                  ? "bg-slate-900 text-white"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {message.name
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex min-w-0 items-center gap-2">
                                  <p
                                    className={`truncate text-sm ${
                                      message.status ===
                                      "unread"
                                        ? "font-bold text-slate-950"
                                        : "font-medium text-slate-800"
                                    }`}
                                  >
                                    {message.name}
                                  </p>

                                  {message.status ===
                                    "unread" && (
                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                                  )}
                                </div>

                                <span className="shrink-0 text-[11px] text-slate-400">
                                  {formatRelativeTime(
                                    message.created_at
                                  )}
                                </span>
                              </div>

                              <div className="mt-1 flex items-center gap-2">
                                <p
                                  className={`truncate text-xs ${
                                    message.status ===
                                    "unread"
                                      ? "font-semibold text-slate-700"
                                      : "font-medium text-slate-500"
                                  }`}
                                >
                                  {message.subject}
                                </p>

                                {message.status ===
                                  "replied" && (
                                  <span className="shrink-0 text-[10px] font-bold text-emerald-600">
                                    Replied
                                  </span>
                                )}
                              </div>

                              <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">
                                {message.message}
                              </p>
                            </div>
                          </div>
                        </button>
                      )
                    )}
                  </div>
                ) : (
                  <div className="flex h-full min-h-[500px] items-center justify-center px-6 text-center">
                    <div>
                      <Mail
                        size={32}
                        className="mx-auto text-slate-300"
                      />

                      <p className="mt-4 text-sm font-semibold text-slate-600">
                        No messages found
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Try changing your
                        search or filter.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* =================================================
                  MESSAGE READER
              ================================================= */}

              <div
                className={`${
                  selectedMessage
                    ? "block"
                    : "hidden lg:block"
                }`}
              >
                {selectedMessage ? (
                  <div className="flex min-h-[560px] flex-col">
                    {/* Reader Header */}

                    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                      <button
                        type="button"
                        onClick={
                          closeMessage
                        }
                        className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 lg:hidden"
                      >
                        <ChevronLeft
                          size={17}
                        />
                        Back
                      </button>

                      <div className="hidden lg:block">
                        <p className="text-xs font-medium text-slate-400">
                          Message
                        </p>

                        <p className="mt-0.5 text-sm font-semibold text-slate-900">
                          {selectedMessage.subject}
                        </p>
                      </div>

                      <div className="ml-auto flex items-center gap-1">
                        {/* Mark Read / Unread */}

                        <button
                          type="button"
                          title={
                            selectedMessage.status ===
                            "unread"
                              ? "Mark as read"
                              : "Mark as unread"
                          }
                          disabled={
                            actionLoading ===
                            selectedMessage.id
                          }
                          onClick={() =>
                            updateStatus(
                              selectedMessage.id,
                              selectedMessage.status ===
                                "unread"
                                ? "read"
                                : "unread"
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
                        >
                          {selectedMessage.status ===
                          "unread" ? (
                            <MailOpen
                              size={16}
                            />
                          ) : (
                            <Mail
                              size={16}
                            />
                          )}
                        </button>

                        {/* Mark Replied */}

                        <button
                          type="button"
                          title="Mark as replied"
                          disabled={
                            actionLoading ===
                            selectedMessage.id ||
                            selectedMessage.status ===
                              "replied"
                          }
                          onClick={() =>
                            updateStatus(
                              selectedMessage.id,
                              "replied"
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-emerald-600 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Check
                            size={16}
                          />
                        </button>

                        {/* Delete */}

                        <button
                          type="button"
                          title="Delete"
                          disabled={
                            actionLoading ===
                            selectedMessage.id
                          }
                          onClick={() =>
                            deleteMessage(
                              selectedMessage.id
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                        >
                          <Trash2
                            size={16}
                          />
                        </button>

                        {/* Close */}

                        <button
                          type="button"
                          title="Close"
                          onClick={
                            closeMessage
                          }
                          className="hidden h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:flex"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Message Content */}

                    <div className="flex-1 overflow-y-auto p-5 sm:p-7">
                      {/* Sender */}

                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                          {selectedMessage.name
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-sm font-semibold text-slate-950">
                                {selectedMessage.name}
                              </p>

                              <p className="mt-0.5 text-xs text-slate-400">
                                {selectedMessage.email}
                              </p>
                            </div>

                            <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-400 sm:mt-0">
                              <Clock3
                                size={13}
                              />

                              {formatTime(
                                selectedMessage.created_at
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Status */}

                      <div className="mt-4">
                        {getStatusBadge(
                          selectedMessage.status
                        )}
                      </div>

                      {/* Subject */}

                      <div className="mt-5 border-b border-slate-100 pb-5">
                        <h2 className="text-xl font-bold tracking-tight text-slate-950">
                          {selectedMessage.subject}
                        </h2>
                      </div>

                      {/* Body */}

                      <div className="py-6">
                        <p className="whitespace-pre-line text-sm leading-7 text-slate-600">
                          {
                            selectedMessage.message
                          }
                        </p>
                      </div>

                      {/* Sender Information */}

                      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center gap-2">
                          <User
                            size={15}
                            className="text-slate-400"
                          />

                          <p className="text-xs font-semibold text-slate-700">
                            Sender Information
                          </p>
                        </div>

                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <div>
                            <p className="text-[11px] font-medium text-slate-400">
                              Name
                            </p>

                            <p className="mt-1 text-sm font-medium text-slate-700">
                              {
                                selectedMessage.name
                              }
                            </p>
                          </div>

                          <div>
                            <p className="text-[11px] font-medium text-slate-400">
                              Email
                            </p>

                            <p className="mt-1 break-all text-sm font-medium text-slate-700">
                              {
                                selectedMessage.email
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Empty Reader */

                  <div className="flex min-h-[560px] items-center justify-center px-8 text-center">
                    <div className="max-w-xs">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                        <MailOpen
                          size={24}
                        />
                      </div>

                      <h3 className="mt-5 text-sm font-semibold text-slate-700">
                        Select a message
                      </h3>

                      <p className="mt-1 text-xs leading-5 text-slate-400">
                        Choose a message from
                        the inbox to read its
                        contents here.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}