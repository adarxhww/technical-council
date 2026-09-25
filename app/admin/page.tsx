"use client";

import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ExternalLink,
  FileText,
  ImagePlus,
  Loader2,
  MessageSquare,
  Plus,
  RefreshCw,
  Sparkles,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import Link from "next/link";

import { useCallback, useEffect, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type NoticeRow = {
  id: string;
  title: string;
  date: string;
  description: string;
  published: boolean;
  created_at: string;
  updated_at: string;
};

type EventRow = {
  id: string;
  title: string;
  date: string;
  time: string | null;
  created_at: string;
};

type TeamRow = {
  id: string;
  section: string;
};

type MessageRow = {
  id: string;
  name: string;
  subject: string;
  status: string;
  created_at: string;
};

type RecruitmentApplicationRow = {
  id: string;
  full_name: string;
  created_at: string;
};

type RegistrationRow = {
  id: string;
  registration_page_id: string;
  created_at: string;
};

type RegistrationPageRow = {
  id: string;
  event_name: string;
};

type AdminProfile = {
  name: string;
  email: string;
};

type UpcomingEvent = {
  id: string;
  title: string;
  date: string;
  time: string | null;
};

type ActivityItem = {
  id: string;
  text: string;
  detail: string;
  time: string;
  timestamp: string;
  type: "event" | "notice";
};

type NotificationItem = {
  id: string;
  text: string;
  detail: string;
  time: string;
  timestamp: string;
  type: "notice" | "message" | "application" | "registration";
};

type NoticeOverview = {
  published: number;
  hidden: number;
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

type DashboardStats = {
  publishedNotices: number;
  upcomingEvents: number;
  teamMembers: number;
  unreadMessages: number;
};

function parseDateOnly(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (match) {
    const [, year, month, day] = match;

    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatEventDate(value: string) {
  const date = parseDateOnly(value);

  if (!date) return value;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatShortDate(value: string) {
  const date = parseDateOnly(value);

  if (!date) return value;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function formatRelativeTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} hr ago`;
  }

  const days = Math.floor(hours / 24);

  if (days === 1) {
    return "Yesterday";
  }

  if (days < 7) {
    return `${days} days ago`;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function getTodayLabel() {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [admin, setAdmin] = useState<AdminProfile | null>(null);

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
    MessageRow[]
  >([]);

  const [activities, setActivities] = useState<ActivityItem[]>([]);

  const [notifications, setNotifications] = useState<
    NotificationItem[]
  >([]);

  const [noticeOverview, setNoticeOverview] =
    useState<NoticeOverview>({
      published: 0,
      hidden: 0,
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

  const [lastSynced, setLastSynced] =
    useState<Date | null>(null);

  const [showQuickActions, setShowQuickActions] =
    useState(false);

  const [showNotifications, setShowNotifications] =
    useState(false);

  const loadDashboard = useCallback(
    async (manualRefresh = false) => {
      try {
        if (manualRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        const profilePromise = user
          ? supabase
              .from("admin_profiles")
              .select("name, email")
              .eq("id", user.id)
              .maybeSingle()
          : Promise.resolve({
              data: null,
              error: null,
            });

        const [
          profileResult,
          noticesResult,
          eventsResult,
          teamResult,
          unreadResult,
          messagesResult,
          applicationsResult,
          individualRegistrationsResult,
          teamRegistrationsResult,
        ] = await Promise.all([
          profilePromise,

          // Notices
          supabase
            .from("notices")
            .select(
              "id, title, date, description, published, created_at, updated_at"
            )
            .order("created_at", {
              ascending: false,
            }),

          // Published events
          supabase
            .from("events")
            .select(
              "id, title, date, time, created_at"
            )
            .eq("published", true)
            .order("created_at", {
              ascending: false,
            }),

          // Published team
          supabase
            .from("tc_team")
            .select("id, section")
            .eq("published", true),

          // Unread messages count
          supabase
            .from("contact_messages")
            .select("id", {
              count: "exact",
              head: true,
            })
            .eq("status", "unread"),

          // Latest messages
          supabase
            .from("contact_messages")
            .select(
              "id, name, subject, status, created_at"
            )
            .order("created_at", {
              ascending: false,
            })
            .limit(4),

          // Latest recruitment applications
          supabase
            .from("recruitment_applications")
            .select(
              "id, full_name, created_at"
            )
            .order("created_at", {
              ascending: false,
            })
            .limit(4),

          // Latest individual registrations
          supabase
            .from("individual_registrations")
            .select(
              "id, registration_page_id, created_at"
            )
            .order("created_at", {
              ascending: false,
            })
            .limit(4),

          // Latest team registrations
          supabase
            .from("team_registrations")
            .select(
              "id, registration_page_id, created_at"
            )
            .order("created_at", {
              ascending: false,
            })
            .limit(4),
        ]);

        const errors: string[] = [];

        if (profileResult.error) {
          errors.push("profile");
        }

        if (noticesResult.error) {
          errors.push("notices");
        }

        if (eventsResult.error) {
          errors.push("events");
        }

        if (teamResult.error) {
          errors.push("team");
        }

        if (unreadResult.error) {
          errors.push("messages");
        }

        if (messagesResult.error) {
          errors.push("recent messages");
        }

        if (applicationsResult.error) {
          errors.push("recruitment applications");
        }

        if (individualRegistrationsResult.error) {
          errors.push("individual registrations");
        }

        if (teamRegistrationsResult.error) {
          errors.push("team registrations");
        }

        if (profileResult.data) {
          setAdmin(
            profileResult.data as AdminProfile
          );
        }

        const allNotices =
          (noticesResult.data ?? []) as NoticeRow[];

        const allEvents =
          (eventsResult.data ?? []) as EventRow[];

        const allTeamMembers =
          (teamResult.data ?? []) as TeamRow[];

        const allMessages =
          (messagesResult.data ?? []) as MessageRow[];

        const applications =
          (applicationsResult.data ??
            []) as RecruitmentApplicationRow[];

        const individualRegistrations =
          (individualRegistrationsResult.data ??
            []) as RegistrationRow[];

        const teamRegistrations =
          (teamRegistrationsResult.data ??
            []) as RegistrationRow[];

        /*
         * ----------------------------------------------------
         * Registration page names
         * ----------------------------------------------------
         */

        const registrationPageIds = Array.from(
          new Set(
            [
              ...individualRegistrations,
              ...teamRegistrations,
            ].map(
              (registration) =>
                registration.registration_page_id
            )
          )
        );

        let registrationPages: RegistrationPageRow[] =
          [];

        if (registrationPageIds.length > 0) {
          const registrationPagesResult =
            await supabase
              .from("registration_pages")
              .select("id, event_name")
              .in(
                "id",
                registrationPageIds
              );

          if (registrationPagesResult.error) {
            errors.push(
              "registration pages"
            );
          } else {
            registrationPages =
              (registrationPagesResult.data ??
                []) as RegistrationPageRow[];
          }
        }

        const registrationPageMap =
          new Map<string, string>();

        for (const page of registrationPages) {
          registrationPageMap.set(
            page.id,
            page.event_name
          );
        }

        /*
         * ----------------------------------------------------
         * Dashboard statistics
         * ----------------------------------------------------
         */

        const publishedNoticeCount =
          allNotices.filter(
            (notice) =>
              notice.published === true
          ).length;

        const hiddenNoticeCount =
          allNotices.filter(
            (notice) =>
              notice.published === false
          ).length;

        const today = new Date();

        today.setHours(
          0,
          0,
          0,
          0
        );

        const upcoming = allEvents
          .filter((event) => {
            const eventDate =
              parseDateOnly(event.date);

            return eventDate
              ? eventDate >= today
              : false;
          })
          .sort((a, b) => {
            const first =
              parseDateOnly(
                a.date
              )?.getTime() ?? 0;

            const second =
              parseDateOnly(
                b.date
              )?.getTime() ?? 0;

            return first - second;
          })
          .slice(0, 4);

        const latestNotice =
          allNotices[0];

        /*
         * ----------------------------------------------------
         * Team section counts
         * ----------------------------------------------------
         */

        const sectionCounts = {
          institutionalLeadership: 0,
          executiveBody: 0,
          secretaries: 0,
          coSecretaries: 0,
          generalMembers: 0,
        };

        for (const member of allTeamMembers) {
          switch (member.section) {
            case "institutional_leadership":
              sectionCounts.institutionalLeadership++;
              break;

            case "executive_body":
              sectionCounts.executiveBody++;
              break;

            case "secretaries":
              sectionCounts.secretaries++;
              break;

            case "co_secretaries":
              sectionCounts.coSecretaries++;
              break;

            case "general_members":
              sectionCounts.generalMembers++;
              break;

            default:
              break;
          }
        }

        /*
         * ----------------------------------------------------
         * EXISTING RECENT ACTIVITY
         * ----------------------------------------------------
         */

        const activityItems: ActivityItem[] = [
          ...allEvents
            .slice(0, 3)
            .map((event) => ({
              id: `event-${event.id}`,
              text: "Event published",
              detail: event.title,
              time: formatRelativeTime(
                event.created_at
              ),
              timestamp: event.created_at,
              type: "event" as const,
            })),

          ...allNotices
            .slice(0, 3)
            .map((notice) => ({
              id: `notice-${notice.id}`,
              text: notice.published
                ? "Notice published"
                : "Notice hidden",
              detail: notice.title,
              time: formatRelativeTime(
                notice.updated_at ||
                  notice.created_at
              ),
              timestamp:
                notice.updated_at ||
                notice.created_at,
              type: "notice" as const,
            })),
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

        /*
         * ----------------------------------------------------
         * NOTIFICATION BELL
         * ----------------------------------------------------
         */

        const notificationItems: NotificationItem[] = [
          // Notices
          ...allNotices.map(
            (notice) => ({
              id: `notification-notice-${notice.id}`,
              text: notice.published
                ? "Notice published"
                : "Notice updated",
              detail: notice.title,
              time: formatRelativeTime(
                notice.updated_at ||
                  notice.created_at
              ),
              timestamp:
                notice.updated_at ||
                notice.created_at,
              type: "notice" as const,
            })
          ),

          // Messages
          ...allMessages.map(
            (message) => ({
              id: `notification-message-${message.id}`,
              text: "New message received",
              detail:
                message.subject ||
                `Message from ${message.name}`,
              time: formatRelativeTime(
                message.created_at
              ),
              timestamp:
                message.created_at,
              type: "message" as const,
            })
          ),

          // Recruitment applications
          ...applications.map(
            (application) => ({
              id: `notification-application-${application.id}`,
              text: "New recruitment application",
              detail:
                application.full_name,
              time: formatRelativeTime(
                application.created_at
              ),
              timestamp:
                application.created_at,
              type: "application" as const,
            })
          ),

          // Individual registrations
          ...individualRegistrations.map(
            (registration) => ({
              id: `notification-individual-registration-${registration.id}`,
              text: "New event registration",
              detail:
                registrationPageMap.get(
                  registration.registration_page_id
                ) ||
                "Event registration",
              time: formatRelativeTime(
                registration.created_at
              ),
              timestamp:
                registration.created_at,
              type: "registration" as const,
            })
          ),

          // Team registrations
          ...teamRegistrations.map(
            (registration) => ({
              id: `notification-team-registration-${registration.id}`,
              text: "New team registration",
              detail:
                registrationPageMap.get(
                  registration.registration_page_id
                ) ||
                "Team event registration",
              time: formatRelativeTime(
                registration.created_at
              ),
              timestamp:
                registration.created_at,
              type: "registration" as const,
            })
          ),
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

        /*
         * ----------------------------------------------------
         * Update state
         * ----------------------------------------------------
         */

        setStats({
          publishedNotices:
            publishedNoticeCount,

          upcomingEvents:
            upcoming.length,

          teamMembers:
            allTeamMembers.length,

          unreadMessages:
            unreadResult.count ?? 0,
        });

        setUpcomingEvents(
          upcoming.map((event) => ({
            id: event.id,
            title: event.title,
            date: event.date,
            time: event.time,
          }))
        );

        setRecentMessages(
          allMessages
        );

        setNoticeOverview({
          published:
            publishedNoticeCount,

          hidden:
            hiddenNoticeCount,

          latest: latestNotice
            ? {
                title:
                  latestNotice.title,

                date:
                  latestNotice.date,
              }
            : null,
        });

        setTeamOverview({
          ...sectionCounts,
          total:
            allTeamMembers.length,
        });

        setActivities(
          activityItems
        );

        setNotifications(
          notificationItems
        );

        setLastSynced(
          new Date()
        );

        if (errors.length > 0) {
          setError(
            "Some dashboard data could not be loaded. The available information is still shown."
          );
        }
      } catch (err) {
        console.error(
          "Dashboard loading error:",
          err
        );

        setError(
          "Unable to load the dashboard right now. Please try refreshing."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  /*
   * --------------------------------------------------------
   * Realtime dashboard updates
   * --------------------------------------------------------
   */

  useEffect(() => {
    const channel = supabase
      .channel("admin-dashboard-live")

      // Events
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "events",
        },
        () => {
          void loadDashboard();
        }
      )

      // Notices
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notices",
        },
        () => {
          void loadDashboard();
        }
      )

      // Messages
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contact_messages",
        },
        () => {
          void loadDashboard();
        }
      )

      // Team
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tc_team",
        },
        () => {
          void loadDashboard();
        }
      )

      // Recruitment applications
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "recruitment_applications",
        },
        () => {
          void loadDashboard();
        }
      )

      // Individual event registrations
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "individual_registrations",
        },
        () => {
          void loadDashboard();
        }
      )

      // Team event registrations
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "team_registrations",
        },
        () => {
          void loadDashboard();
        }
      )

      .subscribe();

    return () => {
      void supabase.removeChannel(
        channel
      );
    };
  }, [loadDashboard]);

  const displayName = useMemo(() => {
    if (admin?.name?.trim()) {
      return admin.name
        .trim()
        .split(" ")[0];
    }

    if (admin?.email) {
      return admin.email.split("@")[0];
    }

    return "Admin";
  }, [admin]);

  const initials = useMemo(() => {
    if (!admin?.name) {
      return "A";
    }

    return admin.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }, [admin]);

  return (
    <main className="min-h-screen bg-[#f6f8fc] text-slate-900">

      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-5 sm:px-8 lg:px-10">

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
              <span>Admin Portal</span>
              <ChevronRight className="h-4 w-4" />
              <span className="text-slate-900">
                Dashboard
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">

            <div className="relative">

              <button
                type="button"
                onClick={() =>
                  setShowNotifications(
                    (current) => !current
                  )
                }
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
              >
                <Bell className="h-4.5 w-4.5" />

                {stats.unreadMessages > 0 && (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                )}
              </button>

              {/* Notifications */}
              {showNotifications && (
                <div className="absolute right-0 top-12 z-50 w-[330px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">

                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">

                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Notifications
                      </p>

                      <p className="text-xs text-slate-400">
                        Latest 4 updates
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setShowNotifications(false)
                      }
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      aria-label="Close notifications"
                    >
                      <X className="h-4 w-4" />
                    </button>

                  </div>

                  {/* No scrollbar — exactly 4 notifications */}
                  <div className="overflow-hidden">

                    {notifications.length > 0 ? (
                      notifications
                        .slice(0, 4)
                        .map(
                          (notification) => (
                            <div
                              key={
                                notification.id
                              }
                              className="border-b border-slate-100 px-4 py-3 last:border-0"
                            >
                              <div className="flex items-start gap-3">

                                <div
                                  className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl ${
                                    notification.type ===
                                    "notice"
                                      ? "bg-blue-50 text-blue-600"
                                      : notification.type ===
                                          "message"
                                        ? "bg-violet-50 text-violet-600"
                                        : notification.type ===
                                            "application"
                                          ? "bg-amber-50 text-amber-600"
                                          : "bg-emerald-50 text-emerald-600"
                                  }`}
                                >
                                  {notification.type ===
                                  "notice" ? (
                                    <FileText className="h-4 w-4" />
                                  ) : notification.type ===
                                    "message" ? (
                                    <MessageSquare className="h-4 w-4" />
                                  ) : notification.type ===
                                    "application" ? (
                                    <UserPlus className="h-4 w-4" />
                                  ) : (
                                    <CalendarDays className="h-4 w-4" />
                                  )}
                                </div>

                                <div className="min-w-0 flex-1">

                                  <p className="text-xs font-bold text-slate-900">
                                    {
                                      notification.text
                                    }
                                  </p>

                                  <p className="mt-0.5 truncate text-xs text-slate-500">
                                    {
                                      notification.detail
                                    }
                                  </p>

                                  <p className="mt-1 text-[11px] text-slate-400">
                                    {
                                      notification.time
                                    }
                                  </p>

                                </div>

                              </div>
                            </div>
                          )
                        )
                    ) : (
                      <div className="px-4 py-8 text-center text-sm text-slate-400">
                        You&apos;re all caught up.
                      </div>
                    )}

                  </div>
                </div>
              )}

            </div>

            <div className="hidden h-8 w-px bg-slate-200 sm:block" />

            <div className="flex items-center gap-3">

              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold text-slate-900">
                  {admin?.name ||
                    "Administrator"}
                </p>

                <p className="text-xs text-slate-400">
                  Administrator
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 via-teal-400 to-blue-500 text-sm font-bold text-white shadow-md shadow-blue-500/20">
                {initials}
              </div>

            </div>
          </div>

        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-5 py-7 sm:px-8 lg:px-10">

        {/* Hero */}
        <section className="relative mb-7 overflow-hidden rounded-[28px] border border-white/80 bg-white/75 px-6 py-8 shadow-[0_20px_60px_-25px_rgba(15,23,42,0.18)] backdrop-blur-2xl sm:px-8 lg:px-10 lg:py-9">

          <div className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-blue-200/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 right-1/3 h-80 w-80 rounded-full bg-emerald-200/25 blur-3xl" />
          <div className="pointer-events-none absolute -left-32 bottom-0 h-64 w-64 rounded-full bg-cyan-100/30 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">

            <div className="max-w-3xl">

              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/70 px-3.5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur-md">

                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 text-white">
                  <Sparkles className="h-3 w-3" />
                </span>

                Technical Council Control Center
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Welcome back{" "}
                <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 bg-clip-text text-transparent">
                  {displayName}.
                </span>
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                Everything your council needs, all in one place. Keep the website
                fresh, your team connected, and every update moving forward.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3">

                <span className="text-xs font-medium text-slate-400">
                  {getTodayLabel()}
                </span>

                <span className="h-1 w-1 rounded-full bg-slate-300" />

                <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]" />
                  Website connected
                </span>

              </div>
            </div>

            <div className="flex flex-wrap gap-3 lg:justify-end">

              <button
                type="button"
                onClick={() =>
                  void loadDashboard(true)
                }
                disabled={refreshing}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-md transition hover:border-slate-300 hover:bg-white hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    refreshing
                      ? "animate-spin"
                      : ""
                  }`}
                />
                Refresh
              </button>

              <button
                type="button"
                onClick={() =>
                  setShowQuickActions(true)
                }
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500 px-4 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/25"
              >
                <Plus className="h-4 w-4" />
                Quick Actions
              </button>

            </div>

          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">

            <span>{error}</span>

            <button
              type="button"
              onClick={() =>
                void loadDashboard(true)
              }
              className="shrink-0 font-bold underline underline-offset-2"
            >
              Try again
            </button>

          </div>
        )}

        {/* Stats */}
        <section className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard
            label="Published Notices"
            value={
              stats.publishedNotices
            }
            description="Visible on the website"
            icon={
              <Bell className="h-5 w-5" />
            }
            href="/admin/notices"
            loading={loading}
          />

          <StatCard
            label="Upcoming Events"
            value={
              stats.upcomingEvents
            }
            description="Events coming up"
            icon={
              <CalendarDays className="h-5 w-5" />
            }
            href="/admin/events"
            loading={loading}
          />

          <StatCard
            label="Team Members"
            value={stats.teamMembers}
            description="Published profiles"
            icon={
              <Users className="h-5 w-5" />
            }
            href="/admin/team"
            loading={loading}
          />

          <StatCard
            label="Unread Messages"
            value={
              stats.unreadMessages
            }
            description={
              stats.unreadMessages ===
              0
                ? "Inbox is all clear"
                : "Needs your attention"
            }
            icon={
              <MessageSquare className="h-5 w-5" />
            }
            href="/admin/messages"
            loading={loading}
          />

        </section>

        {/* Main Grid */}
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">

          {/* Upcoming Events */}
          <div className="xl:col-span-7">

            <DashboardCard
              title="What's happening"
              subtitle="Your next events at a glance"
              icon={
                <CalendarDays className="h-5 w-5" />
              }
              action={
                <Link
                  href="/admin/events"
                  className="text-xs font-bold text-slate-500 transition hover:text-slate-900"
                >
                  View all
                </Link>
              }
            >

              {loading ? (
                <LoadingRows />
              ) : upcomingEvents.length >
                0 ? (

                <div className="space-y-3">

                  {upcomingEvents.map(
                    (event) => (

                      <Link
                        key={event.id}
                        href="/admin/events"
                        className="group flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 transition hover:border-slate-200 hover:bg-white hover:shadow-sm"
                      >

                        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-100">

                          <span className="text-[10px] font-bold uppercase text-slate-400">
                            {
                              formatShortDate(
                                event.date
                              ).split(" ")[1]
                            }
                          </span>

                          <span className="text-lg font-bold leading-none text-slate-900">
                            {
                              formatShortDate(
                                event.date
                              ).split(" ")[0]
                            }
                          </span>

                        </div>

                        <div className="min-w-0 flex-1">

                          <p className="truncate text-sm font-bold text-slate-900 group-hover:text-indigo-600">
                            {event.title}
                          </p>

                          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-400">

                            <span className="flex items-center gap-1">
                              <CalendarDays className="h-3.5 w-3.5" />
                              {formatEventDate(
                                event.date
                              )}
                            </span>

                            {event.time && (
                              <span className="flex items-center gap-1">
                                <Clock3 className="h-3.5 w-3.5" />
                                {event.time}
                              </span>
                            )}

                          </div>
                        </div>

                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />

                      </Link>

                    )
                  )}

                </div>

              ) : (

                <EmptyState
                  icon={
                    <CalendarDays className="h-6 w-6" />
                  }
                  title="A quiet calendar"
                  description="No upcoming events yet. Create your next council moment."
                  href="/admin/events"
                  action="Create Event"
                />

              )}

            </DashboardCard>

          </div>

          {/* Recent Messages */}
          <div className="xl:col-span-5">

            <DashboardCard
              title="Inbox"
              subtitle="Latest messages from your website"
              icon={
                <MessageSquare className="h-5 w-5" />
              }
              action={
                <Link
                  href="/admin/messages"
                  className="text-xs font-bold text-slate-500 transition hover:text-slate-900"
                >
                  View inbox
                </Link>
              }
            >

              {loading ? (
                <LoadingRows />
              ) : recentMessages.length >
                0 ? (

                <div className="space-y-2">

                  {recentMessages.map(
                    (message) => (

                      <Link
                        key={message.id}
                        href="/admin/messages"
                        className="group flex items-center gap-3 rounded-xl px-2 py-3 transition hover:bg-slate-50"
                      >

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-600">

                          {message.name
                            .split(" ")
                            .filter(Boolean)
                            .slice(0, 2)
                            .map(
                              (part) =>
                                part[0]
                            )
                            .join("")
                            .toUpperCase()}

                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="flex items-center gap-2">

                            <p className="truncate text-sm font-semibold text-slate-900">
                              {message.name}
                            </p>

                            {message.status ===
                              "unread" && (
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                            )}

                          </div>

                          <p className="truncate text-xs text-slate-400">
                            {message.subject}
                          </p>

                        </div>

                        <span className="shrink-0 text-[11px] text-slate-400">
                          {formatRelativeTime(
                            message.created_at
                          )}
                        </span>

                      </Link>

                    )
                  )}

                </div>

              ) : (

                <EmptyState
                  icon={
                    <MessageSquare className="h-6 w-6" />
                  }
                  title="Inbox is quiet"
                  description="No messages have arrived recently."
                  href="/admin/messages"
                  action="Open Inbox"
                />

              )}

            </DashboardCard>

          </div>

          {/* Notice Overview */}
          <div className="xl:col-span-4">

            <DashboardCard
              title="Notice board"
              subtitle="Keep everyone informed"
              icon={
                <Bell className="h-5 w-5" />
              }
              action={
                <Link
                  href="/admin/notices"
                  className="text-xs font-bold text-slate-500 hover:text-slate-900"
                >
                  Manage
                </Link>
              }
            >

              <div className="grid grid-cols-2 gap-3">

                <div className="rounded-2xl bg-emerald-50 p-4">
                  <p className="text-2xl font-bold text-emerald-700">
                    {
                      noticeOverview.published
                    }
                  </p>

                  <p className="mt-1 text-xs font-semibold text-emerald-700/70">
                    Published
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-100 p-4">
                  <p className="text-2xl font-bold text-slate-700">
                    {
                      noticeOverview.hidden
                    }
                  </p>

                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Hidden
                  </p>
                </div>

              </div>

              <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">

                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Latest update
                </p>

                {noticeOverview.latest ? (
                  <>
                    <p className="mt-2 line-clamp-2 text-sm font-bold text-slate-900">
                      {
                        noticeOverview
                          .latest.title
                      }
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {formatEventDate(
                        noticeOverview
                          .latest.date
                      )}
                    </p>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-slate-400">
                    No notices created yet.
                  </p>
                )}

              </div>

            </DashboardCard>

          </div>

          {/* Team Overview */}
          <div className="xl:col-span-4">

            <DashboardCard
              title="Your team"
              subtitle="Council structure at a glance"
              icon={
                <Users className="h-5 w-5" />
              }
              action={
                <Link
                  href="/admin/team"
                  className="text-xs font-bold text-slate-500 hover:text-slate-900"
                >
                  Manage
                </Link>
              }
            >

              <div className="relative mb-4 flex items-end justify-between overflow-hidden rounded-2xl border border-white/80 bg-white/75 p-5 shadow-[0_20px_60px_-25px_rgba(15,23,42,0.18)] backdrop-blur-2xl">

                <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-blue-200/30 blur-3xl" />
              
                <div className="pointer-events-none absolute -bottom-12 -left-8 h-24 w-24 rounded-full bg-emerald-200/25 blur-3xl" />
              
                <div className="relative z-10">
                  <p className="text-xs font-medium text-slate-400">
                    Total published members
                  </p>
              
                  <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                    {teamOverview.total}
                  </p>
                </div>
              
                <Users className="relative z-10 h-8 w-8 text-slate-400" />
              
              </div>

              <div className="space-y-2">

                <TeamRow
                  label="Institutional Leadership"
                  value={
                    teamOverview.institutionalLeadership
                  }
                />

                <TeamRow
                  label="Executive Body"
                  value={
                    teamOverview.executiveBody
                  }
                />

                <TeamRow
                  label="Secretaries"
                  value={
                    teamOverview.secretaries
                  }
                />

                <TeamRow
                  label="Co-Secretaries"
                  value={
                    teamOverview.coSecretaries
                  }
                />

                <TeamRow
                  label="General Members"
                  value={
                    teamOverview.generalMembers
                  }
                />

              </div>

            </DashboardCard>

          </div>

          {/* Website Health — improved */}
          <div className="xl:col-span-4">

            <DashboardCard
              title="Website health"
              subtitle="Live connection status"
              icon={
                <CheckCircle2 className="h-5 w-5" />
              }
            >

              <div className="relative overflow-hidden rounded-2xl bg-emerald-50 p-5">

                <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-emerald-100" />

                <div className="relative">

                  {/* Main status */}
                  <div className="flex items-center justify-between">

                    <div className="flex items-center gap-2.5">

                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />

                      <div>
                        <p className="text-sm font-bold text-emerald-800">
                          Website Online
                        </p>

                        <p className="mt-0.5 text-[11px] font-medium text-emerald-700/60">
                          Public website is connected
                        </p>
                      </div>

                    </div>

                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />

                  </div>

                  {/* Health overview */}
                  <div className="mt-5 grid grid-cols-2 gap-2.5">

                    <div className="rounded-xl border border-emerald-100 bg-white/75 p-3">

                      <div className="flex items-center justify-between gap-2">

                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Dashboard
                        </p>

                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                      </div>

                      <p className="mt-1.5 text-xs font-bold text-slate-800">
                        Operational
                      </p>

                    </div>

                    <div className="rounded-xl border border-emerald-100 bg-white/75 p-3">

                      <div className="flex items-center justify-between gap-2">

                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Events
                        </p>

                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                      </div>

                      <p className="mt-1.5 text-xs font-bold text-slate-800">
                        {stats.upcomingEvents} upcoming
                      </p>

                    </div>

                    <div className="rounded-xl border border-emerald-100 bg-white/75 p-3">

                      <div className="flex items-center justify-between gap-2">

                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Team
                        </p>

                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                      </div>

                      <p className="mt-1.5 text-xs font-bold text-slate-800">
                        {stats.teamMembers} profiles
                      </p>

                    </div>

                    <div className="rounded-xl border border-emerald-100 bg-white/75 p-3">

                      <div className="flex items-center justify-between gap-2">

                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Content
                        </p>

                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                      </div>

                      <p className="mt-1.5 text-xs font-bold text-slate-800">
                        {stats.publishedNotices} notices live
                      </p>

                    </div>

                  </div>

                  {/* Bottom actions */}
                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-emerald-100/80 pt-4">

                    <div>

                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700/50">
                        Last synced
                      </p>

                      <p className="mt-1 text-xs font-semibold text-emerald-800">

                        {lastSynced
                          ? lastSynced.toLocaleTimeString(
                              "en-IN",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )
                          : "—"}

                      </p>

                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        window.open(
                          "/",
                          "_blank",
                          "noopener,noreferrer"
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-bold text-emerald-800 shadow-sm ring-1 ring-emerald-100 transition hover:-translate-y-0.5 hover:shadow"
                    >
                      Open Website
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>

                  </div>

                </div>
              </div>

            </DashboardCard>

          </div>

          {/* Activity */}
          <div className="xl:col-span-12">

            <DashboardCard
              title="Recent activity"
              subtitle="A quick pulse of what changed"
              icon={
                <Clock3 className="h-5 w-5" />
              }
              action={
                <span className="text-xs font-medium text-slate-400">
                  Latest updates
                </span>
              }
            >

              {activities.length > 0 ? (

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">

                  {activities.map(
                    (activity) => (

                      <Link
                        key={activity.id}
                        href={
                          activity.type ===
                          "event"
                            ? "/admin/events"
                            : "/admin/notices"
                        }
                        className="group rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition hover:border-slate-200 hover:bg-white hover:shadow-sm"
                      >

                        <div className="flex items-start justify-between gap-3">

                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                              activity.type ===
                              "event"
                                ? "bg-blue-50 text-blue-600"
                                : "bg-indigo-50 text-indigo-600"
                            }`}
                          >

                            {activity.type ===
                            "event" ? (
                              <CalendarDays className="h-4 w-4" />
                            ) : (
                              <Bell className="h-4 w-4" />
                            )}

                          </div>

                          <span className="text-[11px] text-slate-400">
                            {activity.time}
                          </span>

                        </div>

                        <p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-400">
                          {activity.text}
                        </p>

                        <p className="mt-1 line-clamp-2 text-sm font-bold text-slate-900 group-hover:text-indigo-600">
                          {activity.detail}
                        </p>

                      </Link>

                    )
                  )}

                </div>

              ) : (

                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-5 py-10 text-center">

                  <Clock3 className="mx-auto h-7 w-7 text-slate-300" />

                  <p className="mt-3 text-sm font-bold text-slate-700">
                    Your activity feed is waiting
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Publish a notice or create an event to see updates here.
                  </p>

                </div>

              )}

            </DashboardCard>

          </div>

        </section>

        {/* Bottom Catchy Section */}
        <section className="mt-7 overflow-hidden rounded-[28px] border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-blue-50 px-6 py-7 sm:px-8">

          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            <div className="max-w-2xl">

              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600">
                <Sparkles className="h-4 w-4" />
                Keep the momentum going
              </div>

              <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Build the council. Share the work. Make the impact visible.
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Your dashboard is the command center for everything happening
                across Technical Council. One update here keeps the entire
                website moving.
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                setShowQuickActions(true)
              }
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              Do something useful
            </button>

          </div>

        </section>

      </div>

      {/* Quick Actions Modal */}
      {showQuickActions && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {
              setShowQuickActions(false);
            }

          }}
        >

          <div className="w-full max-w-lg overflow-hidden rounded-[28px] bg-white shadow-2xl">

            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">

              <div>

                <div className="flex items-center gap-2">

                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white">
                    <Sparkles className="h-4 w-4" />
                  </div>

                  <div>

                    <h2 className="text-lg font-bold text-slate-900">
                      Quick Actions
                    </h2>

                    <p className="text-xs text-slate-400">
                      What would you like to manage?
                    </p>

                  </div>

                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowQuickActions(false)
                }
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>

            </div>

            <div className="grid gap-2 p-4 sm:grid-cols-2">

              <QuickAction
                href="/admin/events"
                icon={
                  <CalendarDays className="h-5 w-5" />
                }
                title="Create Event"
                description="Add an upcoming event"
              />

              <QuickAction
                href="/admin/team"
                icon={
                  <Users className="h-5 w-5" />
                }
                title="Add Team Member"
                description="Grow your council profile"
              />

              <QuickAction
                href="/admin/gallery"
                icon={
                  <ImagePlus className="h-5 w-5" />
                }
                title="Add Gallery Photo"
                description="Showcase council moments"
              />

              <QuickAction
                href="/admin/notices"
                icon={
                  <Bell className="h-5 w-5" />
                }
                title="Publish Notice"
                description="Share an important update"
              />

              <QuickAction
                href="/admin/messages"
                icon={
                  <MessageSquare className="h-5 w-5" />
                }
                title="View Messages"
                description="Check your website inbox"
              />

              <QuickAction
                href="/"
                icon={
                  <ExternalLink className="h-5 w-5" />
                }
                title="Open Website"
                description="See the public website"
              />

            </div>

          </div>

        </div>

      )}

    </main>
  );
}

function StatCard({
  label,
  value,
  description,
  icon,
  href,
  loading,
}: {
  label: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  href: string;
  loading: boolean;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
    >

      <div className="flex items-start justify-between">

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition group-hover:bg-slate-900 group-hover:text-white">
          {icon}
        </div>

        <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />

      </div>

      <div className="mt-5">

        {loading ? (
          <div className="h-9 w-16 animate-pulse rounded-lg bg-slate-100" />
        ) : (
          <p className="text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        )}

        <p className="mt-1 text-sm font-bold text-slate-700">
          {label}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          {description}
        </p>

      </div>

    </Link>
  );
}

function DashboardCard({
  title,
  subtitle,
  icon,
  action,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="h-full rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">

      <div className="mb-5 flex items-start justify-between gap-4">

        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            {icon}
          </div>

          <div>

            <h2 className="text-sm font-bold text-slate-900">
              {title}
            </h2>

            <p className="mt-0.5 text-xs text-slate-400">
              {subtitle}
            </p>

          </div>

        </div>

        {action}

      </div>

      {children}

    </section>
  );
}

function TeamRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl px-2 py-2 transition hover:bg-slate-50">

      <span className="text-xs font-medium text-slate-500">
        {label}
      </span>

      <span className="min-w-7 rounded-lg bg-slate-100 px-2 py-1 text-center text-xs font-bold text-slate-700">
        {value}
      </span>

    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
  href,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  action: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-5 py-9 text-center">

      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-300 shadow-sm ring-1 ring-slate-100">
        {icon}
      </div>

      <p className="mt-4 text-sm font-bold text-slate-700">
        {title}
      </p>

      <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-slate-400">
        {description}
      </p>

      <Link
        href={href}
        className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
      >
        {action}
        <ChevronRight className="h-3.5 w-3.5" />
      </Link>

    </div>
  );
}

function QuickAction({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-2xl border border-slate-100 p-3 transition hover:border-slate-200 hover:bg-slate-50"
    >

      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition group-hover:bg-slate-900 group-hover:text-white">
        {icon}
      </div>

      <div className="min-w-0 flex-1">

        <p className="text-sm font-bold text-slate-900">
          {title}
        </p>

        <p className="mt-0.5 truncate text-xs text-slate-400">
          {description}
        </p>

      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />

    </Link>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-3">

      {[1, 2, 3].map((item) => (

        <div
          key={item}
          className="flex items-center gap-4 rounded-2xl bg-slate-50 p-3.5"
        >

          <div className="h-14 w-14 animate-pulse rounded-xl bg-slate-200" />

          <div className="flex-1">

            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />

            <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-slate-100" />

          </div>

        </div>

      ))}

    </div>
  );
}