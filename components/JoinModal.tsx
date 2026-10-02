"use client";

import { useEffect, useState } from "react";

import {
  X,
  Send,
  FileText,
  CheckCircle2,
  Loader2,
} from "lucide-react";

type FormStatus = "open" | "upcoming" | "closed";

type FormOption = {
  label: string;
  value: string;
};

type FormField = {
  id: string;
  field_key: string;
  label: string;
  field_type:
    | "text"
    | "textarea"
    | "email"
    | "tel"
    | "number"
    | "select"
    | "radio"
    | "checkbox"
    | "multiselect"
    | "file";
  required: boolean;
  placeholder: string | null;
  help_text: string | null;
  options: FormOption[];
  validation: Record<string, unknown>;
  display_order: number;
  enabled: boolean;
  system_field: boolean;
};

type RecruitmentForm = {
  id: string;
  form_key: string;
  status: FormStatus;
  title: string;
  description: string;
  notice: string | null;
  success_message: string;
  resume_enabled: boolean;
  resume_required: boolean;
  resume_max_size_mb: number;
  allowed_resume_types: string[];
};

type FormResponse = {
  success?: boolean;
  message?: string;
  form?: RecruitmentForm;
  fields?: FormField[];
};

type FieldValue = string | string[];
type FieldValues = Record<string, FieldValue>;

export default function JoinModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [form, setForm] =
    useState<RecruitmentForm | null>(null);

  const [fields, setFields] =
    useState<FormField[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [submitted, setSubmitted] =
    useState(false);

  const [error, setError] =
    useState("");

  const [values, setValues] =
    useState<FieldValues>({});

  const [resumeName, setResumeName] =
    useState("");

  // ---------------------------------------------------------
  // Create initial field values
  // ---------------------------------------------------------

  const createInitialValues = (
    loadedFields: FormField[]
  ): FieldValues => {
    const initialValues: FieldValues = {};

    loadedFields.forEach((field) => {
      if (
        field.field_type === "multiselect" ||
        field.field_type === "checkbox"
      ) {
        initialValues[field.field_key] = [];
      } else {
        initialValues[field.field_key] = "";
      }
    });

    return initialValues;
  };

  // ---------------------------------------------------------
  // Load application form configuration
  // ---------------------------------------------------------

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function loadForm() {
      setLoading(true);
      setError("");
      setSubmitted(false);
      setForm(null);
      setFields([]);
      setValues({});
      setResumeName("");

      try {
        const response = await fetch(
          "/api/recruitment/form",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const responseText =
          await response.text();

        let result: FormResponse = {};

        if (responseText.trim()) {
          try {
            result = JSON.parse(
              responseText
            );
          } catch {
            console.error(
              "Invalid recruitment form API response:",
              responseText
            );

            throw new Error(
              "The recruitment form server returned an invalid response."
            );
          }
        }

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ||
              `Unable to load application form. Server returned ${response.status}.`
          );
        }

        if (!result.form) {
          throw new Error(
            "Recruitment form configuration was not returned by the server."
          );
        }

        if (cancelled) return;

        const loadedFields =
          Array.isArray(result.fields)
            ? [...result.fields].sort(
                (a, b) =>
                  a.display_order -
                  b.display_order
              )
            : [];

        setForm(result.form);
        setFields(loadedFields);

        setValues(
          createInitialValues(
            loadedFields
          )
        );
      } catch (err) {
        if (!cancelled) {
          console.error(
            "Failed to load recruitment form:",
            err
          );

          setError(
            err instanceof Error
              ? err.message
              : "Unable to load application form."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadForm();

    return () => {
      cancelled = true;
    };
  }, [open]);

  // ---------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------

  const updateValue = (
    fieldKey: string,
    value: FieldValue
  ) => {
    setValues((current) => ({
      ...current,
      [fieldKey]: value,
    }));
  };

  const toggleArrayValue = (
    fieldKey: string,
    option: string
  ) => {
    const fieldValue =
      values[fieldKey];

    const current: string[] =
      Array.isArray(fieldValue)
        ? fieldValue.filter(
            (
              value
            ): value is string =>
              typeof value ===
              "string"
          )
        : [];

    updateValue(
      fieldKey,
      current.includes(option)
        ? current.filter(
            (item) => item !== option
          )
        : [...current, option]
    );
  };

  const getMaxLength = (
    field: FormField
  ) => {
    const value =
      field.validation?.maxLength;

    return typeof value === "number"
      ? value
      : undefined;
  };

  // ---------------------------------------------------------
  // PDF ONLY
  // ---------------------------------------------------------

  const getResumeAccept = () => {
    return ".pdf,application/pdf";
  };

  const handleFileChange = (
    field: FormField,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setError("");

    const file =
      event.target.files?.[0];

    if (!file) {
      setResumeName("");
      updateValue(
        field.field_key,
        ""
      );
      return;
    }

    // -------------------------------------------------------
    // PDF extension validation
    // -------------------------------------------------------

    const fileExtension =
      file.name
        .split(".")
        .pop()
        ?.toLowerCase() || "";

    if (fileExtension !== "pdf") {
      event.target.value = "";
      setResumeName("");

      updateValue(
        field.field_key,
        ""
      );

      setError(
        "Please upload a PDF file only."
      );

      return;
    }

    // -------------------------------------------------------
    // PDF MIME type validation
    // -------------------------------------------------------

    if (
      file.type &&
      file.type !== "application/pdf"
    ) {
      event.target.value = "";
      setResumeName("");

      updateValue(
        field.field_key,
        ""
      );

      setError(
        "Please upload a valid PDF file only."
      );

      return;
    }

    // -------------------------------------------------------
    // Maximum file size
    // -------------------------------------------------------

    const maxSizeMb =
      form?.resume_max_size_mb || 5;

    const maxSize =
      maxSizeMb * 1024 * 1024;

    if (file.size > maxSize) {
      event.target.value = "";
      setResumeName("");

      updateValue(
        field.field_key,
        ""
      );

      setError(
        `File size must be ${maxSizeMb} MB or less.`
      );

      return;
    }

    // -------------------------------------------------------
    // Valid PDF
    // -------------------------------------------------------

    setResumeName(file.name);

    updateValue(
      field.field_key,
      file.name
    );
  };

  // ---------------------------------------------------------
  // Field layout
  // ---------------------------------------------------------

  const isSmallField = (
    field: FormField
  ) => {
    return [
      "text",
      "email",
      "tel",
      "number",
      "select",
    ].includes(field.field_type);
  };

  const getFieldWrapperClass = (
    field: FormField
  ) => {
    if (isSmallField(field)) {
      return "col-span-1";
    }

    return "col-span-1 md:col-span-2";
  };

  // ---------------------------------------------------------
  // Submit application
  // ---------------------------------------------------------

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (submitting) return;

    setSubmitting(true);
    setSubmitted(false);
    setError("");

    try {
      const formElement =
        event.currentTarget;

      const formData =
        new FormData(formElement);

      // -----------------------------------------------------
      // Controlled checkbox / multiselect values
      // -----------------------------------------------------

      fields.forEach((field) => {
        if (
          field.field_type !==
            "multiselect" &&
          field.field_type !==
            "checkbox"
        ) {
          return;
        }

        formData.delete(
          field.field_key
        );

        const fieldValue =
          values[field.field_key];

        const selected: string[] =
          Array.isArray(fieldValue)
            ? fieldValue.filter(
                (
                  value
                ): value is string =>
                  typeof value ===
                  "string"
              )
            : [];

        selected.forEach((value) => {
          formData.append(
            field.field_key,
            value
          );
        });
      });

      const response = await fetch(
        "/api/recruitment/applications",
        {
          method: "POST",
          body: formData,
        }
      );

      const responseText =
        await response.text();

      let result: {
        success?: boolean;
        message?: string;
      } = {};

      if (responseText.trim()) {
        try {
          result =
            JSON.parse(
              responseText
            );
        } catch {
          console.error(
            "Invalid application submission response:",
            responseText
          );

          throw new Error(
            "The server returned an invalid response."
          );
        }
      }

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            `Application submission failed. Server returned ${response.status}.`
        );
      }

      // -----------------------------------------------------
      // Successful submission
      // -----------------------------------------------------

      setSubmitted(true);
      setError("");
      setResumeName("");

      formElement.reset();

      setValues(
        createInitialValues(fields)
      );
    } catch (err) {
      console.error(
        "Join application submission error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------------------------------------------------
  // Status message
  // ---------------------------------------------------------

  const renderStatusMessage =
    () => {
      if (!form) return null;

      if (
        form.status === "upcoming"
      ) {
        return (
          <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-4 text-sm font-medium text-amber-700">
            {form.notice ||
              "Applications will open soon."}
          </div>
        );
      }

      if (
        form.status === "closed"
      ) {
        return (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-600">
            {form.notice ||
              "Applications are currently closed."}
          </div>
        );
      }

      return null;
    };

  // ---------------------------------------------------------
  // Field renderer
  // ---------------------------------------------------------

  const renderField = (
    field: FormField
  ) => {
    if (!field.enabled) {
      return null;
    }

    const value =
      values[field.field_key] ??
      "";

    const commonInputClass =
      "w-full rounded-2xl bg-white px-4 py-3.5 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-blue-100";

    const maxLength =
      getMaxLength(field);

    const label = (
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {field.label}

        {field.required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>
    );

    const helpText =
      field.help_text ? (
        <p className="mt-2 text-xs text-slate-400">
          {field.help_text}
        </p>
      ) : null;

    const wrapperClass =
      getFieldWrapperClass(field);

    switch (field.field_type) {
      // -----------------------------------------------------
      // TEXTAREA
      // -----------------------------------------------------

      case "textarea":
        return (
          <div
            key={field.id}
            className={wrapperClass}
          >
            {label}

            <textarea
              name={field.field_key}
              required={field.required}
              placeholder={
                field.placeholder || ""
              }
              value={
                typeof value ===
                "string"
                  ? value
                  : ""
              }
              maxLength={
                maxLength
              }
              onChange={(event) =>
                updateValue(
                  field.field_key,
                  event.target.value
                )
              }
              rows={4}
              className={`${commonInputClass} resize-none`}
            />

            {helpText}
          </div>
        );

      // -----------------------------------------------------
      // SELECT
      // -----------------------------------------------------

      case "select":
        return (
          <div
            key={field.id}
            className={wrapperClass}
          >
            {label}

            <select
              name={field.field_key}
              required={field.required}
              value={
                typeof value ===
                "string"
                  ? value
                  : ""
              }
              onChange={(event) =>
                updateValue(
                  field.field_key,
                  event.target.value
                )
              }
              className={`${commonInputClass} text-slate-600`}
            >
              <option value="">
                {field.placeholder ||
                  `Select ${field.label.toLowerCase()}`}
              </option>

              {field.options.map(
                (option) => (
                  <option
                    key={
                      option.value
                    }
                    value={
                      option.value
                    }
                  >
                    {option.label}
                  </option>
                )
              )}
            </select>

            {helpText}
          </div>
        );

      // -----------------------------------------------------
      // RADIO
      // -----------------------------------------------------

      case "radio":
        return (
          <div
            key={field.id}
            className={wrapperClass}
          >
            {label}

            <div className="flex flex-wrap gap-2">
              {field.options.map(
                (option) => {
                  const selected =
                    value ===
                    option.value;

                  return (
                    <label
                      key={
                        option.value
                      }
                      className={`cursor-pointer rounded-full px-4 py-2.5 text-xs font-semibold transition ${
                        selected
                          ? "bg-slate-950 text-white"
                          : "bg-white text-slate-600 shadow-sm hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name={
                          field.field_key
                        }
                        value={
                          option.value
                        }
                        required={
                          field.required
                        }
                        checked={
                          selected
                        }
                        onChange={() =>
                          updateValue(
                            field.field_key,
                            option.value
                          )
                        }
                        className="sr-only"
                      />

                      {
                        option.label
                      }
                    </label>
                  );
                }
              )}
            </div>

            {helpText}
          </div>
        );

      // -----------------------------------------------------
      // MULTISELECT / CHECKBOX
      // -----------------------------------------------------

      case "multiselect":
      case "checkbox":
        return (
          <div
            key={field.id}
            className={wrapperClass}
          >
            {label}

            <div className="flex flex-wrap gap-2">
              {field.options.map(
                (option) => {
                  const selected =
                    Array.isArray(
                      value
                    ) &&
                    value.includes(
                      option.value
                    );

                  return (
                    <button
                      key={
                        option.value
                      }
                      type="button"
                      onClick={() =>
                        toggleArrayValue(
                          field.field_key,
                          option.value
                        )
                      }
                      className={`rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                        selected
                          ? "bg-slate-950 text-white shadow-sm"
                          : "bg-white text-slate-600 shadow-sm hover:bg-slate-50"
                      }`}
                    >
                      {
                        option.label
                      }
                    </button>
                  );
                }
              )}
            </div>

            {field.required &&
              (!Array.isArray(
                value
              ) ||
                value.length ===
                  0) && (
                <input
                  tabIndex={-1}
                  required
                  value=""
                  onChange={() => {}}
                  className="pointer-events-none absolute h-0 w-0 opacity-0"
                  aria-hidden="true"
                />
              )}

            {helpText}
          </div>
        );

      // -----------------------------------------------------
      // FILE — PDF ONLY
      // -----------------------------------------------------

      case "file":
        if (!form?.resume_enabled) {
          return null;
        }

        return (
          <div
            key={field.id}
            className={wrapperClass}
          >
            {label}

            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4 transition hover:border-blue-300 hover:bg-blue-50/30">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-50 text-slate-500 shadow-sm">
                  <FileText
                    size={18}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <input
                    type="file"
                    name={
                      field.field_key
                    }
                    required={
                      field.required ||
                      form.resume_required
                    }
                    accept={getResumeAccept()}
                    onChange={(event) =>
                      handleFileChange(
                        field,
                        event
                      )
                    }
                    className="block w-full cursor-pointer text-sm text-slate-500 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-950 file:px-4 file:py-2.5 file:text-xs file:font-semibold file:text-white hover:file:bg-slate-800"
                  />

                  {resumeName ? (
                    <p className="mt-2 truncate text-xs font-medium text-slate-600">
                      Selected:{" "}
                      {
                        resumeName
                      }
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-slate-400">
                      PDF · Maximum{" "}
                      {
                        form.resume_max_size_mb
                      }{" "}
                      MB
                    </p>
                  )}
                </div>
              </div>
            </div>

            {helpText}
          </div>
        );

      // -----------------------------------------------------
      // DEFAULT INPUTS
      // -----------------------------------------------------

      default:
        return (
          <div
            key={field.id}
            className={wrapperClass}
          >
            {label}

            <input
              type={
                field.field_type
              }
              name={
                field.field_key
              }
              required={
                field.required
              }
              placeholder={
                field.placeholder ||
                ""
              }
              value={
                typeof value ===
                "string"
                  ? value
                  : ""
              }
              maxLength={
                maxLength
              }
              onChange={(event) =>
                updateValue(
                  field.field_key,
                  event.target.value
                )
              }
              className={
                commonInputClass
              }
            />

            {helpText}
          </div>
        );
    }
  };

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="join-modal relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_30px_100px_rgba(30,40,80,0.25)] backdrop-blur-2xl sm:p-8"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="join-modal-close absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
        >
          <X size={19} />
        </button>

        <div className="pr-12">
          <span className="join-modal-badge inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600">
            JOIN TECHNICAL COUNCIL
          </span>

          {form?.notice &&
            form.status ===
              "open" && (
              <p className="join-modal-notice mt-3 text-xs font-medium text-amber-600">
                {form.notice}
              </p>
            )}

          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">
            {form?.title ||
              "Join Technical Council"}
          </h2>

          <p className="join-modal-description mt-2 text-sm leading-6 text-slate-500">
            {form?.description ||
              ""}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2
              size={28}
              className="animate-spin text-slate-500"
            />
          </div>
        ) : error && !form ? (
          <div className="mt-7 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        ) : (
          <>
            {renderStatusMessage()}

            {form?.status ===
              "open" && (
              <form
                className="mt-7 grid grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-2"
                onSubmit={
                  handleSubmit
                }
              >
                {fields.map(
                  renderField
                )}

                {error && (
                  <div className="col-span-1 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 md:col-span-2">
                    {error}
                  </div>
                )}

                {submitted && (
                  <div className="join-success col-span-1 flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-700 md:col-span-2">
                    <CheckCircle2
                      size={18}
                    />

                    {
                      form.success_message
                    }
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    submitting
                  }
                  className="join-submit col-span-1 mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2"
                >
                  {submitting
                    ? "Submitting..."
                    : "Submit Application"}

                  <Send
                    size={16}
                  />
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}