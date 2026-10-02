"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Loader2,
  Pencil,
  Plus,
  Save,
  Settings2,
  Trash2,
  X,
} from "lucide-react";

import Link from "next/link";

type FormStatus = "open" | "upcoming" | "closed";

type FieldType =
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

type FormOption = {
  label: string;
  value: string;
};

type FormField = {
  id: string;
  field_key: string;
  label: string;
  field_type: FieldType;
  required: boolean;
  placeholder: string;
  help_text: string;
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

type FieldEditorState = {
  id?: string;
  field_key: string;
  label: string;
  field_type: FieldType;
  required: boolean;
  placeholder: string;
  help_text: string;
  options: FormOption[];
  max_length: string;
};

type RecruitmentFormApiResponse = {
  success?: boolean;
  message?: string;
  form?: RecruitmentForm;
  fields?: FormField[];
};

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: "Short Text",
  textarea: "Long Text",
  email: "Email",
  tel: "Phone Number",
  number: "Number",
  select: "Dropdown",
  radio: "Single Choice",
  checkbox: "Checkbox",
  multiselect: "Multiple Choice",
  file: "File Upload",
};

const OPTION_TYPES: FieldType[] = [
  "select",
  "radio",
  "multiselect",
];

const EMPTY_FIELD: FieldEditorState = {
  field_key: "",
  label: "",
  field_type: "text",
  required: false,
  placeholder: "",
  help_text: "",
  options: [],
  max_length: "",
};

export default function CustomizeApplicationPage() {
  const [form, setForm] =
    useState<RecruitmentForm | null>(null);

  const [fields, setFields] =
    useState<FormField[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);

  const [editor, setEditor] =
    useState<FieldEditorState>(EMPTY_FIELD);

  const [deleteField, setDeleteField] =
    useState<FormField | null>(null);

  const [draggedFieldId, setDraggedFieldId] =
    useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const sortedFields = useMemo(
    () =>
      [...fields].sort(
        (a, b) =>
          a.display_order - b.display_order
      ),
    [fields]
  );

  /*
   * --------------------------------------------------------------------------
   * LOAD FORM
   * --------------------------------------------------------------------------
   *
   * The admin customizer loads through the same API route used by the
   * public Join Modal.
   *
   * This keeps database access on the server and ensures both interfaces
   * always use the same recruitment form configuration.
   *
   */

  const loadForm = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/recruitment/form",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const text = await response.text();

      let result:
        | RecruitmentFormApiResponse
        | null = null;

      try {
        result = text
          ? JSON.parse(text)
          : null;
      } catch {
        throw new Error(
          `Server returned an invalid response (${response.status}).`
        );
      }

      if (
        !response.ok ||
        !result?.success ||
        !result.form
      ) {
        throw new Error(
          result?.message ||
            `Could not load form (${response.status}).`
        );
      }

      setForm(result.form);

      setFields(
        (result.fields ?? []).map(
          (field) => ({
            ...field,

            options: Array.isArray(
              field.options
            )
              ? field.options
              : [],

            validation:
              field.validation &&
              typeof field.validation ===
                "object"
                ? field.validation
                : {},
          })
        )
      );
    } catch (err) {
      console.error(
        "Recruitment form loading error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Could not load the application form."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadForm();
  }, [loadForm]);

  /*
   * --------------------------------------------------------------------------
   * FORM SETTINGS
   * --------------------------------------------------------------------------
   */

  const updateForm = <
    K extends keyof RecruitmentForm
  >(
    key: K,
    value: RecruitmentForm[K]
  ) => {
    setForm((current) =>
      current
        ? {
            ...current,
            [key]: value,
          }
        : current
    );
  };

  /*
   * --------------------------------------------------------------------------
   * FIELD EDITOR
   * --------------------------------------------------------------------------
   */

  const openAddField = () => {
    setEditor({
      ...EMPTY_FIELD,
      options: [],
    });

    setEditorOpen(true);
    setError("");
  };

  const openEditField = (
    field: FormField
  ) => {
    const maxLength =
      typeof field.validation?.maxLength ===
      "number"
        ? String(field.validation.maxLength)
        : "";

    setEditor({
      id: field.id,
      field_key: field.field_key,
      label: field.label,
      field_type: field.field_type,
      required: field.required,
      placeholder:
        field.placeholder ?? "",
      help_text:
        field.help_text ?? "",
      options: Array.isArray(
        field.options
      )
        ? field.options
        : [],
      max_length: maxLength,
    });

    setEditorOpen(true);
    setError("");
  };

  const saveFieldLocally = () => {
    if (!editor.label.trim()) {
      setError("Field label is required.");
      return;
    }

    if (!editor.field_key.trim()) {
      setError("Field key is required.");
      return;
    }

    const normalizedKey =
      editor.field_key
        .trim()
        .toLowerCase()
        .replace(
          /[^a-z0-9_]+/g,
          "_"
        )
        .replace(
          /^_+|_+$/g,
          ""
        );

    if (!normalizedKey) {
      setError(
        "Enter a valid field key using letters, numbers, and underscores."
      );
      return;
    }

    if (
      OPTION_TYPES.includes(
        editor.field_type
      ) &&
      editor.options.length === 0
    ) {
      setError(
        "Add at least one option for this field."
      );
      return;
    }

    const duplicate = fields.find(
      (field) =>
        field.field_key ===
          normalizedKey &&
        field.id !== editor.id
    );

    if (duplicate) {
      setError(
        "A field with this field key already exists."
      );
      return;
    }

    const validation: Record<
      string,
      unknown
    > = {};

    if (editor.max_length.trim()) {
      const maxLength = Number(
        editor.max_length
      );

      if (
        !Number.isInteger(maxLength) ||
        maxLength <= 0
      ) {
        setError(
          "Maximum length must be a positive whole number."
        );
        return;
      }

      validation.maxLength = maxLength;
    }

    if (editor.id) {
      setFields((current) =>
        current.map((field) =>
          field.id === editor.id
            ? {
                ...field,
                field_key:
                  normalizedKey,
                label:
                  editor.label.trim(),
                field_type:
                  editor.field_type,
                required:
                  editor.required,
                placeholder:
                  editor.placeholder.trim(),
                help_text:
                  editor.help_text.trim(),
                options:
                  editor.options,
                validation,
              }
            : field
        )
      );
    } else {
      const newField: FormField = {
        id: `new-${crypto.randomUUID()}`,
        field_key: normalizedKey,
        label: editor.label.trim(),
        field_type:
          editor.field_type,
        required:
          editor.required,
        placeholder:
          editor.placeholder.trim(),
        help_text:
          editor.help_text.trim(),
        options:
          editor.options,
        validation,
        display_order:
          fields.length,
        enabled: true,
        system_field: false,
      };

      setFields((current) => [
        ...current,
        newField,
      ]);
    }

    setEditorOpen(false);
    setEditor(EMPTY_FIELD);
    setError("");
  };

  /*
   * --------------------------------------------------------------------------
   * DELETE FIELD
   * --------------------------------------------------------------------------
   */

  const removeField = (
    field: FormField
  ) => {
    if (field.system_field) {
      setError(
        "System fields cannot be deleted. You can edit their settings instead."
      );
      return;
    }

    setDeleteField(field);
  };

  const confirmDeleteField = () => {
    if (!deleteField) return;

    setFields((current) =>
      current
        .filter(
          (field) =>
            field.id !==
            deleteField.id
        )
        .map(
          (field, index) => ({
            ...field,
            display_order:
              index,
          })
        )
    );

    setDeleteField(null);
  };

  /*
   * --------------------------------------------------------------------------
   * REORDER FIELDS
   * --------------------------------------------------------------------------
   */

  const moveField = (
    fieldId: string,
    direction: "up" | "down"
  ) => {
    setFields((current) => {
      const sorted = [...current].sort(
        (a, b) =>
          a.display_order -
          b.display_order
      );

      const index =
        sorted.findIndex(
          (field) =>
            field.id === fieldId
        );

      if (index === -1) {
        return current;
      }

      const targetIndex =
        direction === "up"
          ? index - 1
          : index + 1;

      if (
        targetIndex < 0 ||
        targetIndex >= sorted.length
      ) {
        return current;
      }

      [
        sorted[index],
        sorted[targetIndex],
      ] = [
        sorted[targetIndex],
        sorted[index],
      ];

      return sorted.map(
        (field, newIndex) => ({
          ...field,
          display_order:
            newIndex,
        })
      );
    });
  };

  const handleDrop = (
    targetId: string
  ) => {
    if (!draggedFieldId) {
      return;
    }

    setFields((current) => {
      const sorted = [...current].sort(
        (a, b) =>
          a.display_order -
          b.display_order
      );

      const fromIndex =
        sorted.findIndex(
          (field) =>
            field.id ===
            draggedFieldId
        );

      const toIndex =
        sorted.findIndex(
          (field) =>
            field.id === targetId
        );

      if (
        fromIndex === -1 ||
        toIndex === -1 ||
        fromIndex === toIndex
      ) {
        return current;
      }

      const [moved] =
        sorted.splice(
          fromIndex,
          1
        );

      sorted.splice(
        toIndex,
        0,
        moved
      );

      return sorted.map(
        (field, index) => ({
          ...field,
          display_order:
            index,
        })
      );
    });

    setDraggedFieldId(null);
  };

  /*
   * --------------------------------------------------------------------------
   * SAVE FORM
   * --------------------------------------------------------------------------
   */

  const saveChanges = async () => {
    if (!form) {
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        "/api/recruitment/form",
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            form,
            fields: fields.map(
              (field, index) => ({
                ...field,
                display_order:
                  index,
              })
            ),
          }),
        }
      );

      const text =
        await response.text();

      let result:
        | {
            success?: boolean;
            message?: string;
          }
        | null = null;

      try {
        result = text
          ? JSON.parse(text)
          : null;
      } catch {
        throw new Error(
          `Server returned an invalid response (${response.status}).`
        );
      }

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.message ||
            `Could not save form (${response.status}).`
        );
      }

      setMessage(
        "Application form saved successfully."
      );

      await loadForm();
    } catch (err) {
      console.error(
        "Application form save error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Could not save the application form."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * --------------------------------------------------------------------------
   * OPTIONS
   * --------------------------------------------------------------------------
   */

  const addOption = () => {
    setEditor((current) => ({
      ...current,
      options: [
        ...current.options,
        {
          label: "",
          value: "",
        },
      ],
    }));
  };

  const updateOption = (
    index: number,
    key: keyof FormOption,
    value: string
  ) => {
    setEditor((current) => ({
      ...current,
      options:
        current.options.map(
          (option, optionIndex) =>
            optionIndex === index
              ? {
                  ...option,
                  [key]: value,
                }
              : option
        ),
    }));
  };

  const removeOption = (
    index: number
  ) => {
    setEditor((current) => ({
      ...current,
      options:
        current.options.filter(
          (_, optionIndex) =>
            optionIndex !== index
        ),
    }));
  };

  return (
    <main className="min-h-screen bg-[#f6f7fb] p-4 text-slate-950 dark:bg-slate-950 dark:text-white sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        {/* HEADER */}

        <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link
              href="/admin/applications"
              className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600 dark:text-slate-400"
            >
              <ArrowLeft size={16} />
              Back to Applications
            </Link>

            <p className="text-sm font-semibold text-blue-600">
              Recruitment
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Customize Application Form
            </h1>

            <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
              Control the Technical
              Council recruitment
              form, its fields,
              validation and
              availability.
            </p>
          </div>

          <button
            type="button"
            onClick={saveChanges}
            disabled={
              saving ||
              loading ||
              !form
            }
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:from-emerald-600 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <Loader2
                size={16}
                className="animate-spin"
              />
            ) : (
              <Save size={16} />
            )}

            {saving
              ? "Saving..."
              : "Save Changes"}
          </button>
        </div>

        {/* SUCCESS MESSAGE */}

        {message && (
          <div className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400">
            <Check size={17} />
            {message}
          </div>
        )}

        {/* ERROR MESSAGE */}

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </div>
        )}

        {/* LOADING */}

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <Loader2
              size={28}
              className="mx-auto animate-spin text-blue-600"
            />

            <p className="mt-3 text-sm font-medium text-slate-500">
              Loading form
              configuration...
            </p>
          </div>
        ) : !form ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-10 text-center dark:border-red-500/20 dark:bg-red-500/10">
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">
              Form configuration
              could not be loaded.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* GENERAL SETTINGS */}

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                  <Settings2 size={19} />
                </div>

                <div>
                  <h2 className="text-lg font-bold">
                    Form Settings
                  </h2>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Manage what
                    applicants see
                    before
                    submitting the
                    form.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-5">
                {/* STATUS */}

                <div>
                  <label className="text-sm font-semibold">
                    Recruitment
                    Status
                  </label>

                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    {(
                      [
                        "open",
                        "upcoming",
                        "closed",
                      ] as FormStatus[]
                    ).map(
                      (status) => (
                        <button
                          key={
                            status
                          }
                          type="button"
                          onClick={() =>
                            updateForm(
                              "status",
                              status
                            )
                          }
                          className={`rounded-2xl border p-4 text-left transition ${
                            form.status ===
                            status
                              ? "border-blue-400 bg-blue-50 text-blue-700 ring-2 ring-blue-100 dark:border-blue-500 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20"
                              : "border-slate-200 bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                          }`}
                        >
                          <p className="font-bold capitalize">
                            {status}
                          </p>

                          <p className="mt-1 text-xs opacity-70">
                            {status ===
                            "open"
                              ? "Applicants can submit."
                              : status ===
                                "upcoming"
                              ? "Show recruitment as coming soon."
                              : "Do not accept applications."}
                          </p>
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* TITLE */}

                <div>
                  <label
                    htmlFor="form-title"
                    className="text-sm font-semibold"
                  >
                    Form Title
                  </label>

                  <input
                    id="form-title"
                    value={form.title}
                    onChange={(e) =>
                      updateForm(
                        "title",
                        e.target.value
                      )
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:focus:border-blue-500"
                  />
                </div>

                {/* DESCRIPTION */}

                <div>
                  <label
                    htmlFor="form-description"
                    className="text-sm font-semibold"
                  >
                    Description
                  </label>

                  <textarea
                    id="form-description"
                    rows={3}
                    value={
                      form.description
                    }
                    onChange={(e) =>
                      updateForm(
                        "description",
                        e.target.value
                      )
                    }
                    className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:focus:border-blue-500"
                  />
                </div>

                {/* NOTICE */}

                <div>
                  <label
                    htmlFor="form-notice"
                    className="text-sm font-semibold"
                  >
                    Notice /
                    Announcement
                  </label>

                  <textarea
                    id="form-notice"
                    rows={2}
                    value={
                      form.notice ??
                      ""
                    }
                    onChange={(e) =>
                      updateForm(
                        "notice",
                        e.target.value
                      )
                    }
                    placeholder="Optional announcement shown to applicants"
                    className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:focus:border-blue-500"
                  />
                </div>

                {/* SUCCESS MESSAGE */}

                <div>
                  <label
                    htmlFor="success-message"
                    className="text-sm font-semibold"
                  >
                    Success
                    Message
                  </label>

                  <input
                    id="success-message"
                    value={
                      form.success_message
                    }
                    onChange={(e) =>
                      updateForm(
                        "success_message",
                        e.target.value
                      )
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:focus:border-blue-500"
                  />
                </div>

                {/* RESUME SETTINGS */}

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-bold">
                        Resume Upload
                      </p>

                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Control resume
                        availability
                        and
                        requirements.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        updateForm(
                          "resume_enabled",
                          !form.resume_enabled
                        )
                      }
                      className={`relative h-7 w-12 rounded-full transition ${
                        form.resume_enabled
                          ? "bg-blue-600"
                          : "bg-slate-300 dark:bg-slate-600"
                      }`}
                      aria-label="Toggle resume upload"
                    >
                      <span
                        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                          form.resume_enabled
                            ? "left-6"
                            : "left-1"
                        }`}
                      />
                    </button>
                  </div>

                  {form.resume_enabled && (
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-900">
                        <input
                          type="checkbox"
                          checked={
                            form.resume_required
                          }
                          onChange={(e) =>
                            updateForm(
                              "resume_required",
                              e.target
                                .checked
                            )
                          }
                          className="h-4 w-4 accent-blue-600"
                        />

                        Resume is
                        required
                      </label>

                      <div>
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          Maximum Size
                          (MB)
                        </label>

                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={
                            form.resume_max_size_mb
                          }
                          onChange={(e) =>
                            updateForm(
                              "resume_max_size_mb",
                              Math.max(
                                1,
                                Number(
                                  e.target
                                    .value
                                ) ||
                                  1
                              )
                            )
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* FIELDS */}

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold">
                    Form Fields
                  </h2>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Edit, reorder or
                    add fields to
                    the recruitment
                    application.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openAddField}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:from-emerald-600 hover:to-blue-700"
                >
                  <Plus size={16} />
                  Add Field
                </button>
              </div>

              <div className="mt-6 space-y-3">
                {sortedFields.map(
                  (
                    field,
                    index
                  ) => (
                    <div
                      key={field.id}
                      draggable
                      onDragStart={() =>
                        setDraggedFieldId(
                          field.id
                        )
                      }
                      onDragOver={(e) =>
                        e.preventDefault()
                      }
                      onDrop={() =>
                        handleDrop(
                          field.id
                        )
                      }
                      className={`rounded-2xl border border-slate-200 bg-slate-50 p-4 transition dark:border-slate-700 dark:bg-slate-800 ${
                        draggedFieldId ===
                        field.id
                          ? "opacity-50"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="hidden cursor-grab text-slate-400 sm:block"
                          title="Drag to reorder"
                        >
                          <GripVertical
                            size={19}
                          />
                        </div>

                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-slate-500 shadow-sm dark:bg-slate-900 dark:text-slate-400">
                          <span className="text-xs font-bold">
                            {index + 1}
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold">
                              {
                                field.label
                              }
                            </h3>

                            {field.required && (
                              <span className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600 dark:bg-red-500/10 dark:text-red-400">
                                Required
                              </span>
                            )}

                            {field.system_field && (
                              <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                                System
                              </span>
                            )}

                            {!field.enabled && (
                              <span className="rounded-full bg-slate-200 px-2 py-1 text-[10px] font-bold text-slate-500 dark:bg-slate-700">
                                Disabled
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {
                              FIELD_TYPE_LABELS[
                                field
                                  .field_type
                              ]
                            }{" "}
                            ·{" "}
                            <span className="font-mono">
                              {
                                field.field_key
                              }
                            </span>
                          </p>
                        </div>

                        <div className="hidden items-center gap-1 sm:flex">
                          <button
                            type="button"
                            onClick={() =>
                              moveField(
                                field.id,
                                "up"
                              )
                            }
                            disabled={
                              index ===
                              0
                            }
                            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-white hover:text-slate-700 disabled:opacity-30 dark:hover:bg-slate-900"
                            title="Move up"
                          >
                            <ChevronUp
                              size={16}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              moveField(
                                field.id,
                                "down"
                              )
                            }
                            disabled={
                              index ===
                              sortedFields.length -
                                1
                            }
                            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-white hover:text-slate-700 disabled:opacity-30 dark:hover:bg-slate-900"
                            title="Move down"
                          >
                            <ChevronDown
                              size={16}
                            />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            openEditField(
                              field
                            )
                          }
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-slate-500 shadow-sm transition hover:text-blue-600 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-blue-400"
                          title="Edit field"
                        >
                          <Pencil
                            size={15}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            removeField(
                              field
                            )
                          }
                          disabled={
                            field.system_field
                          }
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-slate-500 shadow-sm transition hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-red-400"
                          title={
                            field.system_field
                              ? "System fields cannot be deleted"
                              : "Delete field"
                          }
                        >
                          <Trash2
                            size={15}
                          />
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            </section>
          </div>
        )}
      </div>

      {/* FIELD EDITOR */}

      {editorOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:p-7"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Form Field
                </p>

                <h2 className="mt-1 text-xl font-bold">
                  {editor.id
                    ? "Edit Field"
                    : "Add Field"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setEditorOpen(
                    false
                  )
                }
                className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 space-y-5">
              {/* FIELD LABEL */}

              <div>
                <label className="text-sm font-semibold">
                  Field Label
                </label>

                <input
                  value={editor.label}
                  onChange={(e) =>
                    setEditor(
                      (current) => ({
                        ...current,
                        label: e.target
                          .value,
                      })
                    )
                  }
                  placeholder="e.g. GitHub Profile"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              {/* KEY + TYPE */}

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold">
                    Field Key
                  </label>

                  <input
                    value={
                      editor.field_key
                    }
                    disabled={Boolean(
                      editor.id
                    )}
                    onChange={(e) =>
                      setEditor(
                        (current) => ({
                          ...current,
                          field_key:
                            e.target
                              .value,
                        })
                      )
                    }
                    placeholder="github_profile"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm outline-none focus:border-blue-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">
                    Field Type
                  </label>

                  <select
                    value={
                      editor.field_type
                    }
                    onChange={(e) =>
                      setEditor(
                        (current) => ({
                          ...current,
                          field_type:
                            e.target
                              .value as FieldType,
                        })
                      )
                    }
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800"
                  >
                    {Object.entries(
                      FIELD_TYPE_LABELS
                    ).map(
                      ([
                        value,
                        label,
                      ]) => (
                        <option
                          key={
                            value
                          }
                          value={
                            value
                          }
                        >
                          {label}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              {/* REQUIRED */}

              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold dark:border-slate-700 dark:bg-slate-800">
                <input
                  type="checkbox"
                  checked={
                    editor.required
                  }
                  onChange={(e) =>
                    setEditor(
                      (current) => ({
                        ...current,
                        required:
                          e.target
                            .checked,
                      })
                    )
                  }
                  className="h-4 w-4 accent-blue-600"
                />

                Required field
              </label>

              {/* PLACEHOLDER */}

              <div>
                <label className="text-sm font-semibold">
                  Placeholder
                </label>

                <input
                  value={
                    editor.placeholder
                  }
                  onChange={(e) =>
                    setEditor(
                      (current) => ({
                        ...current,
                        placeholder:
                          e.target
                            .value,
                      })
                    )
                  }
                  placeholder="Optional placeholder"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              {/* HELP TEXT */}

              <div>
                <label className="text-sm font-semibold">
                  Help Text
                </label>

                <input
                  value={
                    editor.help_text
                  }
                  onChange={(e) =>
                    setEditor(
                      (current) => ({
                        ...current,
                        help_text:
                          e.target
                            .value,
                      })
                    )
                  }
                  placeholder="Optional explanation shown below the field"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              {/* OPTIONS */}

              {OPTION_TYPES.includes(
                editor.field_type
              ) && (
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-semibold">
                        Options
                      </label>

                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Add the choices
                        applicants
                        can select.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={
                        addOption
                      }
                      className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-2 text-xs font-bold text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                    >
                      <Plus
                        size={14}
                      />
                      Add Option
                    </button>
                  </div>

                  <div className="mt-3 space-y-2">
                    {editor.options.map(
                      (
                        option,
                        index
                      ) => (
                        <div
                          key={
                            index
                          }
                          className="flex gap-2"
                        >
                          <input
                            value={
                              option.label
                            }
                            onChange={(
                              e
                            ) =>
                              updateOption(
                                index,
                                "label",
                                e.target
                                  .value
                              )
                            }
                            placeholder="Option label"
                            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800"
                          />

                          <input
                            value={
                              option.value
                            }
                            onChange={(
                              e
                            ) =>
                              updateOption(
                                index,
                                "value",
                                e.target
                                  .value
                              )
                            }
                            placeholder="Value"
                            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono text-xs outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              removeOption(
                                index
                              )
                            }
                            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-50 text-red-500 dark:bg-red-500/10"
                          >
                            <Trash2
                              size={14}
                            />
                          </button>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* MAX LENGTH */}

              {![
                "file",
                "checkbox",
                "select",
                "radio",
                "multiselect",
              ].includes(
                editor.field_type
              ) && (
                <div>
                  <label className="text-sm font-semibold">
                    Maximum Length
                  </label>

                  <input
                    type="number"
                    min={1}
                    value={
                      editor.max_length
                    }
                    onChange={(e) =>
                      setEditor(
                        (current) => ({
                          ...current,
                          max_length:
                            e.target
                              .value,
                        })
                      )
                    }
                    placeholder="Optional"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              )}

              {/* ACTIONS */}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setEditorOpen(
                      false
                    )
                  }
                  className="rounded-full bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={
                    saveFieldLocally
                  }
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-blue-600 px-5 py-2.5 text-sm font-bold text-white"
                >
                  <Check
                    size={15}
                  />

                  {editor.id
                    ? "Update Field"
                    : "Add Field"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE FIELD */}

      {deleteField && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
              <Trash2
                size={21}
              />
            </div>

            <h3 className="mt-5 text-lg font-bold">
              Delete field?
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Remove{" "}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {
                  deleteField.label
                }
              </span>{" "}
              from the
              application
              form?
            </p>

            <p className="mt-2 text-xs font-medium text-red-500">
              Existing
              applications
              will not be
              deleted.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setDeleteField(
                    null
                  )
                }
                className="rounded-full bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  confirmDeleteField
                }
                className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700"
              >
                <Trash2
                  size={15}
                />
                Delete Field
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}