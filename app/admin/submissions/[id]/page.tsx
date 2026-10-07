"use client";

import Link from "next/link";
import { use } from "react";
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  Download,
  ExternalLink,
  FileText,
  RefreshCw,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type SubmissionPage = {
  id: string;
  event_id: string | null;
  event_name: string;
  slug: string;
  title: string | null;
  description: string | null;
  status: "draft" | "published" | "closed";
};

type SubmissionField = {
  id?: string;
  submission_page_id?: string;
  field_key: string;
  field_label: string;
  field_type?: string | null;
  required?: boolean | null;
  enabled?: boolean | null;
  sort_order?: number | null;
};

type Submission = {
  id: string;
  submission_page_id: string;
  event_id: string | null;
  team_name: string | null;
  submitter_name: string | null;
  submitter_email: string | null;
  submitter_contact_no: string | null;
  title: string | null;
  status: string;
  form_data: Record<string, unknown>;
  submitted_at: string | null;
  updated_at: string | null;
};

type SubmissionFile = {
  id: string;
  submission_id: string;
  field_key: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
  signed_url?: string | null;
  download_url?: string | null;
};

const supabase = createClient();

const STORAGE_BUCKET = "submission-files";
const SIGNED_URL_EXPIRATION = 60 * 60;

export default function SubmissionMonitoringPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: pageId } = use(params);

  const [page, setPage] = useState<SubmissionPage | null>(null);

  const [submissionFields, setSubmissionFields] = useState<
    SubmissionField[]
  >([]);

  const [submissions, setSubmissions] = useState<Submission[]>([]);

  const [files, setFiles] = useState<SubmissionFile[]>([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);

  const [selectedFiles, setSelectedFiles] = useState<SubmissionFile[]>([]);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  /*
   * ---------------------------------------------------------
   * FILE URL HELPERS
   * ---------------------------------------------------------
   */

  async function createSignedUrls(filePath: string, fileName: string) {
    if (!filePath) {
      return {
        signedUrl: null,
        downloadUrl: null,
      };
    }

    try {
      /*
       * Normal signed URL for viewing the file.
       */
      const { data: viewData, error: viewError } =
        await supabase.storage
          .from(STORAGE_BUCKET)
          .createSignedUrl(filePath, SIGNED_URL_EXPIRATION);

      if (viewError) {
        console.error("Unable to create view URL:", viewError);

        return {
          signedUrl: null,
          downloadUrl: null,
        };
      }

      /*
       * Separate signed URL with download disposition.
       */
      const { data: downloadData, error: downloadError } =
        await supabase.storage
          .from(STORAGE_BUCKET)
          .createSignedUrl(filePath, SIGNED_URL_EXPIRATION, {
            download: fileName,
          });

      if (downloadError) {
        console.error(
          "Unable to create download URL:",
          downloadError
        );
      }

      return {
        signedUrl: viewData?.signedUrl ?? null,
        downloadUrl:
          downloadData?.signedUrl ??
          viewData?.signedUrl ??
          null,
      };
    } catch (err) {
      console.error("Signed URL generation error:", err);

      return {
        signedUrl: null,
        downloadUrl: null,
      };
    }
  }

  async function attachSignedUrls(
    submissionFiles: SubmissionFile[]
  ): Promise<SubmissionFile[]> {
    if (!submissionFiles.length) {
      return [];
    }

    const result = await Promise.all(
      submissionFiles.map(async (file) => {
        const urls = await createSignedUrls(
          file.file_path,
          file.file_name
        );

        return {
          ...file,
          signed_url: urls.signedUrl,
          download_url: urls.downloadUrl,
        };
      })
    );

    return result;
  }

  /*
   * ---------------------------------------------------------
   * LOAD MONITORING DATA
   * ---------------------------------------------------------
   */

  async function loadMonitoring() {
    setLoading(true);
    setError("");

    try {
      /*
       * STEP 0
       * Check authentication.
       */

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      console.log("====================================");
      console.log("SUBMISSION MONITORING AUTH CHECK");
      console.log("Page ID:", pageId);
      console.log("Authenticated user:", user);
      console.log("Auth error:", authError);
      console.log("====================================");

      /*
       * STEP 1
       * Load submission page.
       */

      const {
        data: submissionPage,
        error: pageError,
      } = await supabase
        .from("submission_pages")
        .select(`
          id,
          event_id,
          event_name,
          slug,
          title,
          description,
          status
        `)
        .eq("id", pageId)
        .single();

      console.log("SUBMISSION PAGE:", submissionPage);
      console.log("SUBMISSION PAGE ERROR:", pageError);

      if (pageError) {
        throw new Error(
          `Unable to load submission page: ${pageError.message}`
        );
      }

      if (!submissionPage) {
        throw new Error("Submission page was not found.");
      }

      setPage(submissionPage as SubmissionPage);

      /*
       * STEP 2
       * Load the actual fields configured by the admin.
       *
       * select("*") intentionally avoids depending on optional
       * columns in submission_fields.
       */

      const {
        data: fieldRows,
        error: fieldsError,
      } = await supabase
        .from("submission_fields")
        .select("*")
        .eq("submission_page_id", pageId);

      console.log("SUBMISSION FIELDS:", fieldRows);
      console.log("SUBMISSION FIELDS ERROR:", fieldsError);

      if (fieldsError) {
        throw new Error(
          `Unable to load submission fields: ${fieldsError.message}`
        );
      }

      const typedFields = (fieldRows ?? []) as SubmissionField[];

      /*
       * Sort by sort_order when available.
       * If it is not available, preserve the database order.
       */
      typedFields.sort((a, b) => {
        const aOrder = a.sort_order ?? Number.MAX_SAFE_INTEGER;
        const bOrder = b.sort_order ?? Number.MAX_SAFE_INTEGER;

        return aOrder - bOrder;
      });

      setSubmissionFields(typedFields);

      /*
       * STEP 3
       * Load submissions.
       */

      const {
        data: submissionRows,
        error: submissionsError,
      } = await supabase
        .from("submissions")
        .select(`
          id,
          submission_page_id,
          event_id,
          team_name,
          submitter_name,
          submitter_email,
          submitter_contact_no,
          title,
          status,
          form_data,
          submitted_at,
          updated_at
        `)
        .eq("submission_page_id", pageId)
        .order("submitted_at", {
          ascending: false,
        });

      console.log("====================================");
      console.log("SUBMISSION QUERY");
      console.log("Page ID used:", pageId);
      console.log("Submission rows:", submissionRows);
      console.log("Submission query error:", submissionsError);
      console.log(
        "Number of rows:",
        submissionRows?.length ?? 0
      );
      console.log("====================================");

      if (submissionsError) {
        throw new Error(
          `Unable to load submissions: ${submissionsError.message}`
        );
      }

      const typedSubmissions =
        (submissionRows ?? []) as Submission[];

      setSubmissions(typedSubmissions);

      /*
       * STEP 4
       * Load uploaded file metadata.
       */

      const submissionIds = typedSubmissions.map(
        (submission) => submission.id
      );

      if (!submissionIds.length) {
        setFiles([]);
        return;
      }

      const {
        data: submissionFiles,
        error: filesError,
      } = await supabase
        .from("submission_files")
        .select(`
          id,
          submission_id,
          field_key,
          file_name,
          file_path,
          file_type,
          file_size,
          created_at
        `)
        .in("submission_id", submissionIds)
        .order("created_at", {
          ascending: false,
        });

      console.log("SUBMISSION FILES:", submissionFiles);
      console.log("SUBMISSION FILES ERROR:", filesError);

      if (filesError) {
        console.error(
          "Unable to load submission files:",
          filesError
        );

        setFiles([]);
        return;
      }

      const typedFiles =
        (submissionFiles ?? []) as SubmissionFile[];

      /*
       * STEP 5
       * Generate both View and Download URLs.
       */

      const filesWithUrls =
        await attachSignedUrls(typedFiles);

      setFiles(filesWithUrls);
    } catch (err) {
      console.error(
        "Submission monitoring load error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load submission monitoring."
      );

      setPage(null);
      setSubmissionFields([]);
      setSubmissions([]);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMonitoring();
  }, [pageId]);

  /*
   * ---------------------------------------------------------
   * DYNAMIC FIELD HELPERS
   * ---------------------------------------------------------
   */

  function getFieldLabel(fieldKey: string) {
    const field = submissionFields.find(
      (item) => item.field_key === fieldKey
    );

    return (
      field?.field_label ||
      formatLabel(fieldKey)
    );
  }

  function getFieldValue(
    submission: Submission,
    fieldKey: string
  ): unknown {
    const formData = submission.form_data ?? {};

    /*
     * First priority:
     * actual value stored in form_data.
     */
    if (
      Object.prototype.hasOwnProperty.call(
        formData,
        fieldKey
      )
    ) {
      return formData[fieldKey];
    }

    /*
     * Fallbacks for the legacy columns.
     *
     * This keeps existing submissions working even if
     * their value was normalized into a submissions column.
     */
    const normalizedKey = fieldKey
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

    const aliases: Record<string, unknown> = {
      submission_title: submission.title,
      title: submission.title,

      name: submission.submitter_name,
      full_name: submission.submitter_name,
      submitter_name: submission.submitter_name,

      email: submission.submitter_email,
      submitter_email: submission.submitter_email,

      contact_no: submission.submitter_contact_no,
      contact: submission.submitter_contact_no,
      contact_number: submission.submitter_contact_no,
      phone: submission.submitter_contact_no,
      phone_number: submission.submitter_contact_no,
      submitter_contact_no:
        submission.submitter_contact_no,
    };

    if (
      Object.prototype.hasOwnProperty.call(
        aliases,
        normalizedKey
      )
    ) {
      return aliases[normalizedKey];
    }

    return null;
  }

  /*
   * Only enabled fields are shown.
   */
  const displayFields = useMemo(() => {
    return submissionFields.filter(
      (field) => field.enabled !== false
    );
  }, [submissionFields]);

  /*
   * The main desktop table shows the first four actual
   * submission fields.
   *
   * The View Submission popup still shows ALL fields.
   */
  const tableFields = useMemo(() => {
    return displayFields.slice(0, 4);
  }, [displayFields]);

  /*
   * ---------------------------------------------------------
   * SEARCH
   * ---------------------------------------------------------
   */

  const filteredSubmissions = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return submissions;
    }

    return submissions.filter((submission) => {
      const dynamicValues = displayFields.map(
        (field) =>
          getFieldValue(
            submission,
            field.field_key
          )
      );

      const fixedValues = [
        submission.submitter_name,
        submission.submitter_email,
        submission.submitter_contact_no,
        submission.title,
        submission.team_name,
      ];

      const formDataText = Object.values(
        submission.form_data ?? {}
      )
        .map((value) => String(value ?? ""))
        .join(" ");

      return [
        ...dynamicValues,
        ...fixedValues,
        formDataText,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(query)
        );
    });
  }, [
    submissions,
    search,
    displayFields,
  ]);

  /*
   * Each submission represents one submitted entry.
   */

  const participantCount = submissions.length;

  /*
   * ---------------------------------------------------------
   * FILE HELPERS
   * ---------------------------------------------------------
   */

  function getSubmissionFiles(
    submissionId: string
  ) {
    return files.filter(
      (file) =>
        file.submission_id === submissionId
    );
  }

  function openSubmission(
    submission: Submission
  ) {
    setSelectedSubmission(submission);

    setSelectedFiles(
      getSubmissionFiles(submission.id)
    );
  }

  /*
   * ---------------------------------------------------------
   * FORMATTERS
   * ---------------------------------------------------------
   */

  function formatDate(
    value: string | null
  ) {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  function formatFileSize(
    size: number | null
  ) {
    if (!size || size <= 0) {
      return "—";
    }

    if (size < 1024) {
      return `${size} B`;
    }

    if (size < 1024 * 1024) {
      return `${(
        size / 1024
      ).toFixed(1)} KB`;
    }

    return `${(
      size /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  }

  function formatFieldValue(
    value: unknown
  ): string {
    if (
      value === null ||
      value === undefined
    ) {
      return "—";
    }

    if (typeof value === "string") {
      return value || "—";
    }

    if (typeof value === "number") {
      return String(value);
    }

    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }

    if (Array.isArray(value)) {
      return value
        .map((item) =>
          formatFieldValue(item)
        )
        .join(", ");
    }

    if (typeof value === "object") {
      return JSON.stringify(
        value,
        null,
        2
      );
    }

    return String(value);
  }

  /*
   * ---------------------------------------------------------
   * CSV EXPORT
   * ---------------------------------------------------------
   */

  function downloadCsv() {
    if (!submissions.length) {
      return;
    }

    /*
     * CSV uses the actual field labels from
     * submission_fields.
     */

    const dynamicHeaders =
      displayFields.map(
        (field) => field.field_label
      );

    const header = [
      "Event",
      ...dynamicHeaders,
      "Status",
      "Submitted At",
    ];

    const csvRows = submissions.map(
      (submission) => {
        const dynamicValues =
          displayFields.map(
            (field) =>
              formatFieldValue(
                getFieldValue(
                  submission,
                  field.field_key
                )
              )
          );

        return [
          page?.event_name ?? "",
          ...dynamicValues,
          submission.status,
          submission.submitted_at
            ? formatDate(
                submission.submitted_at
              )
            : "",
        ];
      }
    );

    const escapeCsv = (
      value: unknown
    ) => {
      const text = String(
        value ?? ""
      );

      if (
        text.includes(",") ||
        text.includes('"') ||
        text.includes("\n")
      ) {
        return `"${text.replace(
          /"/g,
          '""'
        )}"`;
      }

      return text;
    };

    const csv = [
      header,
      ...csvRows,
    ]
      .map((row) =>
        row
          .map(escapeCsv)
          .join(",")
      )
      .join("\n");

    const blob = new Blob(
      [csv],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const anchor =
      document.createElement("a");

    anchor.href = url;

    anchor.download = `${
      page?.slug ?? "submission"
    }-monitoring.csv`;

    document.body.appendChild(anchor);

    anchor.click();

    anchor.remove();

    URL.revokeObjectURL(url);
  }

  /*
   * ---------------------------------------------------------
   * DELETE
   * ---------------------------------------------------------
   */

  async function deleteSubmission(
    submission: Submission
  ) {
    const confirmed = window.confirm(
      `Delete this submission${
        submission.submitter_name
          ? ` from ${submission.submitter_name}`
          : ""
      }?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(submission.id);

    try {
      /*
       * STEP 1
       * Get storage paths.
       */

      const submissionFiles =
        getSubmissionFiles(
          submission.id
        );

      const storagePaths =
        submissionFiles
          .map(
            (file) =>
              file.file_path
          )
          .filter(Boolean);

      /*
       * STEP 2
       * Delete actual storage objects.
       */

      if (storagePaths.length) {
        const {
          error: storageError,
        } = await supabase.storage
          .from(STORAGE_BUCKET)
          .remove(storagePaths);

        if (storageError) {
          console.error(
            "Unable to delete Storage files:",
            storageError
          );
        }
      }

      /*
       * STEP 3
       * Delete file metadata.
       */

      const {
        error: filesDeleteError,
      } = await supabase
        .from("submission_files")
        .delete()
        .eq(
          "submission_id",
          submission.id
        );

      if (filesDeleteError) {
        throw new Error(
          `Unable to delete submission files: ${filesDeleteError.message}`
        );
      }

      /*
       * STEP 4
       * Delete submission.
       */

      const {
        error: submissionDeleteError,
      } = await supabase
        .from("submissions")
        .delete()
        .eq("id", submission.id);

      if (submissionDeleteError) {
        throw new Error(
          `Unable to delete submission: ${submissionDeleteError.message}`
        );
      }

      /*
       * STEP 5
       * Update UI.
       */

      if (
        selectedSubmission?.id ===
        submission.id
      ) {
        setSelectedSubmission(null);
        setSelectedFiles([]);
      }

      setSubmissions(
        (current) =>
          current.filter(
            (item) =>
              item.id !== submission.id
          )
      );

      setFiles(
        (current) =>
          current.filter(
            (file) =>
              file.submission_id !==
              submission.id
          )
      );
    } catch (err) {
      console.error(
        "Submission deletion error:",
        err
      );

      window.alert(
        err instanceof Error
          ? err.message
          : "Unable to delete submission."
      );
    } finally {
      setDeletingId(null);
    }
  }

  /*
   * ---------------------------------------------------------
   * LOADING
   * ---------------------------------------------------------
   */

  if (loading) {
    return (
      <div className="min-h-screen px-5 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1500px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <RefreshCw
              size={26}
              className="mx-auto animate-spin text-blue-500"
            />

            <p className="mt-3 text-sm font-medium text-slate-500">
              Loading submission monitoring...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /*
   * ---------------------------------------------------------
   * ERROR
   * ---------------------------------------------------------
   */

  if (error || !page) {
    return (
      <div className="min-h-screen px-5 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1500px]">
          <Link
            href="/admin/submissions-monitoring"
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
          >
            <ArrowLeft size={17} />
            Back to Submission Monitoring
          </Link>

          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
            <div className="flex items-start gap-3">
              <AlertCircle
                size={20}
                className="mt-0.5 shrink-0 text-rose-600"
              />

              <div>
                <p className="text-sm font-bold text-rose-800">
                  Unable to load submission page
                </p>

                <p className="mt-1 text-sm text-rose-700">
                  {error ||
                    "Submission page was not found."}
                </p>

                <button
                  type="button"
                  onClick={loadMonitoring}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700"
                >
                  <RefreshCw size={14} />
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /*
   * ---------------------------------------------------------
   * MAIN PAGE
   * ---------------------------------------------------------
   */

  return (
    <div className="min-h-screen px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1500px]">

        {/* HEADER */}

        <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <Link
              href="/admin/submissions-monitoring"
              className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-slate-900"
            >
              <ArrowLeft size={15} />
              Submission Monitoring
            </Link>

            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
              Submission Management
            </p>

            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {page.event_name}
            </h1>

            <p className="mt-2 max-w-3xl text-sm text-slate-500">
              Monitor and review submissions received
              for this event.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href={`/events/${page.slug}/submit`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <ExternalLink size={17} />
              Open Page
            </a>

            <button
              type="button"
              onClick={downloadCsv}
              disabled={!submissions.length}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={17} />
              Export CSV
            </button>

            <button
              type="button"
              onClick={loadMonitoring}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-emerald-600 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
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

        {/* STATS */}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Submissions
              </p>

              <BarChart3
                size={19}
                className="text-blue-500"
              />
            </div>

            <p className="mt-2 text-2xl font-bold text-slate-950">
              {submissions.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Participants
              </p>

              <Users
                size={19}
                className="text-violet-500"
              />
            </div>

            <p className="mt-2 text-2xl font-bold text-slate-950">
              {participantCount}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Page Status
            </p>

            <div className="mt-2">
              <StatusBadge status={page.status} />
            </div>
          </div>
        </div>

        {/* SEARCH */}

        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="relative">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search submissions..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* EMPTY */}

        {filteredSubmissions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
            <FileText
              size={38}
              className="mx-auto text-slate-300"
            />

            <h2 className="mt-3 text-base font-bold text-slate-900">
              No submissions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {search
                ? "No submissions match your search."
                : "No submissions have been received for this page yet."}
            </p>
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}

            <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">

                      {tableFields.map((field) => (
                        <th
                          key={field.field_key}
                          className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-400"
                        >
                          {field.field_label}
                        </th>
                      ))}

                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                        Status
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                        Submitted
                      </th>

                      <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-400">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredSubmissions.map(
                      (submission) => (
                        <tr
                          key={submission.id}
                          className="border-b border-slate-100 last:border-b-0"
                        >
                          {tableFields.map(
                            (field) => (
                              <td
                                key={field.field_key}
                                className="px-5 py-4"
                              >
                                <p className="max-w-[220px] truncate text-sm font-semibold text-slate-800">
                                  {formatFieldValue(
                                    getFieldValue(
                                      submission,
                                      field.field_key
                                    )
                                  )}
                                </p>
                              </td>
                            )
                          )}

                          <td className="px-5 py-4">
                            <SubmissionStatusBadge
                              status={
                                submission.status
                              }
                            />
                          </td>

                          <td className="px-5 py-4">
                            <span className="text-sm text-slate-600">
                              {formatDate(
                                submission.submitted_at
                              )}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                openSubmission(
                                  submission
                                )
                              }
                              className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-emerald-500 to-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:from-emerald-600 hover:to-blue-700"
                            >
                              View
                            </button>
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
              {filteredSubmissions.map(
                (submission) => (
                  <div
                    key={submission.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="text-base font-bold text-slate-950">
                          {tableFields[0]
                            ? formatFieldValue(
                                getFieldValue(
                                  submission,
                                  tableFields[0]
                                    .field_key
                                )
                              )
                            : "Submission"}
                        </h2>
                      </div>

                      <SubmissionStatusBadge
                        status={
                          submission.status
                        }
                      />
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      {tableFields
                        .slice(0, 4)
                        .map((field) => (
                          <div
                            key={
                              field.field_key
                            }
                            className="rounded-xl bg-slate-50 p-3"
                          >
                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                              {
                                field.field_label
                              }
                            </p>

                            <p className="mt-1 break-words text-xs font-semibold text-slate-800">
                              {formatFieldValue(
                                getFieldValue(
                                  submission,
                                  field.field_key
                                )
                              )}
                            </p>
                          </div>
                        ))}

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Submitted
                        </p>

                        <p className="mt-1 text-xs font-semibold text-slate-800">
                          {formatDate(
                            submission.submitted_at
                          )}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        openSubmission(
                          submission
                        )
                      }
                      className="mt-4 flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-blue-600 px-4 py-2.5 text-sm font-bold text-white"
                    >
                      View Submission
                    </button>
                  </div>
                )
              )}
            </div>
          </>
        )}

        {/* DETAILS MODAL */}

        {selectedSubmission && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                setSelectedSubmission(null);
              }
            }}
          >
            <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">

              {/* MODAL HEADER */}

              <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 sm:p-6">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
                    Submission Details
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-slate-950">
                    {tableFields[0]
                      ? formatFieldValue(
                          getFieldValue(
                            selectedSubmission,
                            tableFields[0]
                              .field_key
                          )
                        )
                      : "Submission"}
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">
                    Submitted{" "}
                    {formatDate(
                      selectedSubmission.submitted_at
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedSubmission(null)
                  }
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* MODAL CONTENT */}

              <div className="max-h-[calc(90vh-150px)] overflow-y-auto p-5 sm:p-6">

                {/* DYNAMIC SUBMISSION INFORMATION */}

                <section>
                  <h3 className="text-sm font-bold text-slate-950">
                    Submission Information
                  </h3>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {displayFields.map(
                      (field) => {
                        const value =
                          getFieldValue(
                            selectedSubmission,
                            field.field_key
                          );

                        /*
                         * File fields are displayed
                         * separately below.
                         */

                        const isFileField =
                          field.field_type ===
                            "file" ||
                          selectedFiles.some(
                            (file) =>
                              file.field_key ===
                              field.field_key
                          );

                        if (isFileField) {
                          return null;
                        }

                        return (
                          <InfoBox
                            key={
                              field.field_key
                            }
                            label={
                              field.field_label
                            }
                            value={formatFieldValue(
                              value
                            )}
                          />
                        );
                      }
                    )}

                    <InfoBox
                      label="Status"
                      value={
                        selectedSubmission.status
                      }
                      capitalize
                    />

                    <InfoBox
                      label="Submitted At"
                      value={formatDate(
                        selectedSubmission.submitted_at
                      )}
                    />
                  </div>
                </section>

                {/* FORM DATA FALLBACK */}

                {displayFields.length === 0 &&
                  Object.keys(
                    selectedSubmission.form_data ??
                      {}
                  ).length > 0 && (
                    <section className="mt-7">
                      <h3 className="text-sm font-bold text-slate-950">
                        Submitted Data
                      </h3>

                      <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200">
                        <div className="divide-y divide-slate-100">
                          {Object.entries(
                            selectedSubmission.form_data ??
                              {}
                          ).map(
                            ([key, value]) => (
                              <div
                                key={key}
                                className="grid gap-2 p-4 sm:grid-cols-[220px_1fr]"
                              >
                                <p className="text-xs font-bold text-slate-400">
                                  {getFieldLabel(
                                    key
                                  )}
                                </p>

                                <p className="whitespace-pre-wrap break-words text-sm text-slate-700">
                                  {formatFieldValue(
                                    value
                                  )}
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </section>
                  )}

                {/* FILES */}

                <section className="mt-7">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-bold text-slate-950">
                      Submitted Files
                    </h3>

                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      {selectedFiles.length}
                    </span>
                  </div>

                  {selectedFiles.length === 0 ? (
                    <div className="mt-3 rounded-2xl border border-dashed border-slate-300 p-6 text-center">
                      <FileText
                        size={28}
                        className="mx-auto text-slate-300"
                      />

                      <p className="mt-2 text-sm text-slate-500">
                        No files attached to
                        this submission.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3 space-y-3">
                      {selectedFiles.map(
                        (file) => (
                          <div
                            key={file.id}
                            className="rounded-2xl border border-slate-200 p-4"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                  <FileText
                                    size={19}
                                  />
                                </div>

                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-slate-800">
                                    {
                                      file.file_name
                                    }
                                  </p>

                                  <p className="mt-1 text-xs text-slate-400">
                                    {getFieldLabel(
                                      file.field_key
                                    )}{" "}
                                    ·{" "}
                                    {formatFileSize(
                                      file.file_size
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* SEPARATE VIEW + DOWNLOAD BUTTONS */}

                            <div className="mt-4 flex flex-wrap gap-2">
                              {file.signed_url ? (
                                <a
                                  href={
                                    file.signed_url
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                  <ExternalLink
                                    size={13}
                                  />
                                  View
                                </a>
                              ) : (
                                <span className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-400">
                                  <ExternalLink
                                    size={13}
                                  />
                                  View unavailable
                                </span>
                              )}

                              {file.download_url ? (
                                <a
                                  href={
                                    file.download_url
                                  }
                                  download={
                                    file.file_name
                                  }
                                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                                >
                                  <Download
                                    size={13}
                                  />
                                  Download
                                </a>
                              ) : (
                                <span className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-400">
                                  <Download
                                    size={13}
                                  />
                                  Download unavailable
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </section>

                {/* ACTIONS */}

                <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-between">
                  <button
                    type="button"
                    onClick={() =>
                      deleteSubmission(
                        selectedSubmission
                      )
                    }
                    disabled={
                      deletingId ===
                      selectedSubmission.id
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 size={16} />

                    {deletingId ===
                    selectedSubmission.id
                      ? "Deleting..."
                      : "Delete Submission"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedSubmission(null)
                    }
                    className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/*
 * ---------------------------------------------------------
 * STATUS BADGES
 * ---------------------------------------------------------
 */

function StatusBadge({
  status,
}: {
  status: SubmissionPage["status"];
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

function SubmissionStatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized =
    status.toLowerCase();

  const styles =
    normalized === "submitted" ||
    normalized === "published" ||
    normalized === "accepted" ||
    normalized === "approved"
      ? "bg-emerald-50 text-emerald-700"
      : normalized === "rejected"
        ? "bg-rose-50 text-rose-700"
        : "bg-amber-50 text-amber-700";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${styles}`}
    >
      {status || "submitted"}
    </span>
  );
}

/*
 * ---------------------------------------------------------
 * INFO BOX
 * ---------------------------------------------------------
 */

function InfoBox({
  label,
  value,
  capitalize = false,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p
        className={`mt-1 break-words text-sm font-semibold text-slate-800 ${
          capitalize
            ? "capitalize"
            : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

/*
 * ---------------------------------------------------------
 * LABEL FORMATTER
 * ---------------------------------------------------------
 */

function formatLabel(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(
      /([a-z])([A-Z])/g,
      "$1 $2"
    )
    .replace(/\s+/g, " ")
    .trim()
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    );
}