"use client";

import {
  Bell,
  CalendarDays,
  ChevronRight,
  Clock3,
  ImagePlus,
  Loader2,
  MessageSquare,
  Plus,
  Users,
  X,
} from "lucide-react";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type DashboardStats = {
  publishedNotices: number;
  upcomingEvents: number;
  teamMembers: number;
  unreadMessages: number;
};

type UpcomingEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  status: string;
};

type RecentMessage = {
  id: string;
  name: string;
  subject: string;
  created_at: string;
  unread: boolean;
};

type ActivityItem = {
  id: string;
  text: string;
  detail: string;
  time: string;
  type: "event" | "notice";
};

type AdminProfile = {
  name: string;
  email: string;
};

const supabase = createClient();

const quickActions = [
  {
    title: "Create Event",
    description: "Add a new council event",
    icon: CalendarDays,
    href: "/admin/events",
  },
  {
    title: "Add Team Member",
    description: "Add someone to the council team",
    icon: Users,
    href: "/admin/team",
  },
  {
    title: "Add Gallery Photo",
    description: "Upload a new gallery item",
    icon: ImagePlus,
    href: "/admin/gallery",
  },
  {
    title: "Publish Notice",
    description: "Create a new website notice",
    icon: Bell,
    href: "/admin/notices",
  },
  {
    title: "View Messages",
    description: "Check contact messages",
    icon: MessageSquare,
    href: "/admin/messages",
  },
];

function parseEventDate(dateString: string) {
  const parsed = new Date(dateString);

  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  const parts = dateString.trim().split(/\s+/);

  if (parts.length >= 3) {
    const day = Number(parts[0]);
    const month = parts[1];
    const year = Number(parts[2]);

    const fallback = new Date(
      `${month} ${day}, ${year}`
    );

    if (!Number.isNaN(fallback.getTime())) {
      return fallback;
    }
  }

  return null;
}

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 0) {
    return "Upcoming";
  }

  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(hours / 24);

  if (days === 1) {
    return "Yesterday";
  }

  if (days < 7) {
    return `${days} days ago`;
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatEventDate(dateString: string) {
  const date = parseEventDate(dateString);

  if (!date) {
    return dateString;
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function AdminPage() {
  const [showQuickActions, setShowQuickActions] =
    useState(false);

  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState<DashboardStats>({
    publishedNotices: 0,
    upcomingEvents: 0,
    teamMembers: 0,
    unreadMessages: 0,
  });

  const [upcomingEvents, setUpcomingEvents] =
    useState<UpcomingEvent[]>([]);

  const [recentMessages, setRecentMessages] =
    useState<RecentMessage[]>([]);

  const [activities, setActivities] =
    useState<ActivityItem[]>([]);

  const [admin, setAdmin] =
    useState<AdminProfile | null>(null);

  const [error, setError] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      /*
       * =====================================================
       * ADMIN PROFILE
       * =====================================================
       */

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("admin_profiles")
          .select("name, email")
          .eq("id", user.id)
          .maybeSingle();

        if (profile) {
          setAdmin(profile);
        }
      }

      /*
       * =====================================================
       * NOTICES
       * =====================================================
       */

      const { data: notices, error: noticesError } =
        await supabase
          .from("notices")
          .select(
            "id, title, date, description, published, created_at"
          )
          .eq("published", true)
          .order("created_at", {
            ascending: false,
          });

      if (noticesError) {
        console.error(
          "Dashboard notices error:",
          noticesError
        );
      }

      /*
       * =====================================================
       * EVENTS
       * =====================================================
       */

      const { data: events, error: eventsError } =
        await supabase
          .from("events")
          .select(
            "id, title, date, time, location, type, description, published, created_at"
          )
          .eq("published", true)
          .order("created_at", {
            ascending: false,
          });

      if (eventsError) {
        console.error(
          "Dashboard events error:",
          eventsError
        );
      }

      const allEvents = events ?? [];

      const upcoming = allEvents
        .filter((event) => {
          const eventDate = parseEventDate(event.date);

          if (!eventDate) {
            return false;
          }

          eventDate.setHours(0, 0, 0, 0);

          return eventDate >= today;
        })
        .sort((a, b) => {
          const dateA = parseEventDate(a.date);
          const dateB = parseEventDate(b.date);

          if (!dateA || !dateB) {
            return 0;
          }

          return dateA.getTime() - dateB.getTime();
        });

      setUpcomingEvents(
        upcoming.slice(0, 3).map((event) => ({
          id: event.id,
          title: event.title,
          date: formatEventDate(event.date),
          time: event.time || "Time TBA",
          status: "Upcoming",
        }))
      );

      /*
       * =====================================================
       * TEAM MEMBERS
       * =====================================================
       *
       * The dashboard reads the actual team_members table.
       * If the table is unavailable, the count safely falls
       * back to zero rather than showing dummy data.
       */

      const { count: teamCount, error: teamError } =
        await supabase
          .from("team_members")
          .select("id", {
            count: "exact",
            head: true,
          });

      if (teamError) {
        console.error(
          "Dashboard team count error:",
          teamError
        );
      }

      /*
       * =====================================================
       * UNREAD MESSAGES
       * =====================================================
       */

      const {
        count: unreadMessageCount,
        error: unreadMessageError,
      } = await supabase
        .from("contact_messages")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("status", "unread");

      if (unreadMessageError) {
        console.error(
          "Dashboard unread messages error:",
          unreadMessageError
        );
      }

      /*
       * =====================================================
       * RECENT MESSAGES
       * =====================================================
       */

      const {
        data: messages,
        error: messagesError,
      } = await supabase
        .from("contact_messages")
        .select(
          "id, name, subject, status, created_at"
        )
        .order("created_at", {
          ascending: false,
        })
        .limit(4);

      if (messagesError) {
        console.error(
          "Dashboard messages error:",
          messagesError
        );
      }

      setRecentMessages(
        (messages ?? []).map((message) => ({
          id: message.id,
          name: message.name || "Unknown sender",
          subject:
            message.subject || "No subject",
          created_at: message.created_at,
          unread: message.status === "unread",
        }))
      );

      /*
       * =====================================================
       * DASHBOARD STATS
       * =====================================================
       */

      setStats({
        publishedNotices: notices?.length ?? 0,
        upcomingEvents: upcoming.length,
        teamMembers: teamCount ?? 0,
        unreadMessages: unreadMessageCount ?? 0,
      });

      /*
       * =====================================================
       * RECENT ACTIVITY
       * =====================================================
       *
       * There is currently no dedicated activity/audit table.
       * Therefore we use real event + notice creation records
       * instead of fabricated activity.
       */

      const activityEvents: ActivityItem[] = allEvents
        .filter((event) => event.created_at)
        .map((event) => ({
          id: `event-${event.id}`,
          text: "Event updated",
          detail: event.title,
          time: formatRelativeTime(event.created_at),
          type: "event",
        }));

      const activityNotices: ActivityItem[] =
        (notices ?? [])
          .filter((notice) => notice.created_at)
          .map((notice) => ({
            id: `notice-${notice.id}`,
            text: "Notice published",
            detail: notice.title,
            time: formatRelativeTime(
              notice.created_at
            ),
            type: "notice",
          }));

      const combinedActivities = [
        ...activityEvents,
        ...activityNotices,
      ]
        .sort((a, b) => {
          /*
           * The activity text itself is already formatted,
           * so preserve the source ordering by using the
           * source arrays' newest-first ordering.
           */
          return 0;
        })
        .slice(0, 4);

      setActivities(combinedActivities);
    } catch (dashboardError) {
      console.error(
        "Dashboard loading error:",
        dashboardError
      );

      setError(
        "Some dashboard data could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();

    /*
     * Refresh dashboard when the admin returns to the tab.
     */
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadDashboard();
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, []);

  /*
   * =====================================================
   * REAL-TIME DASHBOARD UPDATES
   * =====================================================
   */

  useEffect(() => {
    const channel = supabase
      .channel("admin-dashboard-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "events",
        },
        () => {
          loadDashboard();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notices",
        },
        () => {
          loadDashboard();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contact_messages",
        },
        () => {
          loadDashboard();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "team_members",
        },
        () => {
          loadDashboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const displayName =
    admin?.name?.trim() || "Administrator";

  const displayEmail =
    admin?.email?.trim() || "Admin";

  const avatarLetter =
    displayName.charAt(0).toUpperCase() || "A";

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-900">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="flex h-20 items-center justify-between px-5 sm:px-8 lg:px-10">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Admin Portal
            </p>

            <h1 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
              Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              title="Notifications"
              className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 transition hover:bg-slate-50"
            >
              <Bell size={19} />

              {stats.unreadMessages > 0 && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
              )}
            </button>

            <div className="hidden h-9 w-px bg-slate-200 sm:block" />

            <div className="hidden items-center gap-3 sm:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#527dff] to-[#21c997] text-xs font-semibold text-white">
                {avatarLetter}
              </div>

              <div>
                <p className="max-w-[160px] truncate text-sm font-semibold text-slate-900">
                  {displayName}
                </p>

                <p className="max-w-[160px] truncate text-xs text-slate-500">
                  {displayEmail}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* =====================================================
          DASHBOARD CONTENT
      ===================================================== */}

      <div className="px-5 py-7 sm:px-8 lg:px-10 lg:py-9">
        {/* ===================================================
            WELCOME
        =================================================== */}

        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">
              Welcome back, {displayName}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage your Technical Council website from one place.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setShowQuickActions(true)
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-emerald-600 hover:to-blue-700"
          >
            <Plus size={17} />
            Quick Action
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {error}
          </div>
        )}

        {/* ===================================================
            STATS
        =================================================== */}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: "Published Notices",
              value: stats.publishedNotices,
              icon: Bell,
              description: "Currently visible",
            },
            {
              title: "Upcoming Events",
              value: stats.upcomingEvents,
              icon: CalendarDays,
              description: "Scheduled events",
            },
            {
              title: "Team Members",
              value: stats.teamMembers,
              icon: Users,
              description: "Across all teams",
            },
            {
              title: "Unread Messages",
              value: stats.unreadMessages,
              icon: MessageSquare,
              description: "Needs attention",
            },
          ].map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {stat.title}
                    </p>

                    <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                      {loading ? (
                        <span className="inline-flex">
                          <Loader2
                            size={27}
                            className="animate-spin text-slate-300"
                          />
                        </span>
                      ) : (
                        stat.value
                      )}
                    </p>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                    <Icon size={19} />
                  </div>
                </div>

                <p className="mt-4 text-xs text-slate-400">
                  {stat.description}
                </p>
              </div>
            );
          })}
        </section>

        {/* ===================================================
            UPCOMING EVENTS + RECENT MESSAGES
        =================================================== */}

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_1fr]">
          {/* Upcoming Events */}

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5">
              <div>
                <h3 className="font-semibold text-slate-950">
                  Upcoming Events
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Events currently scheduled
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  window.location.href =
                    "/admin/events";
                }}
                className="text-sm font-semibold text-slate-700 transition hover:text-slate-950"
              >
                View all
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {loading ? (
                <div className="flex items-center justify-center px-5 py-10 text-sm text-slate-400">
                  <Loader2
                    size={18}
                    className="mr-2 animate-spin"
                  />
                  Loading events...
                </div>
              ) : upcomingEvents.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <CalendarDays
                    size={28}
                    className="mx-auto text-slate-300"
                  />

                  <p className="mt-3 text-sm font-semibold text-slate-600">
                    No upcoming events
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Published upcoming events will appear here.
                  </p>
                </div>
              ) : (
                upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-4 px-5 py-4"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                      <CalendarDays size={18} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {event.title}
                      </p>

                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                        <Clock3 size={13} />

                        <span>
                          {event.date}
                        </span>

                        <span>·</span>

                        <span>
                          {event.time}
                        </span>
                      </div>
                    </div>

                    <span className="hidden rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 sm:block">
                      {event.status}
                    </span>

                    <ChevronRight
                      size={17}
                      className="shrink-0 text-slate-400"
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Messages */}

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5">
              <div>
                <h3 className="font-semibold text-slate-950">
                  Recent Messages
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Messages from your contact page
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  window.location.href =
                    "/admin/messages";
                }}
                className="text-sm font-semibold text-slate-700 transition hover:text-slate-950"
              >
                View all
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {loading ? (
                <div className="flex items-center justify-center px-5 py-10 text-sm text-slate-400">
                  <Loader2
                    size={18}
                    className="mr-2 animate-spin"
                  />
                  Loading messages...
                </div>
              ) : recentMessages.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <MessageSquare
                    size={28}
                    className="mx-auto text-slate-300"
                  />

                  <p className="mt-3 text-sm font-semibold text-slate-600">
                    No messages yet
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    New contact messages will appear here.
                  </p>
                </div>
              ) : (
                recentMessages.map((message) => (
                  <div
                    key={message.id}
                    className="flex items-center gap-3 px-5 py-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                      {message.name
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {message.name}
                        </p>

                        {message.unread && (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                        )}
                      </div>

                      <p className="truncate text-xs text-slate-500">
                        {message.subject}
                      </p>
                    </div>

                    <span className="shrink-0 text-[11px] text-slate-400">
                      {formatRelativeTime(
                        message.created_at
                      )}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* ===================================================
            RECENT ACTIVITY
        =================================================== */}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-5">
            <h3 className="font-semibold text-slate-950">
              Recent Activity
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Latest event and notice updates
            </p>
          </div>

          <div className="grid divide-y divide-slate-100 md:grid-cols-2 md:divide-x md:divide-y-0">
            {loading ? (
              <div className="flex items-center justify-center px-5 py-10 text-sm text-slate-400 md:col-span-2">
                <Loader2
                  size={18}
                  className="mr-2 animate-spin"
                />
                Loading activity...
              </div>
            ) : activities.length === 0 ? (
              <div className="px-5 py-10 text-center md:col-span-2">
                <p className="text-sm font-semibold text-slate-600">
                  No recent activity
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  New events and notices will appear here.
                </p>
              </div>
            ) : (
              activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex gap-4 px-5 py-5"
                >
                  <div
                    className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                      activity.type === "event"
                        ? "bg-blue-600"
                        : "bg-emerald-500"
                    }`}
                  />

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {activity.text}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {activity.detail}
                    </p>

                    <p className="mt-2 text-xs text-slate-400">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* =====================================================
          QUICK ACTION MODAL
      ===================================================== */}

      {showQuickActions && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/30 p-5 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              setShowQuickActions(false);
            }
          }}
        >
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.20)]">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Quick Actions
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Quickly jump to a common admin task.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowQuickActions(false)
                }
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
                aria-label="Close quick actions"
              >
                <X size={17} />
              </button>
            </div>

            <div className="grid gap-3 p-5 sm:grid-cols-2">
              {quickActions.map((action) => {
                const Icon = action.icon;

                return (
                  <button
                    key={action.title}
                    type="button"
                    onClick={() => {
                      window.location.href =
                        action.href;
                    }}
                    className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/40 hover:shadow-sm"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-blue-600 text-white shadow-sm transition group-hover:from-emerald-600 group-hover:to-blue-700">
                      <Icon size={18} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">
                        {action.title}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-500">
                        {action.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end border-t border-slate-100 bg-slate-50/60 px-5 py-4">
              <button
                type="button"
                onClick={() =>
                  setShowQuickActions(false)
                }
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-slate-950"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}