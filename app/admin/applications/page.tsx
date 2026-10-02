"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import Link from "next/link";

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
  custom_answers: Record<string, unknown> | null;
};

type FormField = {
  id: string;
  field_key: string;
  label: string;
  field_type: string;
  enabled: boolean;
  display_order: number;
  system_field: boolean;
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

function getPhoneNumber(application: Application) {
  const phone = application.custom_answers?.phone;

  return typeof phone === "string" ? phone : "";
}

/**
 * Convert any answer into a CSV-friendly string.
 */
function formatAnswerForCsv(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => formatAnswerForCsv(item))
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "";
    }
  }

  return String(value);
}

/**
 * Get an application's value for a configured form field.
 *
 * Dedicated/system fields are stored in their own columns.
 * Custom fields are stored inside custom_answers.
 */
function getApplicationFieldValue(
  application: Application,
  fieldKey: string
): string {
  switch (fieldKey) {
    case "full_name":
      return application.full_name ?? "";

    case "email":
      return application.email ?? "";

    case "phone":
      return getPhoneNumber(application);

    case "branch":
      return application.branch ?? "";

    case "year":
      return application.year ?? "";

    case "technical_skills":
      return application.technical_skills?.join(", ") ?? "";

    case "other_skill":
      return application.other_skill ?? "";

    case "interests":
    case "areas_of_interest":
      return application.areas_of_interest ?? "";

    case "why_join":
      return application.why_join ?? "";

    case "resume":
      return application.resume_name ?? "No resume";

    default:
      return formatAnswerForCsv(
        application.custom_answers?.[fieldKey]
      );
  }
}

export default function ApplicationsPage() {
  const supabase = createClient();

  const [applications, setApplications] = useState<Application[]>([]);
  const [formFields, setFormFields] = useState<FormField[]>([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);

  const [resumeLoading, setResumeLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  /* =====================================================
     LOAD APPLICATIONS
     ===================================================== */

  const loadApplications = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("recruitment_applications")
      .select(
        `
          id,
          full_name,
          email,
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
          created_at,
          custom_answers
        `
      )
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error("Applications loading error:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });

      setApplications([]);
    } else {
      setApplications((data as Application[]) ?? []);
    }

    setLoading(false);
  }, [supabase]);

  /* =====================================================
     LOAD FORM FIELDS
     ===================================================== */

  const loadFormFields = useCallback(async () => {
    try {
      const response = await fetch("/api/recruitment/form", {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.message || "Could not load recruitment form fields."
        );
      }

      const fields = Array.isArray(result.fields)
        ? result.fields
        : [];

      setFormFields(fields);
    } catch (error) {
      console.error("Recruitment form fields loading error:", error);

      /*
       * Fallback fields.
       *
       * This means CSV export will still work even if the
       * form configuration request temporarily fails.
       */
      setFormFields([
        {
          id: "fallback-full-name",
          field_key: "full_name",
          label: "Full Name",
          field_type: "text",
          enabled: true,
          display_order: 0,
          system_field: true,
        },
        {
          id: "fallback-email",
          field_key: "email",
          label: "Email",
          field_type: "email",
          enabled: true,
          display_order: 1,
          system_field: true,
        },
        {
          id: "fallback-phone",
          field_key: "phone",
          label: "Phone Number",
          field_type: "tel",
          enabled: true,
          display_order: 2,
          system_field: true,
        },
        {
          id: "fallback-branch",
          field_key: "branch",
          label: "Branch / Department",
          field_type: "text",
          enabled: true,
          display_order: 3,
          system_field: true,
        },
        {
          id: "fallback-year",
          field_key: "year",
          label: "Year",
          field_type: "text",
          enabled: true,
          display_order: 4,
          system_field: true,
        },
        {
          id: "fallback-interests",
          field_key: "interests",
          label: "Areas of Interest",
          field_type: "textarea",
          enabled: true,
          display_order: 5,
          system_field: false,
        },
        {
          id: "fallback-technical-skills",
          field_key: "technical_skills",
          label: "Technical Skills",
          field_type: "multiselect",
          enabled: true,
          display_order: 6,
          system_field: false,
        },
        {
          id: "fallback-why-join",
          field_key: "why_join",
          label: "Why do you want to join?",
          field_type: "textarea",
          enabled: true,
          display_order: 7,
          system_field: false,
        },
        {
          id: "fallback-resume",
          field_key: "resume",
          label: "CV / Resume",
          field_type: "file",
          enabled: true,
          display_order: 8,
          system_field: true,
        },
      ]);
    }
  }, []);

  useEffect(() => {
    loadApplications();
    loadFormFields();
  }, [loadApplications, loadFormFields]);

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
        application.full_name.toLowerCase().includes(query) ||
        application.email.toLowerCase().includes(query) ||
        getPhoneNumber(application).toLowerCase().includes(query) ||
        application.branch.toLowerCase().includes(query) ||
        application.year.toLowerCase().includes(query) ||
        (application.areas_of_interest ?? "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [applications, search]);

  /* =====================================================
     DYNAMIC CSV EXPORT
     ===================================================== */

  const exportApplicationsCsv = () => {
    if (applications.length === 0) {
      alert("There are no applications to export.");
      return;
    }

    /**
     * Only enabled fields from the current form are exported.
     *
     * This makes the CSV automatically follow the form
     * customizer.
     */
    const enabledFields = [...formFields]
      .filter((field) => field.enabled)
      .sort((a, b) => a.display_order - b.display_order);

    /**
     * Make sure we don't accidentally create duplicate
     * columns if a malformed form configuration contains
     * the same field key more than once.
     */
    const uniqueFields: FormField[] = [];

    const seenFieldKeys = new Set<string>();

    for (const field of enabledFields) {
      if (seenFieldKeys.has(field.field_key)) {
        continue;
      }

      seenFieldKeys.add(field.field_key);
      uniqueFields.push(field);
    }

    /**
     * If the form configuration could not be loaded,
     * don't silently create an almost-empty CSV.
     */
    if (uniqueFields.length === 0) {
      alert(
        "Could not determine the current form fields. Please refresh and try again."
      );
      return;
    }

    /**
     * Fixed columns that are useful regardless of form fields.
     *
     * Resume Type and Resume Size are intentionally NOT included.
     */
    const fixedFields = [
      {
        key: "__application_id",
        label: "Application ID",
      },
      {
        key: "__submitted_at",
        label: "Submitted At",
      },
    ];

    const headers = [
      ...fixedFields.map((field) => field.label),
      ...uniqueFields.map((field) => field.label),
    ];

    const escapeCsvValue = (value: unknown) => {
      const stringValue = String(value ?? "");

      return `"${stringValue.replace(/"/g, '""')}"`;
    };

    const rows = applications.map((application) => {
      const fixedValues = [
        application.id,
        formatDate(application.created_at),
      ];

      const dynamicValues = uniqueFields.map((field) =>
        getApplicationFieldValue(
          application,
          field.field_key
        )
      );

      return [
        ...fixedValues,
        ...dynamicValues,
      ];
    });

    const csv = [
      headers.map(escapeCsvValue).join(","),
      ...rows.map((row) =>
        row.map(escapeCsvValue).join(",")
      ),
    ].join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    const date = new Date()
      .toISOString()
      .slice(0, 10);

    link.download = `technical-council-applications-${date}.csv`;

    link.style.display = "none";

    document.body.appendChild(link);

    link.click();

    /*
     * Give Firefox time to start the download before
     * removing the temporary link/object URL.
     */
    window.setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 1000);
  };

  /* =====================================================
     OPEN RESUME
     ===================================================== */

  const openResume = async (application: Application) => {
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

      const responseText = await response.text();

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
      console.error("Open resume error:", error);

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
    if (!selectedApplication || deleting) {
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

      const responseText = await response.text();

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

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.message ||
            `Could not delete application (${response.status}).`
        );
      }

      const deletedId = selectedApplication.id;

      setApplications((current) =>
        current.filter(
          (application) =>
            application.id !== deletedId
        )
      );

      setSelectedApplication(null);
      setShowDeleteConfirm(false);

      if (result.storageWarning) {
        alert(result.storageWarning);
      } else {
        alert("Application deleted successfully.");
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
              View all Technical Council recruitment
              applications.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">

            {/* Customize Form */}

            <Link
              href="/admin/applications/customize"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-blue-400"
            >
              Customize Form
            </Link>

            {/* Export CSV */}

            <button
              type="button"
              onClick={exportApplicationsCsv}
              disabled={
                applications.length === 0
              }
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-emerald-600 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FileSpreadsheet size={16} />
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
                setSearch(e.target.value)
              }
              placeholder="Search by name, email, phone, branch, year..."
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
                          {application.full_name}
                        </h2>

                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">

                          <span>
                            {application.branch}
                          </span>

                          <span>
                            {application.year}
                          </span>

                          {getPhoneNumber(
                            application
                          ) && (
                            <span>
                              {getPhoneNumber(
                                application
                              )}
                            </span>
                          )}

                        </div>

                        <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
                          {application.email}
                        </p>

                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">

                      {application.resume_path && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                          <FileText size={13} />
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
            if (!showDeleteConfirm && !deleting) {
              setSelectedApplication(null);
            }
          }}
        >

          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >

            {/* MODAL HEADER */}

            <div className="flex items-start justify-between gap-4">

              <div>

                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                  Recruitment Application
                </p>

                <h2 className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">
                  {selectedApplication.full_name}
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
                    setShowDeleteConfirm(true)
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
                    setSelectedApplication(null)
                  }
                  disabled={deleting}
                  className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>

              </div>

            </div>

            {/* PERSONAL INFORMATION */}

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
                  icon={<Mail size={15} />}
                />

                <InfoCard
                  label="Phone Number"
                  value={getPhoneNumber(
                    selectedApplication
                  )}
                  icon={<Phone size={15} />}
                />

                <InfoCard
                  label="Branch / Department"
                  value={
                    selectedApplication.branch
                  }
                />

                <InfoCard
                  label="Year"
                  value={selectedApplication.year}
                />

              </div>

            </section>

            {/* TECHNICAL SKILLS */}

            <section className="mt-7">

              <h3 className="text-sm font-bold text-slate-950 dark:text-white">
                Technical Skills
              </h3>

              <div className="mt-3 flex flex-wrap gap-2">

                {selectedApplication
                  .technical_skills?.length ? (
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
                    No technical skills selected.
                  </p>
                )}

              </div>

              {selectedApplication.other_skill && (
                <div className="mt-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">

                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Other Skill
                  </p>

                  <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">
                    {selectedApplication.other_skill}
                  </p>

                </div>
              )}

            </section>

            {/* AREAS OF INTEREST */}

            <section className="mt-7">

              <h3 className="text-sm font-bold text-slate-950 dark:text-white">
                Areas of Interest
              </h3>

              <div className="mt-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">

                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">
                  {selectedApplication.areas_of_interest ||
                    "Not provided"}
                </p>

              </div>

            </section>

            {/* WHY JOIN */}

            <section className="mt-7">

              <h3 className="text-sm font-bold text-slate-950 dark:text-white">
                Why do you want to join?
              </h3>

              <div className="mt-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">

                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">
                  {selectedApplication.why_join ||
                    "Not provided"}
                </p>

              </div>

            </section>

            {/* CUSTOM ANSWERS */}

            {selectedApplication.custom_answers &&
              Object.entries(
                selectedApplication.custom_answers
              ).filter(
                ([key]) => key !== "phone"
              ).length > 0 && (
                <section className="mt-7">

                  <h3 className="text-sm font-bold text-slate-950 dark:text-white">
                    Additional Information
                  </h3>

                  <div className="mt-3 grid gap-3">

                    {Object.entries(
                      selectedApplication.custom_answers
                    )
                      .filter(
                        ([key]) => key !== "phone"
                      )
                      .map(([key, value]) => (
                        <InfoCard
                          key={key}
                          label={key
                            .replace(/_/g, " ")
                            .replace(
                              /\b\w/g,
                              (letter) =>
                                letter.toUpperCase()
                            )}
                          value={
                            Array.isArray(value)
                              ? value.join(", ")
                              : typeof value ===
                                "string"
                              ? value
                              : JSON.stringify(
                                  value
                                )
                          }
                        />
                      ))}

                  </div>

                </section>
              )}

            {/* RESUME */}

            <section className="mt-7">

              <h3 className="text-sm font-bold text-slate-950 dark:text-white">
                CV / Resume
              </h3>

              {selectedApplication.resume_path ? (
                <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800 sm:flex-row sm:items-center sm:justify-between">

                  <div className="flex min-w-0 items-center gap-3">

                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-slate-500 shadow-sm dark:bg-slate-700 dark:text-slate-300">
                      <FileText size={18} />
                    </div>

                    <div className="min-w-0">

                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                        {selectedApplication.resume_name ||
                          "Resume"}
                      </p>

                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {selectedApplication.resume_type ||
                          "Document"}

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
                    <Download size={15} />

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
                  This will permanently delete{" "}
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {selectedApplication.full_name}
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
                      setShowDeleteConfirm(false)
                    }
                    disabled={deleting}
                    className="rounded-full bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={deleteApplication}
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