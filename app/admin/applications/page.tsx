"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Download,
  FileSpreadsheet,
  FileText,
  Mail,
  Phone,
  Search,
  Trash2,
  User,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Application = {
  id: string;
  full_name: string;
  email: string;
  whatsapp_number: string;
  branch: string;
  year: string;
  technical_skills: string[];
  other_skill: string | null;
  areas_of_interest: string | null;
  why_join: string | null;
  resume_path: string | null;
  resume_name: string | null;
  resume_type: string | null;
  resume_size: number | null;
  created_at: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return "";

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function ApplicationsPage() {
  const supabase = createClient();

  const [applications, setApplications] = useState<Application[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);

  const [resumeLoading, setResumeLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] =
    useState(false);

  /* =====================================================
     LOAD APPLICATIONS
     ===================================================== */

  const loadApplications = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("recruitment_applications")
      .select(`
        id,
        full_name,
        email,
        whatsapp_number,
        branch,
        year,
        technical_skills,
        other_skill,
        areas_of_interest,
        why_join,
        resume_path,
        resume_name,
        resume_type,
        resume_size,
        created_at
      `)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Applications loading error:",
        error
      );

      setApplications([]);
    } else {
      setApplications(
        (data as Application[]) ?? []
      );
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  /* =====================================================
     SEARCH
     ===================================================== */

  const filteredApplications = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return applications;
    }

    return applications.filter((application) => {
      return (
        application.full_name
          .toLowerCase()
          .includes(query) ||
        application.email
          .toLowerCase()
          .includes(query) ||
        application.whatsapp_number
          .toLowerCase()
          .includes(query) ||
        application.branch
          .toLowerCase()
          .includes(query) ||
        application.year
          .toLowerCase()
          .includes(query) ||
        (
          application.areas_of_interest ?? ""
        )
          .toLowerCase()
          .includes(query)
      );
    });
  }, [applications, search]);

  /* =====================================================
     CSV EXPORT
     ===================================================== */

  const exportApplicationsCsv = () => {
    if (applications.length === 0) {
      alert(
        "There are no applications to export."
      );

      return;
    }

    const headers = [
      "Application ID",
      "Submitted At",
      "Full Name",
      "Email",
      "WhatsApp Number",
      "Branch / Department",
      "Year",
      "Technical Skills",
      "Other Skill",
      "Areas of Interest",
      "Why do you want to join?",
      "Resume",
      "Resume Type",
      "Resume Size",
    ];

    const escapeCsvValue = (
      value: unknown
    ) => {
      const stringValue = String(
        value ?? ""
      );

      return `"${stringValue.replace(
        /"/g,
        '""'
      )}"`;
    };

    const rows = applications.map(
      (application) => [
        application.id,

        formatDate(
          application.created_at
        ),

        application.full_name,

        application.email,

        application.whatsapp_number,

        application.branch,

        application.year,

        application.technical_skills?.join(
          ", "
        ) ?? "",

        application.other_skill ?? "",

        application.areas_of_interest ?? "",

        application.why_join ?? "",

        application.resume_name ??
          "No resume",

        application.resume_type ?? "",

        application.resume_size
          ? formatFileSize(
              application.resume_size
            )
          : "",
      ]
    );

    const csv = [
      headers
        .map(escapeCsvValue)
        .join(","),

      ...rows.map((row) =>
        row
          .map(escapeCsvValue)
          .join(",")
      ),
    ].join("\r\n");

    const blob = new Blob(
      ["\uFEFF" + csv],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    const date = new Date()
      .toISOString()
      .slice(0, 10);

    link.download =
      `technical-council-applications-${date}.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  /* =====================================================
     OPEN RESUME
     ===================================================== */

  const openResume = async (
    application: Application
  ) => {
    if (!application.resume_path) {
      return;
    }

    setResumeLoading(true);

    try {
      const response = await fetch(
        `/api/recruitment/applications/${application.id}/resume`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const responseText =
        await response.text();

      let result: {
        success?: boolean;
        url?: string;
        message?: string;
      } | null = null;

      try {
        result = responseText
          ? JSON.parse(responseText)
          : null;
      } catch {
        throw new Error(
          `Resume server returned an invalid response (${response.status}).`
        );
      }

      if (
        !response.ok ||
        !result?.success ||
        !result.url
      ) {
        throw new Error(
          result?.message ||
            `Could not open resume (${response.status}).`
        );
      }

      window.open(
        result.url,
        "_blank",
        "noopener,noreferrer"
      );
    } catch (error) {
      console.error(
        "Open resume error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Could not open the resume."
      );
    } finally {
      setResumeLoading(false);
    }
  };

  /* =====================================================
     DELETE APPLICATION
     ===================================================== */

  const deleteApplication = async () => {
    if (
      !selectedApplication ||
      deleting
    ) {
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch(
        `/api/recruitment/applications/${selectedApplication.id}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
          },
        }
      );

      /*
       * Read the response as text first.
       *
       * This prevents:
       *
       * Unexpected token '<'
       *
       * when Next.js returns an HTML
       * error page instead of JSON.
       */

      const responseText =
        await response.text();

      let result: {
        success?: boolean;
        message?: string;
        storageWarning?: string | null;
      } | null = null;

      try {
        result = responseText
          ? JSON.parse(responseText)
          : null;
      } catch {
        throw new Error(
          `Delete server returned an invalid response (${response.status}).`
        );
      }

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.message ||
            `Could not delete application (${response.status}).`
        );
      }

      /*
       * Remove it immediately from
       * the current UI.
       */

      const deletedId =
        selectedApplication.id;

      setApplications(
        (current) =>
          current.filter(
            (application) =>
              application.id !==
              deletedId
          )
      );

      setSelectedApplication(null);
      setShowDeleteConfirm(false);

      if (result.storageWarning) {
        alert(
          result.storageWarning
        );
      } else {
        alert(
          "Application deleted successfully."
        );
      }
    } catch (error) {
      console.error(
        "Delete application error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Could not delete the application."
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f6f7fb] p-4 text-slate-950 dark:bg-slate-950 dark:text-white sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* =================================================
            HEADER
            ================================================= */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <p className="text-sm font-semibold text-blue-600">
              Recruitment
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
              Applications
            </h1>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              View all Technical Council
              recruitment applications.
            </p>
          </div>

          <div className="flex items-center gap-3">

            {/* Export CSV */}

            <button
              type="button"
              onClick={
                exportApplicationsCsv
              }
              disabled={
                applications.length === 0
              }
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-emerald-600 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FileSpreadsheet
                size={16}
              />

              Export CSV
            </button>

            {/* Total */}

            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">

              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Total Applications
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">
                {applications.length}
              </p>

            </div>

          </div>
        </div>

        {/* =================================================
            SEARCH
            ================================================= */}

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">

          <div className="relative">

            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search by name, email, branch, year..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
            />

          </div>
        </div>

        {/* =================================================
            APPLICATION LIST
            ================================================= */}

        {loading ? (

          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">

            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Loading applications...
            </p>

          </div>

        ) : filteredApplications.length === 0 ? (

          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">

            <User
              size={34}
              className="mx-auto text-slate-300 dark:text-slate-600"
            />

            <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
              {search
                ? "No applications found"
                : "No applications yet"}
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {search
                ? "Try a different search."
                : "Applications submitted through Join Now will appear here."}
            </p>

          </div>

        ) : (

          <div className="grid gap-4">

            {filteredApplications.map(
              (application) => (

                <button
                  key={application.id}
                  type="button"
                  onClick={() =>
                    setSelectedApplication(
                      application
                    )
                  }
                  className="group w-full rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                >

                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                    <div className="flex min-w-0 items-start gap-4">

                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-600 text-white shadow-sm">
                        <User size={20} />
                      </div>

                      <div className="min-w-0">

                        <h2 className="truncate text-base font-bold text-slate-950 dark:text-white">
                          {
                            application.full_name
                          }
                        </h2>

                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">

                          <span>
                            {
                              application.branch
                            }
                          </span>

                          <span>
                            {
                              application.year
                            }
                          </span>

                        </div>

                        <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
                          {
                            application.email
                          }
                        </p>

                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">

                      {application.resume_path && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">

                          <FileText
                            size={13}
                          />

                          Resume

                        </span>
                      )}

                      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {formatDate(
                          application.created_at
                        )}
                      </span>

                    </div>

                  </div>

                </button>

              )
            )}

          </div>

        )}

      </div>

      {/* ===================================================
          DETAILS MODAL
          =================================================== */}

      {selectedApplication && (

        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onClick={() => {
            if (
              !showDeleteConfirm &&
              !deleting
            ) {
              setSelectedApplication(
                null
              );
            }
          }}
        >

          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-8"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* =================================================
                MODAL HEADER
                ================================================= */}

            <div className="flex items-start justify-between gap-4">

              <div>

                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                  Recruitment Application
                </p>

                <h2 className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">
                  {
                    selectedApplication.full_name
                  }
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Submitted{" "}
                  {formatDate(
                    selectedApplication.created_at
                  )}
                </p>

              </div>

              <div className="flex shrink-0 items-center gap-2">

                {/* Delete */}

                <button
                  type="button"
                  onClick={() =>
                    setShowDeleteConfirm(
                      true
                    )
                  }
                  disabled={deleting}
                  className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                >

                  <Trash2 size={14} />

                  Delete

                </button>

                {/* Close */}

                <button
                  type="button"
                  onClick={() =>
                    setSelectedApplication(
                      null
                    )
                  }
                  disabled={deleting}
                  className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>

              </div>

            </div>

            {/* =================================================
                PERSONAL INFORMATION
                ================================================= */}

            <section className="mt-7">

              <h3 className="text-sm font-bold text-slate-950 dark:text-white">
                Personal Information
              </h3>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">

                <InfoCard
                  label="Full Name"
                  value={
                    selectedApplication.full_name
                  }
                />

                <InfoCard
                  label="Email"
                  value={
                    selectedApplication.email
                  }
                  icon={
                    <Mail size={15} />
                  }
                />

                <InfoCard
                  label="WhatsApp Number"
                  value={
                    selectedApplication.whatsapp_number
                  }
                  icon={
                    <Phone size={15} />
                  }
                />

                <InfoCard
                  label="Branch / Department"
                  value={
                    selectedApplication.branch
                  }
                />

                <InfoCard
                  label="Year"
                  value={
                    selectedApplication.year
                  }
                />

              </div>

            </section>

            {/* =================================================
                TECHNICAL SKILLS
                ================================================= */}

            <section className="mt-7">

              <h3 className="text-sm font-bold text-slate-950 dark:text-white">
                Technical Skills
              </h3>

              <div className="mt-3 flex flex-wrap gap-2">

                {selectedApplication
                  .technical_skills
                  ?.length ? (

                  selectedApplication.technical_skills.map(
                    (skill) => (

                      <span
                        key={skill}
                        className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                      >
                        {skill}
                      </span>

                    )
                  )

                ) : (

                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No technical skills
                    selected.
                  </p>

                )}

              </div>

              {selectedApplication.other_skill && (

                <div className="mt-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">

                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Other Skill
                  </p>

                  <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">
                    {
                      selectedApplication.other_skill
                    }
                  </p>

                </div>

              )}

            </section>

            {/* =================================================
                AREAS OF INTEREST
                ================================================= */}

            <section className="mt-7">

              <h3 className="text-sm font-bold text-slate-950 dark:text-white">
                Areas of Interest
              </h3>

              <div className="mt-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">

                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">
                  {
                    selectedApplication.areas_of_interest ||
                    "Not provided"
                  }
                </p>

              </div>

            </section>

            {/* =================================================
                WHY JOIN
                ================================================= */}

            <section className="mt-7">

              <h3 className="text-sm font-bold text-slate-950 dark:text-white">
                Why do you want to join?
              </h3>

              <div className="mt-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">

                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">
                  {
                    selectedApplication.why_join ||
                    "Not provided"
                  }
                </p>

              </div>

            </section>

            {/* =================================================
                RESUME
                ================================================= */}

            <section className="mt-7">

              <h3 className="text-sm font-bold text-slate-950 dark:text-white">
                CV / Resume
              </h3>

              {selectedApplication.resume_path ? (

                <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800 sm:flex-row sm:items-center sm:justify-between">

                  <div className="flex min-w-0 items-center gap-3">

                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-slate-500 shadow-sm dark:bg-slate-700 dark:text-slate-300">

                      <FileText
                        size={18}
                      />

                    </div>

                    <div className="min-w-0">

                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                        {
                          selectedApplication.resume_name ||
                          "Resume"
                        }
                      </p>

                      <p className="text-xs text-slate-500 dark:text-slate-400">

                        {
                          selectedApplication.resume_type ||
                          "Document"
                        }

                        {selectedApplication.resume_size
                          ? ` · ${formatFileSize(
                              selectedApplication.resume_size
                            )}`
                          : ""}

                      </p>

                    </div>

                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      openResume(
                        selectedApplication
                      )
                    }
                    disabled={
                      resumeLoading ||
                      deleting
                    }
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:from-emerald-600 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >

                    <Download
                      size={15}
                    />

                    {resumeLoading
                      ? "Opening..."
                      : "View Resume"}

                  </button>

                </div>

              ) : (

                <div className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  No resume uploaded.
                </div>

              )}

            </section>

          </div>

          {/* =================================================
              DELETE CONFIRMATION
              ================================================= */}

          {showDeleteConfirm && (

            <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">

              <div
                className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
                onClick={(e) =>
                  e.stopPropagation()
                }
              >

                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                  <Trash2 size={21} />
                </div>

                <h3 className="mt-5 text-lg font-bold text-slate-950 dark:text-white">
                  Delete application?
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">

                  This will permanently
                  delete{" "}

                  <span className="font-semibold text-slate-700 dark:text-slate-200">

                    {
                      selectedApplication.full_name
                    }

                  </span>

                  's application.

                </p>

                <p className="mt-2 text-xs font-medium text-red-500 dark:text-red-400">
                  This action cannot be undone.
                </p>

                <div className="mt-6 flex justify-end gap-3">

                  <button
                    type="button"
                    onClick={() =>
                      setShowDeleteConfirm(
                        false
                      )
                    }
                    disabled={deleting}
                    className="rounded-full bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={
                      deleteApplication
                    }
                    disabled={deleting}
                    className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >

                    <Trash2 size={15} />

                    {deleting
                      ? "Deleting..."
                      : "Delete Permanently"}

                  </button>

                </div>

              </div>

            </div>

          )}

        </div>

      )}

    </main>
  );
}

/* ===========================================================
   INFO CARD
   =========================================================== */

function InfoCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">

      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
        {label}
      </p>

      <p className="mt-1 flex items-center gap-2 break-words text-sm font-medium text-slate-900 dark:text-slate-200">

        {icon}

        {value || "Not provided"}

      </p>

    </div>
  );
}