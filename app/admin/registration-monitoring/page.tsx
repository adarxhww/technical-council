"use client";

import Link from "next/link";
import {
  AlertCircle,
  BarChart3,
  Download,
  ExternalLink,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type RegistrationPage = {
  id: string;
  event_id: string | null;
  event_name: string;
  slug: string;
  event_type: "individual" | "team";
  status: "draft" | "published" | "closed";
};

type MonitoringRow = RegistrationPage & {
  registrationCount: number;
};

const supabase = createClient();

export default function RegistrationMonitoringPage() {
  const [pages, setPages] = useState<RegistrationPage[]>([]);
  const [rows, setRows] = useState<MonitoringRow[]>([]);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<
    "all" | "individual" | "team"
  >("all");

  const [statusFilter, setStatusFilter] = useState<
    "all" | "draft" | "published" | "closed"
  >("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadMonitoring() {
    setLoading(true);
    setError("");

    try {
      /*
       * STEP 1
       * Load registration pages.
       *
       * We intentionally do NOT load events here.
       * registration_pages already contains event_name
       * and event_id, so this keeps the monitoring page
       * independent from the events table.
       */
      const {
        data: registrationPages,
        error: pagesError,
      } = await supabase
        .from("registration_pages")
        .select(
          `
            id,
            event_id,
            event_name,
            slug,
            event_type,
            status
          `
        )
        .order("created_at", {
          ascending: false,
        });

      if (pagesError) {
        throw new Error(
          `Unable to load registration pages: ${pagesError.message}`
        );
      }

      const loadedPages =
        (registrationPages ?? []) as RegistrationPage[];

      setPages(loadedPages);

      /*
       * STEP 2
       * Count registrations separately for every page.
       *
       * This avoids mixing event_id and registration_page_id
       * and prevents one failed count from destroying the
       * complete monitoring page.
       */
      const monitoringRows: MonitoringRow[] = [];

      for (const page of loadedPages) {
        let registrationCount = 0;

        if (page.event_type === "individual") {
          const {
            count,
            error: countError,
          } = await supabase
            .from("individual_registrations")
            .select("id", {
              count: "exact",
              head: true,
            })
            .eq("registration_page_id", page.id);

          if (countError) {
            console.error(
              `Individual registration count failed for ${page.event_name}:`,
              countError
            );

            /*
             * Do not fail the entire page just because a
             * count query failed. Show 0 and continue.
             */
            registrationCount = 0;
          } else {
            registrationCount = count ?? 0;
          }
        } else {
          const {
            count,
            error: countError,
          } = await supabase
            .from("team_registrations")
            .select("id", {
              count: "exact",
              head: true,
            })
            .eq("registration_page_id", page.id);

          if (countError) {
            console.error(
              `Team registration count failed for ${page.event_name}:`,
              countError
            );

            registrationCount = 0;
          } else {
            registrationCount = count ?? 0;
          }
        }

        monitoringRows.push({
          ...page,
          registrationCount,
        });
      }

      setRows(monitoringRows);
    } catch (err) {
      console.error(
        "Registration monitoring load error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load registration monitoring."
      );

      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMonitoring();
  }, []);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSearch =
        !query ||
        row.event_name
          .toLowerCase()
          .includes(query) ||
        row.slug.toLowerCase().includes(query);

      const matchesType =
        typeFilter === "all" ||
        row.event_type === typeFilter;

      const matchesStatus =
        statusFilter === "all" ||
        row.status === statusFilter;

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus
      );
    });
  }, [
    rows,
    search,
    typeFilter,
    statusFilter,
  ]);

  const totalRegistrations = rows.reduce(
    (total, row) =>
      total + row.registrationCount,
    0
  );

  const publishedPages = rows.filter(
    (row) => row.status === "published"
  ).length;

  const individualPages = rows.filter(
    (row) => row.event_type === "individual"
  ).length;

  const teamPages = rows.filter(
    (row) => row.event_type === "team"
  ).length;

  function downloadCsv() {
    if (!rows.length) {
      return;
    }

    const header = [
      "Event",
      "Registration Type",
      "Status",
      "Registrations",
      "Registration URL",
    ];

    const csvRows = rows.map((row) => [
      row.event_name,
      row.event_type,
      row.status,
      row.registrationCount,
      `/events/${row.slug}/register`,
    ]);

    const escapeCsv = (value: unknown) => {
      const text = String(value ?? "");

      if (
        text.includes(",") ||
        text.includes('"') ||
        text.includes("\n")
      ) {
        return `"${text.replace(/"/g, '""')}"`;
      }

      return text;
    };

    const csv = [
      header,
      ...csvRows,
    ]
      .map((row) =>
        row.map(escapeCsv).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url =
      URL.createObjectURL(blob);

    const anchor =
      document.createElement("a");

    anchor.href = url;
    anchor.download =
      "registration-monitoring.csv";

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1500px]">
        {/* HEADER */}

        <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
              Registration Management
            </p>

            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Registration Monitoring
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Monitor registrations event-wise,
              view submitted data, and export
              registration summaries.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={downloadCsv}
              disabled={!rows.length}
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-slate-200
                bg-white
                px-4
                py-2.5
                text-sm
                font-semibold
                text-slate-700
                shadow-sm
                transition
                hover:bg-slate-50
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              <Download size={17} />
              Export CSV
            </button>

            <button
              type="button"
              onClick={loadMonitoring}
              disabled={loading}
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-gradient-to-r
                from-emerald-500
                to-blue-600
                px-4
                py-2.5
                text-sm
                font-semibold
                text-white
                shadow-sm
                transition
                hover:from-emerald-600
                hover:to-blue-700
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              <RefreshCw
                size={17}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />
              Refresh
            </button>
          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle
                size={19}
                className="mt-0.5 shrink-0 text-rose-600"
              />

              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-rose-800">
                  Unable to load monitoring
                </p>

                <p className="mt-1 break-words text-sm text-rose-700">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={loadMonitoring}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700"
                >
                  <RefreshCw size={14} />
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STATS */}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Registration Pages
              </p>

              <BarChart3
                size={19}
                className="text-blue-500"
              />
            </div>

            <p className="mt-2 text-2xl font-bold text-slate-950">
              {rows.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Published Pages
              </p>

              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </div>

            <p className="mt-2 text-2xl font-bold text-slate-950">
              {publishedPages}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Total Registrations
              </p>

              <Users
                size={19}
                className="text-violet-500"
              />
            </div>

            <p className="mt-2 text-2xl font-bold text-slate-950">
              {totalRegistrations}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Page Types
            </p>

            <div className="mt-2 flex items-center gap-4">
              <div>
                <p className="text-lg font-bold text-slate-950">
                  {individualPages}
                </p>

                <p className="text-xs text-slate-400">
                  Individual
                </p>
              </div>

              <div className="h-8 w-px bg-slate-200" />

              <div>
                <p className="text-lg font-bold text-slate-950">
                  {teamPages}
                </p>

                <p className="text-xs text-slate-400">
                  Team
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FILTERS */}

        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search by event name..."
                className="
                  h-11
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  pl-10
                  pr-4
                  text-sm
                  text-slate-900
                  outline-none
                  transition
                  placeholder:text-slate-400
                  focus:border-blue-400
                  focus:ring-2
                  focus:ring-blue-100
                "
              />
            </div>

            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(
                  event.target.value as
                    | "all"
                    | "individual"
                    | "team"
                )
              }
              className="
                h-11
                rounded-xl
                border
                border-slate-200
                bg-white
                px-4
                text-sm
                font-medium
                text-slate-700
                outline-none
                focus:border-blue-400
                focus:ring-2
                focus:ring-blue-100
              "
            >
              <option value="all">
                All Types
              </option>

              <option value="individual">
                Individual
              </option>

              <option value="team">
                Team
              </option>
            </select>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as
                    | "all"
                    | "draft"
                    | "published"
                    | "closed"
                )
              }
              className="
                h-11
                rounded-xl
                border
                border-slate-200
                bg-white
                px-4
                text-sm
                font-medium
                text-slate-700
                outline-none
                focus:border-blue-400
                focus:ring-2
                focus:ring-blue-100
              "
            >
              <option value="all">
                All Statuses
              </option>

              <option value="published">
                Published
              </option>

              <option value="draft">
                Draft
              </option>

              <option value="closed">
                Closed
              </option>
            </select>
          </div>
        </div>

        {/* CONTENT */}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <RefreshCw
              size={25}
              className="mx-auto animate-spin text-blue-500"
            />

            <p className="mt-3 text-sm font-medium text-slate-500">
              Loading registration monitoring...
            </p>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
            <Users
              size={36}
              className="mx-auto text-slate-300"
            />

            <h2 className="mt-3 text-base font-bold text-slate-900">
              No registration data
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              No registration pages match
              the current filters.
            </p>
          </div>
        ) : (
          <>
            {/* DESKTOP */}

            <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                        Event
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                        Type
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                        Status
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                        Registrations
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                        Registration Page
                      </th>

                      <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-400">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredRows.map(
                      (row) => (
                        <tr
                          key={row.id}
                          className="border-b border-slate-100 last:border-b-0"
                        >
                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-slate-900">
                              {row.event_name}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              /events/
                              {row.slug}
                              /register
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-600">
                              {row.event_type}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge
                              status={row.status}
                            />
                          </td>

                          <td className="px-5 py-4">
                            <span className="text-sm font-bold text-slate-900">
                              {row.registrationCount}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <a
                              href={`/events/${row.slug}/register`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 transition hover:text-blue-700"
                            >
                              Open
                              <ExternalLink
                                size={13}
                              />
                            </a>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <Link
                              href={`/admin/registrations/${row.id}`}
                              className="
                                inline-flex
                                items-center
                                justify-center
                                rounded-lg
                                bg-gradient-to-r
                                from-emerald-500
                                to-blue-600
                                px-3
                                py-2
                                text-xs
                                font-bold
                                text-white
                                transition
                                hover:from-emerald-600
                                hover:to-blue-700
                              "
                            >
                              Monitor
                            </Link>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MOBILE */}

            <div className="space-y-4 lg:hidden">
              {filteredRows.map(
                (row) => (
                  <div
                    key={row.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="text-base font-bold text-slate-950">
                          {row.event_name}
                        </h2>

                        <p className="mt-1 break-all text-xs text-slate-400">
                          /events/
                          {row.slug}
                          /register
                        </p>
                      </div>

                      <StatusBadge
                        status={row.status}
                      />
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Type
                        </p>

                        <p className="mt-1 text-sm font-semibold capitalize text-slate-800">
                          {row.event_type}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Registrations
                        </p>

                        <p className="mt-1 text-sm font-bold text-slate-900">
                          {row.registrationCount}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Link
                        href={`/admin/registrations/${row.id}`}
                        className="
                          flex
                          flex-1
                          items-center
                          justify-center
                          rounded-xl
                          bg-gradient-to-r
                          from-emerald-500
                          to-blue-600
                          px-4
                          py-2.5
                          text-sm
                          font-bold
                          text-white
                        "
                      >
                        Monitor
                      </Link>

                      <a
                        href={`/events/${row.slug}/register`}
                        target="_blank"
                        rel="noreferrer"
                        className="
                          inline-flex
                          items-center
                          justify-center
                          rounded-xl
                          border
                          border-slate-200
                          bg-white
                          px-4
                          py-2.5
                          text-slate-600
                        "
                        aria-label="Open registration page"
                      >
                        <ExternalLink
                          size={17}
                        />
                      </a>
                    </div>
                  </div>
                )
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: RegistrationPage["status"];
}) {
  const styles =
    status === "published"
      ? "bg-emerald-50 text-emerald-700"
      : status === "closed"
        ? "bg-rose-50 text-rose-700"
        : "bg-amber-50 text-amber-700";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${styles}`}
    >
      {status}
    </span>
  );
}