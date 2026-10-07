"use client";

import { FormEvent, useMemo, useState } from "react";

import Link from "next/link";

import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  File,
  FileUp,
  Loader2,
  MapPin,
  Send,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type SubmissionPage = {
  id: string;
  event_id: string | null;
  event_name: string;
  slug: string;
  title: string;
  description: string | null;
  instructions: string | null;
  status: "draft" | "published" | "closed";
  confirmation_message: string | null;
  submission_deadline: string | null;
};

type SubmissionField = {
  id: string;
  submission_page_id: string;
  field_key: string;
  field_label: string;
  field_type:
    | "text"
    | "textarea"
    | "number"
    | "email"
    | "phone"
    | "dropdown"
    | "file";
  required: boolean;
  options: string[];
  placeholder: string | null;
  help_text: string | null;
  display_order: number;
  enabled: boolean;
};

type EventData = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  type: string;
  description: string;
  published: boolean;
};

type SubmissionFormProps = {
  page: SubmissionPage;
  fields: SubmissionField[];
  event: EventData | null;
};

const STORAGE_BUCKET = "submission-files";
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// const ALLOWED_FILE_TYPES = [
//   "application/pdf",
//   "image/jpeg",
//   "image/png",
//   "image/webp",
//   "application/zip",
//   "application/x-zip-compressed",
//   "text/plain",
//   "application/msword",
//   "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//   "application/vnd.ms-powerpoint",
//   "application/vnd.openxmlformats-officedocument.presentationml.presentation",
//   "application/vnd.ms-excel",
//   "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
// ];

const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.ms-powerpoint",
];

// const ALLOWED_EXTENSIONS = [
//   ".pdf",
//   ".jpg",
//   ".jpeg",
//   ".png",
//   ".webp",
//   ".zip",
//   ".txt",
//   ".doc",
//   ".docx",
//   ".ppt",
//   ".pptx",
//   ".xls",
//   ".xlsx",
// ];

const ALLOWED_EXTENSIONS = [
  ".pdf",
  ".ppt",
  ".pptx",
];

function isAllowedFile(file: File) {
  const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;

  return (
    ALLOWED_FILE_TYPES.includes(file.type) ||
    ALLOWED_EXTENSIONS.includes(extension)
  );
}

function sanitizeFileName(name: string) {
  return name
    .replace(/[^a-zA-Z0-9.\-_]/g, "_")
    .replace(/_+/g, "_");
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDeadline(value: string | null) {
  if (!value) {
    return null;
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

function isDeadlinePassed(value: string | null) {
  if (!value) {
    return false;
  }

  const deadline = new Date(value).getTime();

  if (Number.isNaN(deadline)) {
    return false;
  }

  return Date.now() > deadline;
}

function formatEventType(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function SubmissionForm({
  page,
  fields,
  event,
}: SubmissionFormProps) {
  const supabase = createClient();

  const [values, setValues] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const deadlinePassed = isDeadlinePassed(page.submission_deadline);

  const isClosed = page.status === "closed" || deadlinePassed;

  const orderedFields = useMemo(() => {
    return [...fields]
      .filter((field) => field.enabled)
      .sort((a, b) => {
        if (
          a.field_type === "file" &&
          b.field_type !== "file"
        ) {
          return 1;
        }

        if (
          a.field_type !== "file" &&
          b.field_type === "file"
        ) {
          return -1;
        }

        return a.display_order - b.display_order;
      });
  }, [fields]);

  const eventType = formatEventType(event?.type);

  const eventDescription =
    event?.description || page.description;

  const handleValueChange = (
    fieldKey: string,
    value: string
  ) => {
    setValues((previous) => ({
      ...previous,
      [fieldKey]: value,
    }));
  };

  const handleFileChange = (
    field: SubmissionField,
    file: File | null
  ) => {
    setError("");

    if (!file) {
      setFiles((previous) => ({
        ...previous,
        [field.field_key]: null,
      }));
      return;
    }

    if (!isAllowedFile(file)) {
      setError(
        `The file "${file.name}" is not supported. Please upload a PDF, PPT/PPTX.`
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(
        `The file "${file.name}" is too large. Maximum allowed size is 10 MB.`
      );
      return;
    }

    setFiles((previous) => ({
      ...previous,
      [field.field_key]: file,
    }));
  };

  const validateForm = () => {
    if (!confirmed) {
      return "Please confirm that the information provided is correct and complete.";
    }

    for (const field of orderedFields) {
      if (field.field_type === "file") {
        if (
          field.required &&
          !files[field.field_key]
        ) {
          return `Please upload ${field.field_label}.`;
        }

        continue;
      }

      const value =
        values[field.field_key]?.trim() ?? "";

      if (field.required && !value) {
        return `Please enter ${field.field_label}.`;
      }

      if (
        field.field_type === "email" &&
        value &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      ) {
        return "Please enter a valid email address.";
      }

      if (
        field.field_type === "phone" &&
        value
      ) {
        const digits = value.replace(/\D/g, "");

        if (digits.length < 10) {
          return "Please enter a valid contact number.";
        }
      }
    }

    return "";
  };

  async function uploadSubmissionFile(
    submissionId: string,
    field: SubmissionField,
    file: File
  ) {
    const safeName = sanitizeFileName(file.name);

    const uniqueName = `${crypto.randomUUID()}-${safeName}`;

    const storagePath = [
      page.id,
      submissionId,
      field.field_key,
      uniqueName,
    ].join("/");

    const { error: uploadError } =
      await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

    if (uploadError) {
      throw new Error(
        `Unable to upload ${field.field_label}: ${uploadError.message}`
      );
    }

    const { error: metadataError } =
      await supabase
        .from("submission_files")
        .insert({
          submission_id: submissionId,
          field_key: field.field_key,
          file_name: file.name,
          file_path: storagePath,
          file_type: file.type || null,
          file_size: file.size,
        });

    if (metadataError) {
      await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([storagePath]);

      throw new Error(
        `Unable to save uploaded file information: ${metadataError.message}`
      );
    }

    return storagePath;
  }

  async function cleanupUploadedFiles(
    paths: string[]
  ) {
    if (!paths.length) {
      return;
    }

    await supabase.storage
      .from(STORAGE_BUCKET)
      .remove(paths);
  }

  async function handleSubmit(
    eventObject: FormEvent<HTMLFormElement>
  ) {
    eventObject.preventDefault();

    setError("");

    if (isClosed) {
      setError(
        "This submission page is currently closed."
      );
      return;
    }

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    const uploadedPaths: string[] = [];

    try {
      const nameField = orderedFields.find(
        (field) =>
          /^(name|full.?name|first.?name)$/i.test(
            field.field_key
          ) ||
          /^(name|full.?name|first.?name)$/i.test(
            field.field_label
          )
      );

      const emailField = orderedFields.find(
        (field) =>
          field.field_type === "email" ||
          /email/i.test(field.field_key) ||
          /email/i.test(field.field_label)
      );

      const phoneField = orderedFields.find(
        (field) =>
          field.field_type === "phone" ||
          /phone|contact/i.test(field.field_key) ||
          /phone|contact/i.test(field.field_label)
      );

      const titleField = orderedFields.find(
        (field) =>
          /submission.?title/i.test(
            field.field_key
          ) ||
          /submission.?title/i.test(
            field.field_label
          )
      );

      const submitterName = nameField
        ? values[nameField.field_key]?.trim() ||
          null
        : null;

      const submitterEmail = emailField
        ? values[emailField.field_key]?.trim() ||
          null
        : null;

      const submitterContact = phoneField
        ? values[phoneField.field_key]?.trim() ||
          null
        : null;

      const submissionTitle = titleField
        ? values[titleField.field_key]?.trim() ||
          null
        : null;

      const textFormData: Record<
        string,
        string
      > = {};

      for (const field of orderedFields) {
        if (field.field_type !== "file") {
          textFormData[field.field_key] =
            values[field.field_key] ?? "";
        }
      }

      const submissionId = crypto.randomUUID();

      const { error: insertError } =
        await supabase
          .from("submissions")
          .insert({
            id: submissionId,
            submission_page_id: page.id,
            event_id: page.event_id,
            submitter_name:
              submitterName || null,
            submitter_email:
              submitterEmail || null,
            submitter_contact_no:
              submitterContact || null,
            title: submissionTitle || null,
            status: "submitted",
            form_data: textFormData,
            submitted_at:
              new Date().toISOString(),
            updated_at:
              new Date().toISOString(),
          });

      if (insertError) {
        throw new Error(insertError.message);
      }

      for (const field of orderedFields) {
        if (field.field_type !== "file") {
          continue;
        }

        const selectedFile =
          files[field.field_key];

        if (!selectedFile) {
          continue;
        }

        const path =
          await uploadSubmissionFile(
            submissionId,
            field,
            selectedFile
          );

        uploadedPaths.push(path);
      }

      setSuccess(true);
    } catch (submitError) {
      console.error(
        "Submission error:",
        submitError
      );

      await cleanupUploadedFiles(
        uploadedPaths
      );

      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to submit the form. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-12 text-slate-900 dark:bg-black dark:text-white sm:px-8">
      <div className="relative mx-auto flex min-h-[75vh] max-w-2xl items-center justify-center">
        <div className="w-full rounded-[32px] border border-slate-200/80 bg-white/80 p-8 text-center shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70 sm:p-12">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-50 dark:bg-emerald-500/15">
            <CheckCircle2
              size={44}
              className="text-emerald-500"
            />
          </div>

          <h1 className="mt-6 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
            Submission Received
          </h1>

          <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-500 dark:text-slate-400">
            {page.confirmation_message ||
              "Your submission has been received successfully."}
          </p>

          <Link
            href="/events"
            className="mt-8 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/10 transition hover:scale-[1.01] hover:from-blue-700 hover:to-emerald-600"
          >
            Back to Events
          </Link>
        </div>
      </div>
    </main>
  );
}
   
  return (
    <main className="min-h-screen bg-slate-50 pb-16 text-slate-900 dark:bg-black dark:text-white">
      <div className="mx-auto max-w-[1200px] px-4 pt-6 sm:px-6">
        {/* BACK */}
        <div className="mb-7">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-100 hover:text-slate-900 dark:border-white/10 dark:bg-[#10131a] dark:text-white/70 dark:hover:bg-white/[0.08] dark:hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to Events
          </Link>
        </div>

        {/* HERO */}
        <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-emerald-50 px-8 py-8 text-slate-900 shadow-sm dark:border-white/10 dark:bg-gradient-to-br dark:from-[#172232] dark:via-[#142027] dark:to-[#10231f] dark:text-white sm:px-8 sm:py-9">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl dark:bg-blue-500/10" />

          <div className="pointer-events-none absolute -bottom-24 right-16 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl dark:bg-emerald-400/10" />

          <div className="relative">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              {eventType && (
                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
                  {eventType}
                </span>
              )}

              <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300">
                Submission
              </span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {event?.title || page.event_name}
            </h1>

            {eventDescription && (
              <p className="mt-4 max-w-4xl text-sm leading-6 text-slate-600 dark:text-white/60 sm:text-[15px]">
                {eventDescription}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-2.5">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3.5 py-2 text-xs font-medium text-slate-600 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.07] dark:text-white/75 dark:shadow-none">
                <CalendarDays
                  size={15}
                  className="text-emerald-600 dark:text-emerald-400"
                />
                {formatDate(event?.date)}
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3.5 py-2 text-xs font-medium text-slate-600 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.07] dark:text-white/75 dark:shadow-none">
                <Clock3
                  size={15}
                  className="text-emerald-600 dark:text-emerald-400"
                />
                {event?.time || "Time TBA"}
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3.5 py-2 text-xs font-medium text-slate-600 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.07] dark:text-white/75 dark:shadow-none">
                <MapPin
                  size={15}
                  className="text-emerald-600 dark:text-emerald-400"
                />
                {event?.location || "Location TBA"}
              </div>
            </div>
          </div>
        </section>

        {/* FORM TITLE */}
        <div className="mb-5 mt-8">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Submission Form
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-white/50">
            Fill in the details carefully before submitting.
          </p>
        </div>

        {/* DEADLINE */}
        {page.submission_deadline && (
          <div
            className={`mb-5 flex items-start gap-3 rounded-2xl border p-4 ${
              deadlinePassed
                ? "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200"
                : "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-100"
            }`}
          >
            <Clock3 className="mt-0.5 h-5 w-5 shrink-0" />

            <div>
              <p className="text-sm font-semibold">
                {deadlinePassed
                  ? "Submission deadline has passed"
                  : "Submission deadline"}
              </p>

              <p className="mt-1 text-xs opacity-70">
                {formatDeadline(
                  page.submission_deadline
                )}
              </p>
            </div>
          </div>
        )}

        {/* DESCRIPTION */}
        {page.description &&
          page.description !== event?.description && (
            <section className="mb-5 rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#111111]">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                About this submission
              </h3>

              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-500 dark:text-white/55">
                {page.description}
              </p>
            </section>
          )}

        {/* INSTRUCTIONS */}
        {page.instructions && (
          <section className="mb-5 rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#111111]">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Instructions
            </h3>

            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-500 dark:text-white/55">
              {page.instructions}
            </p>
          </section>
        )}

        {/* ERROR */}
        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-100">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">
                Submission Error
              </p>

              <p className="mt-1 break-words text-xs text-red-600/80 dark:text-red-200/80">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              className="rounded-lg p-1 transition hover:bg-red-100 dark:hover:bg-red-500/10"
              aria-label="Dismiss error"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit}>
          {/* SUBMISSION DETAILS */}
          <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#111111]">
            <div className="mb-6 border-l-2 border-blue-500 pl-3 dark:border-blue-400">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Submission Details
              </h3>

              <p className="mt-1 text-xs text-slate-500 dark:text-white/45">
                Enter your submission information and upload the required file.
              </p>
            </div>

            <div className="grid gap-x-4 gap-y-4 md:grid-cols-2">
              {orderedFields.map((field) => {
                const fieldValue =
                  values[field.field_key] ?? "";

                {/* FILE */}
                if (field.field_type === "file") {
                  const selectedFile =
                    files[field.field_key];

                  return (
                    <div
                      key={field.id}
                      className="md:col-span-2"
                    >
                      <label className="mb-1.5 block text-xs font-semibold text-slate-800 dark:text-white">
                        {field.field_label}

                        {field.required && (
                          <span className="ml-1 text-red-500 dark:text-red-400">
                            *
                          </span>
                        )}
                      </label>

                      <label
                        htmlFor={`file-${field.id}`}
                        className={`group flex min-h-[110px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-5 py-4 text-center transition ${
                          selectedFile
                            ? "border-emerald-400/50 bg-emerald-50 dark:border-emerald-400/40 dark:bg-emerald-400/[0.05]"
                            : "border-blue-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50 dark:border-blue-400/30 dark:bg-white/[0.015] dark:hover:border-blue-400/50 dark:hover:bg-blue-400/[0.03]"
                        }`}
                      >
                        <input
                          id={`file-${field.id}`}
                          type="file"
                          className="hidden"
                          onChange={(inputEvent) =>
                            handleFileChange(
                              field,
                              inputEvent.target.files?.[0] ??
                                null
                            )
                          }
                          disabled={
                            submitting ||
                            isClosed
                          }
                        />

                        {selectedFile ? (
                          <>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400">
                              <File size={17} />
                            </div>

                            <p className="mt-1.5 max-w-full break-all text-xs font-semibold text-slate-800 dark:text-white">
                              {selectedFile.name}
                            </p>

                            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-white/40">
                              {formatFileSize(
                                selectedFile.size
                              )}
                            </p>

                            <p className="mt-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                              Click to replace file
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
                              <FileUp size={17} />
                            </div>

                            <p className="mt-1.5 text-xs font-semibold text-slate-800 dark:text-white">
                              Click to upload
                            </p>

                            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-white/40">
                              Maximum file size: 10 MB
                            </p>

                            <p className="mt-0.5 text-[11px] text-slate-400 dark:text-white/30">
                              PDF,
                              PPT/PPTX
                            </p>
                          </>
                        )}
                      </label>

                      {field.help_text && (
                        <p className="mt-1 text-[11px] text-slate-400 dark:text-white/35">
                          {field.help_text}
                        </p>
                      )}
                    </div>
                  );
                }

                {/* DROPDOWN */}
                if (field.field_type === "dropdown") {
                  return (
                    <div key={field.id}>
                      <label
                        htmlFor={field.field_key}
                        className="mb-1.5 block text-xs font-semibold text-slate-800 dark:text-white"
                      >
                        {field.field_label}

                        {field.required && (
                          <span className="ml-1 text-red-500 dark:text-red-400">
                            *
                          </span>
                        )}
                      </label>

                      <select
                        id={field.field_key}
                        value={fieldValue}
                        onChange={(inputEvent) =>
                          handleValueChange(
                            field.field_key,
                            inputEvent.target.value
                          )
                        }
                        disabled={
                          submitting ||
                          isClosed
                        }
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-[#080808] dark:text-white dark:focus:border-blue-400/60 dark:focus:ring-blue-400/10"
                      >
                        <option
                          value=""
                          className="bg-white text-slate-900 dark:bg-[#080808] dark:text-white"
                        >
                          {field.placeholder ||
                            `Select ${field.field_label}`}
                        </option>

                        {field.options.map(
                          (option) => (
                            <option
                              key={option}
                              value={option}
                              className="bg-white text-slate-900 dark:bg-[#080808] dark:text-white"
                            >
                              {option}
                            </option>
                          )
                        )}
                      </select>

                      {field.help_text && (
                        <p className="mt-1 text-[11px] text-slate-400 dark:text-white/35">
                          {field.help_text}
                        </p>
                      )}
                    </div>
                  );
                }

                {/* TEXTAREA */}
                if (field.field_type === "textarea") {
                  return (
                    <div
                      key={field.id}
                      className="md:col-span-2"
                    >
                      <label
                        htmlFor={field.field_key}
                        className="mb-1.5 block text-xs font-semibold text-slate-800 dark:text-white"
                      >
                        {field.field_label}

                        {field.required && (
                          <span className="ml-1 text-red-500 dark:text-red-400">
                            *
                          </span>
                        )}
                      </label>

                      <textarea
                        id={field.field_key}
                        value={fieldValue}
                        onChange={(inputEvent) =>
                          handleValueChange(
                            field.field_key,
                            inputEvent.target.value
                          )
                        }
                        placeholder={
                          field.placeholder || ""
                        }
                        rows={4}
                        disabled={
                          submitting ||
                          isClosed
                        }
                        className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs leading-5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-[#080808] dark:text-white dark:placeholder:text-white/25 dark:focus:border-blue-400/60 dark:focus:ring-blue-400/10"
                      />

                      {field.help_text && (
                        <p className="mt-1 text-[11px] text-slate-400 dark:text-white/35">
                          {field.help_text}
                        </p>
                      )}
                    </div>
                  );
                }

                {/* NORMAL INPUT */}
                return (
                  <div key={field.id}>
                    <label
                      htmlFor={field.field_key}
                      className="mb-1.5 block text-xs font-semibold text-slate-800 dark:text-white"
                    >
                      {field.field_label}

                      {field.required && (
                        <span className="ml-1 text-red-500 dark:text-red-400">
                          *
                        </span>
                      )}
                    </label>

                    <input
                      id={field.field_key}
                      type={
                        field.field_type === "number"
                          ? "number"
                          : field.field_type ===
                              "email"
                            ? "email"
                            : field.field_type ===
                                "phone"
                              ? "tel"
                              : "text"
                      }
                      value={fieldValue}
                      onChange={(inputEvent) =>
                        handleValueChange(
                          field.field_key,
                          inputEvent.target.value
                        )
                      }
                      placeholder={
                        field.placeholder ||
                        `Enter ${field.field_label.toLowerCase()}`
                      }
                      disabled={
                        submitting ||
                        isClosed
                      }
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-[#080808] dark:text-white dark:placeholder:text-white/25 dark:focus:border-blue-400/60 dark:focus:ring-blue-400/10"
                    />

                    {field.help_text && (
                      <p className="mt-1 text-[11px] text-slate-400 dark:text-white/35">
                        {field.help_text}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* CONFIRMATION */}
          <section className="mt-6 rounded-[24px] border border-blue-200 bg-blue-50 px-6 py-5 dark:border-blue-400/15 dark:bg-[#101722]">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(eventObject) =>
                  setConfirmed(
                    eventObject.target.checked
                  )
                }
                disabled={
                  submitting ||
                  isClosed
                }
                className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded-md border-slate-300 bg-white accent-blue-500 dark:border-white/20 dark:bg-[#0b1020]"
              />

              <span className="text-sm leading-6 text-slate-700 dark:text-white/75">
                I confirm that the information
                provided above is correct and
                complete. I understand that I am
                responsible for the accuracy of the
                information submitted.
              </span>
            </label>
          </section>

          {/* ACTIONS */}
          <div className="mt-6 flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/events"
              className="inline-flex h-11 min-w-[120px] items-center justify-center rounded-full border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 hover:text-slate-900 dark:border-white/10 dark:bg-[#10131a] dark:text-white dark:hover:bg-white/[0.08]"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={
                submitting ||
                isClosed ||
                !confirmed
              }
              className="inline-flex h-11 min-w-[190px] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-emerald-400 px-6 text-sm font-semibold text-white shadow-lg shadow-blue-500/10 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? (
                <>
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                  Submitting...
                </>
              ) : isClosed ? (
                "Submissions Closed"
              ) : (
                <>
                  <Send size={16} />
                  Submit Submission
                </>
              )}
            </button>
          </div>

          {/* CONFIRMATION NOTE */}
          <p className="mt-5 text-center text-xs text-slate-400 dark:text-white/35">
            Please confirm the information above before submitting.
          </p>
        </form>
      </div>
    </main>
  );
}