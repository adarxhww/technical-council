"use client";

import {
  Bell,
  CalendarDays,
  ChevronRight,
  Clock3,
  ExternalLink,
  ImagePlus,
  Loader2,
  MessageSquare,
  Plus,
  RefreshCw,
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
  timestamp: string;
  type: "event" | "notice";
};

type AdminProfile = {
  name: string;
  email: string;
};

type NoticeOverview = {
  published: number;
  draft: number;
  scheduled: number;
  latest: {
    title: string;
    date: string;
  } | null;
};

type TeamOverview = {
  institutionalLeadership: number;
  executiveBody: number;
  secretaries: number;
  coSecretaries: number;
  generalMembers: number;
  total: number;
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
  if (!dateString) {
    return null;
  }

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

function formatShortDate(dateString: string) {
  const date = parseEventDate(dateString);

  if (!date) {
    return dateString || "No date";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminPage() {
  const [showQuickActions, setShowQuickActions] =
    useState(false);

  const [showNotifications, setShowNotifications] =
    useState(false);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [lastSynced, setLastSynced] = useState<Date | null>(
    null
  );

  const [stats, setStats] = useState<DashboardStats>({
    publishedNotices: 0,
    upcomingEvents: 0,
    teamMembers: 0,
    unreadMessages: 0,
  });

  const [upcomingEvents, setUpcomingEvents] = useState<
    UpcomingEvent[]
  >([]);

  const [recentMessages, setRecentMessages] = useState<
    RecentMessage[]
  >([]);

  const [activities, setActivities] = useState<
    ActivityItem[]
  >([]);

  const [noticeOverview, setNoticeOverview] =
    useState<NoticeOverview>({
      published: 0,
      draft: 0,
      scheduled: 0,
      latest: null,
    });

  const [teamOverview, setTeamOverview] =
    useState<TeamOverview>({
      institutionalLeadership: 0,
      executiveBody: 0,
      secretaries: 0,
      coSecretaries: 0,
      generalMembers: 0,
      total: 0,
    });

  const [admin, setAdmin] =
    useState<AdminProfile | null>(null);

  const [error, setError] = useState("");

  async function loadDashboard(
    showRefreshLoader = false
  ) {
    if (showRefreshLoader) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
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
       * TODAY
       * =====================================================
       */

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      /*
       * =====================================================
       * NOTICES
       * =====================================================
       */

      const {
        data: notices,
        error: noticesError,
      } = await supabase
        .from("notices")
        .select(
          "id, title, date, description, published, created_at"
        )
        .order("created_at", {
          ascending: false,
        });

      if (noticesError) {
        console.error(
          "Dashboard notices error:",
          noticesError
        );
      }

      const allNotices = notices ?? [];

      let publishedNoticeCount = 0;
      let draftNoticeCount = 0;
      let scheduledNoticeCount = 0;

      for (const notice of allNotices) {
        if (!notice.published) {
          draftNoticeCount += 1;
          continue;
        }

        const noticeDate = notice.date
          ? parseEventDate(notice.date)
          : null;

        if (
          noticeDate &&
          noticeDate.getTime() > today.getTime()
        ) {
          scheduledNoticeCount += 1;
        } else {
          publishedNoticeCount += 1;
        }
      }

      const latestNotice = allNotices[0];

      setNoticeOverview({
        published: publishedNoticeCount,
        draft: draftNoticeCount,
        scheduled: scheduledNoticeCount,
        latest: latestNotice
          ? {
              title:
                latestNotice.title ||
                "Untitled notice",
              date: latestNotice.date
                ? formatShortDate(
                    latestNotice.date
                  )
                : "No date",
            }
          : null,
      });

      /*
       * =====================================================
       * EVENTS
       * =====================================================
       */

      const {
        data: events,
        error: eventsError,
      } = await supabase
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
          const eventDate = parseEventDate(
            event.date
          );

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

          return (
            dateA.getTime() - dateB.getTime()
          );
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
       * TC TEAM OVERVIEW
       * =====================================================
       */

      const {
        data: teamMembers,
        error: teamError,
      } = await supabase
        .from("tc_team")
        .select("id, section")
        .eq("published", true);

      if (teamError) {
        console.error(
          "Dashboard TC team error:",
          teamError
        );
      }

      const teamRows = teamMembers ?? [];

      const teamBreakdown: TeamOverview = {
        institutionalLeadership: teamRows.filter(
          (member) =>
            member.section ===
            "institutional_leadership"
        ).length,

        executiveBody: teamRows.filter(
          (member) =>
            member.section ===
            "executive_body"
        ).length,

        secretaries: teamRows.filter(
          (member) =>
            member.section === "secretaries"
        ).length,

        coSecretaries: teamRows.filter(
          (member) =>
            member.section === "co_secretaries"
        ).length,

        generalMembers: teamRows.filter(
          (member) =>
            member.section ===
            "general_members"
        ).length,

        total: teamRows.length,
      };

      setTeamOverview(teamBreakdown);

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
          name:
            message.name || "Unknown sender",
          subject:
            message.subject || "No subject",
          created_at: message.created_at,
          unread:
            message.status === "unread",
        }))
      );

      /*
       * =====================================================
       * MAIN STATS
       * =====================================================
       */

      setStats({
        publishedNotices:
          publishedNoticeCount +
          scheduledNoticeCount,

        upcomingEvents: upcoming.length,

        teamMembers: teamBreakdown.total,

        unreadMessages:
          unreadMessageCount ?? 0,
      });

      /*
       * =====================================================
       * RECENT ACTIVITY
       * =====================================================
       */

      const activityEvents: ActivityItem[] =
        allEvents
          .filter(
            (event) => event.created_at
          )
          .map((event) => ({
            id: `event-${event.id}`,
            text: "Event created",
            detail: event.title,
            time: formatRelativeTime(
              event.created_at
            ),
            timestamp: event.created_at,
            type: "event",
          }));

      const activityNotices: ActivityItem[] =
        allNotices
          .filter(
            (notice) => notice.created_at
          )
          .map((notice) => ({
            id: `notice-${notice.id}`,
            text: notice.published
              ? "Notice published"
              : "Notice drafted",
            detail: notice.title,
            time: formatRelativeTime(
              notice.created_at
            ),
            timestamp: notice.created_at,
            type: "notice",
          }));

      const combinedActivities = [
        ...activityEvents,
        ...activityNotices,
      ]
        .sort(
          (a, b) =>
            new Date(
              b.timestamp
            ).getTime() -
            new Date(
              a.timestamp
            ).getTime()
        )
        .slice(0, 4);

      setActivities(combinedActivities);

      /*
       * =====================================================
       * LAST SYNCED
       * =====================================================
       */

      setLastSynced(new Date());
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
      setRefreshing(false);
    }
  }

  /*
   * =====================================================
   * INITIAL LOAD + VISIBILITY REFRESH
   * =====================================================
   */

  useEffect(() => {
    loadDashboard();

    const handleVisibilityChange = () => {
      if (
        document.visibilityState ===
        "visible"
      ) {
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
   * REAL-TIME UPDATES
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
          table: "tc_team",
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

  /*
   * =====================================================
   * CLOSE NOTIFICATION POPUP ON OUTSIDE CLICK
   * =====================================================
   */

  useEffect(() => {
    if (!showNotifications) {
      return;
    }

    const handleDocumentClick = () => {
      setShowNotifications(false);
    };

    document.addEventListener(
      "click",
      handleDocumentClick
    );

    return () => {
      document.removeEventListener(
        "click",
        handleDocumentClick
      );
    };
  }, [showNotifications]);

  /*
   * =====================================================
   * HELPERS
   * =====================================================
   */

  const displayName =
    admin?.name?.trim() ||
    "Administrator";

  const displayEmail =
    admin?.email?.trim() || "Admin";

  const avatarLetter =
    displayName
      .charAt(0)
      .toUpperCase() || "A";

  const lastSyncedText = lastSynced
    ? lastSynced.toLocaleTimeString(
        "en-IN",
        {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }
      )
    : "Not synced yet";

  /*
   * =====================================================
   * RENDER
   * =====================================================
   */

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-900">
      {/* ===================================================
          HEADER
      =================================================== */}

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
            {/* =================================================
                NOTIFICATION BUTTON
            ================================================= */}

            <div
              className="relative"
              onClick={(event) => {
                event.stopPropagation();
              }}
            >
              <button
                type="button"
                title="Notifications"
                onClick={() =>
                  setShowNotifications(
                    (current) => !current
                  )
                }
                className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 transition hover:bg-slate-50"
              >
                <Bell size={19} />

                {stats.unreadMessages > 0 && (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
                )}
              </button>

              {/* =================================================
                  NOTIFICATION POPUP
              ================================================= */}

              {showNotifications && (
                <div className="absolute right-0 top-12 z-[80] w-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.16)]">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-950">
                        Recent Activity
                      </h3>

                      <p className="mt-0.5 text-xs text-slate-500">
                        Your latest dashboard updates
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setShowNotifications(
                          false
                        )
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      aria-label="Close notifications"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  <div className="max-h-[360px] overflow-y-auto">
                    {activities.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <Bell
                          size={24}
                          className="mx-auto text-slate-300"
                        />

                        <p className="mt-2 text-sm font-medium text-slate-600">
                          No recent activity
                        </p>
                      </div>
                    ) : (
                      activities
                        .slice(0, 4)
                        .map(
                          (activity) => (
                            <button
                              key={
                                activity.id
                              }
                              type="button"
                              onClick={() => {
                                setShowNotifications(
                                  false
                                );

                                if (
                                  activity.type ===
                                  "event"
                                ) {
                                  window.location.href =
                                    "/admin/events";
                                } else {
                                  window.location.href =
                                    "/admin/notices";
                                }
                              }}
                              className="flex w-full gap-3 border-b border-slate-100 px-4 py-3.5 text-left transition last:border-b-0 hover:bg-slate-50"
                            >
                              <span
                                className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                                  activity.type ===
                                  "event"
                                    ? "bg-blue-600"
                                    : "bg-emerald-500"
                                }`}
                              />

                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-900">
                                  {
                                    activity.text
                                  }
                                </p>

                                <p className="mt-0.5 truncate text-xs text-slate-500">
                                  {
                                    activity.detail
                                  }
                                </p>

                                <p className="mt-1 text-[11px] text-slate-400">
                                  {
                                    activity.time
                                  }
                                </p>
                              </div>

                              <ChevronRight
                                size={15}
                                className="mt-1 shrink-0 text-slate-300"
                              />
                            </button>
                          )
                        )
                    )}
                  </div>

                  
                </div>
              )}
            </div>

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

          <div className="flex items-center gap-2">
            <button
              type="button"
              title="Refresh dashboard"
              onClick={() =>
                loadDashboard(true)
              }
              disabled={refreshing}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />

              <span className="hidden sm:inline">
                Refresh
              </span>
            </button>

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
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {error}
          </div>
        )}

        {/* ===================================================
            MAIN STATS
        =================================================== */}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: "Published Notices",
              value:
                stats.publishedNotices,
              icon: Bell,
              description:
                "Published & scheduled",
              href: "/admin/notices",
            },
            {
              title: "Upcoming Events",
              value:
                stats.upcomingEvents,
              icon: CalendarDays,
              description:
                "Scheduled events",
              href: "/admin/events",
            },
            {
              title: "Team Members",
              value:
                stats.teamMembers,
              icon: Users,
              description:
                "Council members",
              href: "/admin/team",
            },
            {
              title: "Unread Messages",
              value:
                stats.unreadMessages,
              icon: MessageSquare,
              description:
                "Needs attention",
              href: "/admin/messages?status=unread",
            },
          ].map((stat) => {
            const Icon = stat.icon;

            return (
              <button
                key={stat.title}
                type="button"
                onClick={() => {
                  window.location.href =
                    stat.href;
                }}
                className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {stat.title}
                    </p>

                    <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                      {loading ? (
                        <Loader2
                          size={27}
                          className="animate-spin text-slate-300"
                        />
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
              </button>
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
              ) : upcomingEvents.length ===
                0 ? (
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
                upcomingEvents.map(
                  (event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => {
                        window.location.href =
                          "/admin/events";
                      }}
                      className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-slate-50"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                        <CalendarDays
                          size={18}
                        />
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
                    </button>
                  )
                )
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
              ) : recentMessages.length ===
                0 ? (
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
                recentMessages.map(
                  (message) => (
                    <button
                      key={message.id}
                      type="button"
                      onClick={() => {
                        window.location.href =
                          "/admin/messages";
                      }}
                      className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-slate-50"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                        {message.name
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {
                              message.name
                            }
                          </p>

                          {message.unread && (
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                          )}
                        </div>

                        <p className="truncate text-xs text-slate-500">
                          {
                            message.subject
                          }
                        </p>
                      </div>

                      <span className="shrink-0 text-[11px] text-slate-400">
                        {formatRelativeTime(
                          message.created_at
                        )}
                      </span>

                      <ChevronRight
                        size={15}
                        className="shrink-0 text-slate-300"
                      />
                    </button>
                  )
                )
              )}
            </div>
          </div>
        </section>

        {/* ===================================================
            NOTICE OVERVIEW + TEAM OVERVIEW
        =================================================== */}

        <section className="mt-6 grid gap-6 xl:grid-cols-2">
          {/* =================================================
              NOTICE OVERVIEW
          ================================================= */}

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5">
              <div>
                <h3 className="font-semibold text-slate-950">
                  Notice Overview
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Current website notice status
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  window.location.href =
                    "/admin/notices";
                }}
                className="text-sm font-semibold text-slate-700 transition hover:text-slate-950"
              >
                Manage
              </button>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    window.location.href =
                      "/admin/notices";
                  }}
                  className="rounded-xl bg-emerald-50 p-4 text-left transition hover:bg-emerald-100"
                >
                  <p className="text-xs font-medium text-emerald-700">
                    Published
                  </p>

                  <p className="mt-1 text-2xl font-bold text-emerald-900">
                    {loading ? (
                      <Loader2
                        size={21}
                        className="animate-spin"
                      />
                    ) : (
                      noticeOverview.published
                    )}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    window.location.href =
                      "/admin/notices";
                  }}
                  className="rounded-xl bg-slate-100 p-4 text-left transition hover:bg-slate-200"
                >
                  <p className="text-xs font-medium text-slate-600">
                    Draft
                  </p>

                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {loading ? (
                      <Loader2
                        size={21}
                        className="animate-spin"
                      />
                    ) : (
                      noticeOverview.draft
                    )}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    window.location.href =
                      "/admin/notices";
                  }}
                  className="rounded-xl bg-blue-50 p-4 text-left transition hover:bg-blue-100"
                >
                  <p className="text-xs font-medium text-blue-700">
                    Scheduled
                  </p>

                  <p className="mt-1 text-2xl font-bold text-blue-900">
                    {loading ? (
                      <Loader2
                        size={21}
                        className="animate-spin"
                      />
                    ) : (
                      noticeOverview.scheduled
                    )}
                  </p>
                </button>
              </div>

              <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Latest Notice
                </p>

                {noticeOverview.latest ? (
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href =
                        "/admin/notices";
                    }}
                    className="mt-2 flex w-full items-center gap-3 text-left"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm">
                      <Bell size={16} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {
                          noticeOverview
                            .latest
                            .title
                        }
                      </p>

                      <p className="mt-0.5 text-xs text-slate-400">
                        {
                          noticeOverview
                            .latest
                            .date
                        }
                      </p>
                    </div>

                    <ChevronRight
                      size={16}
                      className="text-slate-300"
                    />
                  </button>
                ) : (
                  <p className="mt-2 text-sm text-slate-400">
                    No notices available.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* =================================================
              TC TEAM OVERVIEW
          ================================================= */}

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5">
              <div>
                <h3 className="font-semibold text-slate-950">
                  TC Team Overview
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Published Technical Council members
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  window.location.href =
                    "/admin/team";
                }}
                className="text-sm font-semibold text-slate-700 transition hover:text-slate-950"
              >
                Manage
              </button>
            </div>

            <div className="p-5">
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  {
                    label:
                      "Institutional Leadership",
                    value:
                      teamOverview.institutionalLeadership,
                  },
                  {
                    label: "Executive Body",
                    value:
                      teamOverview.executiveBody,
                  },
                  {
                    label: "Secretaries",
                    value:
                      teamOverview.secretaries,
                  },
                  {
                    label: "Co-Secretaries",
                    value:
                      teamOverview.coSecretaries,
                  },
                  {
                    label: "General Members",
                    value:
                      teamOverview.generalMembers,
                  },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      window.location.href =
                        "/admin/team";
                    }}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 text-left transition hover:border-slate-200 hover:bg-slate-50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm">
                        <Users size={15} />
                      </div>

                      <span className="truncate text-xs font-medium text-slate-600">
                        {item.label}
                      </span>
                    </div>

                    <span className="ml-3 text-base font-bold text-slate-900">
                      {loading ? (
                        <Loader2
                          size={17}
                          className="animate-spin text-slate-300"
                        />
                      ) : (
                        item.value
                      )}
                    </span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  window.location.href =
                    "/admin/team";
                }}
                className="mt-3 flex w-full items-center justify-between rounded-xl bg-slate-900 px-4 py-3 text-left text-white transition hover:bg-slate-800"
              >
                <div>
                  <p className="text-xs font-medium text-slate-400">
                    Total Published Members
                  </p>

                  <p className="mt-0.5 text-lg font-bold">
                    {loading ? (
                      <Loader2
                        size={19}
                        className="animate-spin"
                      />
                    ) : (
                      teamOverview.total
                    )}
                  </p>
                </div>

                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        </section>

        {/* ===================================================
            WEBSITE STATUS
        =================================================== */}

        <section className="mt-6">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <div className="relative">
                    <div className="h-3 w-3 rounded-full bg-emerald-500" />

                    <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-30" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-950">
                      Website Status
                    </h3>

                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                      Online
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    Dashboard connected successfully to the website data.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="rounded-xl bg-slate-50 px-4 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Last synced
                  </p>

                  <p className="mt-0.5 text-xs font-semibold text-slate-700">
                    {lastSyncedText}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    window.open(
                      "/",
                      "_blank",
                      "noopener,noreferrer"
                    );
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Open Website
                  <ExternalLink size={15} />
                </button>
              </div>
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
              activities.map(
                (activity) => (
                  <button
                    key={activity.id}
                    type="button"
                    onClick={() => {
                      if (
                        activity.type ===
                        "event"
                      ) {
                        window.location.href =
                          "/admin/events";
                      } else {
                        window.location.href =
                          "/admin/notices";
                      }
                    }}
                    className="flex w-full gap-4 px-5 py-5 text-left transition hover:bg-slate-50"
                  >
                    <div
                      className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                        activity.type ===
                        "event"
                          ? "bg-blue-600"
                          : "bg-emerald-500"
                      }`}
                    />

                    <div className="min-w-0 flex-1">
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

                    <ChevronRight
                      size={16}
                      className="mt-1 shrink-0 text-slate-300"
                    />
                  </button>
                )
              )
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
              event.target ===
              event.currentTarget
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
              {quickActions.map(
                (action) => {
                  const Icon = action.icon;

                  return (
                    <button
                      key={
                        action.title
                      }
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
                          {
                            action.title
                          }
                        </p>

                        <p className="mt-0.5 text-xs text-slate-500">
                          {
                            action.description
                          }
                        </p>
                      </div>
                    </button>
                  );
                }
              )}
            </div>

            <div className="flex justify-end border-t border-slate-100 bg-slate-50/60 px-5 py-4">
              <button
                type="button"
                onClick={() =>
                  setShowQuickActions(
                    false
                  )
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