"use client";

import { useEffect, useMemo, useState } from "react";
import type { DragEvent } from "react";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  Edit3,
  ExternalLink,
  FileUp,
  GripVertical,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type EventItem = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  type: string;
  description: string;
  published: boolean;
};

type PageStatus = "draft" | "published" | "closed";

type SubmissionPage = {
  id: string;
  event_id: string | null;
  event_name: string;
  slug: string;
  title: string | null;
  description: string | null;
  status: PageStatus;
  instructions: string | null;
  confirmation_message: string | null;
  submission_deadline: string | null;
  created_at: string;
  updated_at: string;
};

type SubmissionFieldType =
  | "text"
  | "textarea"
  | "number"
  | "email"
  | "phone"
  | "dropdown"
  | "file";

type SubmissionField = {
  id?: string;
  submission_page_id?: string;
  field_key: string;
  field_label: string;
  field_type: SubmissionFieldType;
  required: boolean;
  options: string[];
  placeholder?: string | null;
  help_text?: string | null;
  display_order: number;
  enabled?: boolean;
};

type SubmissionFieldRow = {
  id?: string;
  submission_page_id?: string;
  field_key: string;
  field_label: string;
  field_type: string;
  required: boolean;
  options: unknown;
  placeholder?: string | null;
  help_text?: string | null;
  display_order: number;
  enabled?: boolean;
};

type SubmissionCounts = Record<string, number>;

/* =========================================================
   DEFAULT FIELDS
========================================================= */

const DEFAULT_FIELDS: SubmissionField[] = [
  {
    field_key: "submission_title",
    field_label: "Submission Title",
    field_type: "text",
    required: true,
    options: [],
    placeholder: "Enter your submission title",
    help_text: null,
    display_order: 0,
    enabled: true,
  },
  {
    field_key: "submission_description",
    field_label: "Description",
    field_type: "textarea",
    required: true,
    options: [],
    placeholder: "Describe your submission",
    help_text: null,
    display_order: 1,
    enabled: true,
  },
  {
    field_key: "name",
    field_label: "Name",
    field_type: "text",
    required: true,
    options: [],
    placeholder: "Enter your full name",
    help_text: null,
    display_order: 2,
    enabled: true,
  },
  {
    field_key: "branch",
    field_label: "Branch",
    field_type: "text",
    required: true,
    options: [],
    placeholder: "Enter your branch",
    help_text: null,
    display_order: 3,
    enabled: true,
  },
  {
    field_key: "year",
    field_label: "Year",
    field_type: "text",
    required: true,
    options: [],
    placeholder: "Enter your year",
    help_text: null,
    display_order: 4,
    enabled: true,
  },
  {
    field_key: "email",
    field_label: "Email",
    field_type: "email",
    required: true,
    options: [],
    placeholder: "Enter your email address",
    help_text: null,
    display_order: 5,
    enabled: true,
  },
  {
    field_key: "contact_no",
    field_label: "Contact No",
    field_type: "phone",
    required: true,
    options: [],
    placeholder: "Enter your contact number",
    help_text: null,
    display_order: 6,
    enabled: true,
  },
  {
    field_key: "submission_file",
    field_label: "Upload File",
    field_type: "file",
    required: true,
    options: [],
    placeholder: null,
    help_text: "Upload the required submission file.",
    display_order: 7,
    enabled: true,
  },
];

/* =========================================================
   HELPERS
========================================================= */

function cloneFields(fields: SubmissionField[]) {
  return fields.map(
    (field: SubmissionField, index: number) => ({
      ...field,
      id: undefined,
      submission_page_id: undefined,
      options: [...field.options],
      display_order: index,
      enabled: field.enabled ?? true,
    })
  );
}

function normalizeFieldOrder(fields: SubmissionField[]) {
  const normalFields = fields.filter(
    (field: SubmissionField) =>
      field.field_type !== "file"
  );

  const fileFields = fields.filter(
    (field: SubmissionField) =>
      field.field_type === "file"
  );

  return [
    ...normalFields,
    ...fileFields,
  ].map(
    (
      field: SubmissionField,
      index: number
    ) => ({
      ...field,
      display_order: index,
    })
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseEventDate(dateString: string) {
  const match = dateString
    .trim()
    .match(
      /^(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})$/i
    );

  if (!match) {
    return null;
  }

  const [, day, monthName, year] = match;

  const months: Record<string, number> = {
    january: 0,
    february: 1,
    march: 2,
    april: 3,
    may: 4,
    june: 5,
    july: 6,
    august: 7,
    september: 8,
    october: 9,
    november: 10,
    december: 11,
  };

  const month = months[monthName.toLowerCase()];

  if (month === undefined) {
    return null;
  }

  return new Date(
    Number(year),
    month,
    Number(day),
    23,
    59,
    59,
    999
  );
}

function isEventDateValid(dateString: string) {
  const parsed = parseEventDate(dateString);

  if (!parsed) {
    return true;
  }

  return parsed.getTime() >= Date.now();
}

/* =========================================================
   PAGE
========================================================= */

export default function SubmissionsPage() {
  const supabase = createClient();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [pages, setPages] = useState<SubmissionPage[]>([]);
  const [submissionCounts, setSubmissionCounts] =
    useState<SubmissionCounts>({});

  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] =
    useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [fieldModalOpen, setFieldModalOpen] =
    useState(false);

  const [editingPage, setEditingPage] =
    useState<SubmissionPage | null>(null);

  const [editingField, setEditingField] =
    useState<SubmissionField | null>(null);

  /* =======================================================
     PAGE FORM
  ======================================================= */

  const [selectedEventId, setSelectedEventId] =
    useState("");

  const [pageTitle, setPageTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [instructions, setInstructions] =
    useState("");

  const [confirmationMessage, setConfirmationMessage] =
    useState(
      "Your submission has been received successfully."
    );

  const [submissionDeadline, setSubmissionDeadline] =
    useState("");

  /* =======================================================
     FIELD STATE
  ======================================================= */

  const [fields, setFields] = useState<SubmissionField[]>(
    cloneFields(DEFAULT_FIELDS)
  );

  const [draggingFieldKey, setDraggingFieldKey] = useState<string | null>(
    null
  );

  /* =======================================================
     FIELD MODAL STATE
  ======================================================= */

  const [fieldLabel, setFieldLabel] =
    useState("");

  const [fieldType, setFieldType] =
    useState<SubmissionFieldType>("text");

  const [fieldRequired, setFieldRequired] =
    useState(true);

  const [fieldOptions, setFieldOptions] =
    useState("");

  const [fieldPlaceholder, setFieldPlaceholder] =
    useState("");

  const [fieldHelpText, setFieldHelpText] =
    useState("");

  /* =======================================================
     LOAD EVENTS
  ======================================================= */

  async function loadEvents() {
    setEventsLoading(true);

    const { data, error } = await supabase
      .from("events")
      .select(
        `
          id,
          title,
          date,
          time,
          location,
          type,
          description,
          published
        `
      )
      .eq("published", true)
      .order("created_at", {
        ascending: true,
      });

    if (error) {
      console.error(
        "Events loading error:",
        error
      );

      setError(error.message);
      setEvents([]);
    } else {
      setEvents(
        (data ?? []) as EventItem[]
      );
    }

    setEventsLoading(false);
  }

  /* =======================================================
     LOAD SUBMISSION PAGES
  ======================================================= */

  async function loadPages() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("submission_pages")
      .select(
        `
          id,
          event_id,
          event_name,
          slug,
          title,
          description,
          status,
          instructions,
          confirmation_message,
          submission_deadline,
          created_at,
          updated_at
        `
      )
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Submission pages error:",
        error
      );

      setError(error.message);
      setPages([]);
      setSubmissionCounts({});
      setLoading(false);
      return;
    }

    const loadedPages =
      (data ?? []) as SubmissionPage[];

    setPages(loadedPages);

    if (!loadedPages.length) {
      setSubmissionCounts({});
      setLoading(false);
      return;
    }

    const counts: SubmissionCounts = {};

    await Promise.all(
      loadedPages.map(
        async (page: SubmissionPage) => {
          const { count } = await supabase
            .from("submissions")
            .select("id", {
              count: "exact",
              head: true,
            })
            .eq(
              "submission_page_id",
              page.id
            );

          counts[page.id] = count ?? 0;
        }
      )
    );

    setSubmissionCounts(counts);
    setLoading(false);
  }

  /* =======================================================
     LOAD FIELDS
  ======================================================= */

  async function loadFields(pageId: string) {
    const { data, error } = await supabase
      .from("submission_fields")
      .select(
        `
          id,
          submission_page_id,
          field_key,
          field_label,
          field_type,
          required,
          options,
          placeholder,
          help_text,
          display_order,
          enabled
        `
      )
      .eq(
        "submission_page_id",
        pageId
      )
      .order("display_order", {
        ascending: true,
      });

    if (error) {
      throw new Error(error.message);
    }

    const rawFields =
      (data ?? []) as SubmissionFieldRow[];

    const fields: SubmissionField[] =
      rawFields.map(
        (
          field: SubmissionFieldRow
        ) => ({
          id: field.id,
          submission_page_id:
            field.submission_page_id,
          field_key: field.field_key,
          field_label:
            field.field_label,
          field_type:
            field.field_type as SubmissionFieldType,
          required:
            field.required,
          options:
            Array.isArray(
              field.options
            )
              ? field.options.filter(
                  (
                    option: unknown
                  ): option is string =>
                    typeof option ===
                    "string"
                )
              : [],
          placeholder:
            field.placeholder ??
            null,
          help_text:
            field.help_text ??
            null,
          display_order:
            field.display_order,
          enabled:
            field.enabled ?? true,
        })
      );

    const normalized =
      normalizeFieldOrder(fields);

    setFields(
      normalized.length
        ? normalized
        : cloneFields(DEFAULT_FIELDS)
    );
  }

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadEvents();
    loadPages();
  }, []);

  /* =======================================================
     DERIVED DATA
  ======================================================= */

  const availableEvents = useMemo(
    () =>
      events.filter(
        (event: EventItem) =>
          event.published &&
          isEventDateValid(
            event.date
          )
      ),
    [events]
  );

  const selectedEvent = useMemo(
    () =>
      events.find(
        (event: EventItem) =>
          event.id ===
          selectedEventId
      ),
    [events, selectedEventId]
  );

  const filteredPages = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return pages;
    }

    return pages.filter(
      (page: SubmissionPage) =>
        [
          page.event_name,
          page.slug,
          page.status,
          page.title ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(query)
    );
  }, [pages, search]);

  const stats = {
    total: pages.length,

    published: pages.filter(
      (page: SubmissionPage) =>
        page.status === "published"
    ).length,

    draft: pages.filter(
      (page: SubmissionPage) =>
        page.status === "draft"
    ).length,

    closed: pages.filter(
      (page: SubmissionPage) =>
        page.status === "closed"
    ).length,

    submissions: Object.values(
      submissionCounts
    ).reduce(
      (
        total: number,
        count: number
      ) => total + count,
      0
    ),
  };

  /* =======================================================
     RESET FORM
  ======================================================= */

  function resetForm() {
    setEditingPage(null);

    setSelectedEventId("");

    setPageTitle("");

    setDescription("");

    setInstructions("");

    setConfirmationMessage(
      "Your submission has been received successfully."
    );

    setSubmissionDeadline("");

    setFields(
      cloneFields(DEFAULT_FIELDS)
    );

    setDraggingFieldKey(null);
  }

  function openCreateModal() {
    resetForm();
    setModalOpen(true);
  }

  async function openEditModal(
    page: SubmissionPage
  ) {
    setEditingPage(page);

    setSelectedEventId(
      page.event_id ?? ""
    );

    setPageTitle(
      page.title ?? ""
    );

    setDescription(
      page.description ?? ""
    );

    setInstructions(
      page.instructions ?? ""
    );

    setConfirmationMessage(
      page.confirmation_message ??
        "Your submission has been received successfully."
    );

    if (
      page.submission_deadline
    ) {
      const date = new Date(
        page.submission_deadline
      );

      if (
        !Number.isNaN(
          date.getTime()
        )
      ) {
        const local = new Date(
          date.getTime() -
            date.getTimezoneOffset() *
              60000
        )
          .toISOString()
          .slice(0, 16);

        setSubmissionDeadline(
          local
        );
      }
    } else {
      setSubmissionDeadline("");
    }

    try {
      await loadFields(page.id);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load submission fields."
      );
    }

    setModalOpen(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setModalOpen(false);
    setEditingPage(null);
  }

  /* =======================================================
     FIELD HELPERS
  ======================================================= */

  function getCurrentFields() {
    return fields;
  }

  function setCurrentFields(nextFields: SubmissionField[]) {
    setFields(normalizeFieldOrder(nextFields));
  }

  function handleFieldDragStart(fieldKey: string) {
    setDraggingFieldKey(fieldKey);
  }

  function handleFieldDragEnd() {
    setDraggingFieldKey(null);
  }

  function handleFieldDragOver(
    event: DragEvent<HTMLDivElement>,
    targetFieldKey: string
  ) {
    event.preventDefault();

    if (
      !draggingFieldKey ||
      draggingFieldKey === targetFieldKey
    ) {
      return;
    }

    const currentFields = getCurrentFields();
    const draggedIndex = currentFields.findIndex(
      (field) => field.field_key === draggingFieldKey
    );
    const targetIndex = currentFields.findIndex(
      (field) => field.field_key === targetFieldKey
    );

    if (draggedIndex === -1 || targetIndex === -1) {
      return;
    }

    if (
      currentFields[targetIndex]?.field_type === "file" &&
      currentFields[draggedIndex]?.field_type !== "file"
    ) {
      return;
    }

    const reordered = [...currentFields];
    const [draggedField] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, draggedField);

    setFields(normalizeFieldOrder(reordered));
  }

  function createFieldKey(
    label: string
  ) {
    const base =
      slugify(label).replace(
        /-/g,
        "_"
      ) || "field";

    const fields =
      getCurrentFields();

    let key = base;
    let count = 2;

    while (
      fields.some(
        (
          field: SubmissionField
        ) =>
          field.field_key ===
            key &&
          field.id !==
            editingField?.id
      )
    ) {
      key = `${base}_${count}`;
      count++;
    }

    return key;
  }

  function openAddField() {
    setEditingField(null);
    setFieldLabel("");
    setFieldType("text");
    setFieldRequired(true);
    setFieldOptions("");
    setFieldPlaceholder("");
    setFieldHelpText("");
    setFieldModalOpen(true);
  }

  function openEditField(
    field: SubmissionField
  ) {
    setEditingField(field);

    setFieldLabel(
      field.field_label
    );

    setFieldType(
      field.field_type
    );

    setFieldRequired(
      field.required
    );

    setFieldOptions(
      field.options.join("\n")
    );

    setFieldPlaceholder(
      field.placeholder ?? ""
    );

    setFieldHelpText(
      field.help_text ?? ""
    );

    setFieldModalOpen(true);
  }

  function saveFieldLocally() {
    if (!fieldLabel.trim()) {
      return;
    }

    const fields =
      getCurrentFields();

    const options =
      fieldType === "dropdown"
        ? fieldOptions
            .split("\n")
            .map(
              (
                option: string
              ) =>
                option.trim()
            )
            .filter(Boolean)
        : [];

    if (editingField?.id) {
      const updated =
        fields.map(
          (
            field: SubmissionField
          ) =>
            field.id ===
            editingField.id
              ? {
                  ...field,
                  field_label:
                    fieldLabel.trim(),
                  field_type:
                    fieldType,
                  required:
                    fieldRequired,
                  options,
                  placeholder:
                    fieldPlaceholder.trim() ||
                    null,
                  help_text:
                    fieldHelpText.trim() ||
                    null,
                }
              : field
        );

      setCurrentFields(
        updated
      );
    } else {
      const newField: SubmissionField =
        {
          field_key:
            createFieldKey(
              fieldLabel
            ),
          field_label:
            fieldLabel.trim(),
          field_type:
            fieldType,
          required:
            fieldRequired,
          options,
          placeholder:
            fieldPlaceholder.trim() ||
            null,
          help_text:
            fieldHelpText.trim() ||
            null,
          display_order:
            fields.length,
          enabled: true,
        };

      setCurrentFields([
        ...fields,
        newField,
      ]);
    }

    setFieldModalOpen(false);
  }

  function removeField(
    field: SubmissionField
  ) {
    if (
      !window.confirm(
        `Remove "${field.field_label}" from this submission form?`
      )
    ) {
      return;
    }

    const fields =
      getCurrentFields().filter(
        (
          item: SubmissionField
        ) =>
          item.id !== field.id &&
          item.field_key !==
            field.field_key
      );

    setCurrentFields(
      fields
    );
  }

  /* =======================================================
     SAVE FIELDS
  ======================================================= */

  async function saveFields(
    pageId: string,
    fields: SubmissionField[]
  ) {
    const {
      error: deleteError,
    } = await supabase
      .from("submission_fields")
      .delete()
      .eq(
        "submission_page_id",
        pageId
      );

    if (deleteError) {
      throw new Error(
        deleteError.message
      );
    }

    const normalized =
      normalizeFieldOrder(
        fields
      );

    if (!normalized.length) {
      return;
    }

    const payload =
      normalized.map(
        (
          field: SubmissionField,
          index: number
        ) => ({
          submission_page_id:
            pageId,
          field_key:
            field.field_key,
          field_label:
            field.field_label,
          field_type:
            field.field_type,
          required:
            field.required,
          options:
            field.options,
          placeholder:
            field.placeholder ??
            null,
          help_text:
            field.help_text ??
            null,
          display_order:
            index,
          enabled:
            field.enabled ?? true,
        })
      );

    const {
      error: insertError,
    } = await supabase
      .from("submission_fields")
      .insert(payload);

    if (insertError) {
      throw new Error(
        insertError.message
      );
    }
  }

  /* =======================================================
     SAVE SUBMISSION PAGE
  ======================================================= */

  async function savePage() {
    if (!selectedEvent) {
      setError(
        "Please select a published event."
      );

      return;
    }

    if (
      !isEventDateValid(
        selectedEvent.date
      )
    ) {
      setError(
        "This event has already ended and cannot be used for submissions."
      );

      return;
    }

    if (
      submissionDeadline &&
      new Date(
        submissionDeadline
      ).getTime() <= Date.now()
    ) {
      setError(
        "Submission deadline must be in the future."
      );

      return;
    }

    setSaving(true);
    setError("");

    try {
      const eventName =
        selectedEvent.title;

      const baseSlug =
        slugify(eventName);

      let slug = baseSlug;

      if (!editingPage) {
        const {
          data: existing,
        } = await supabase
          .from("submission_pages")
          .select("id")
          .eq(
            "slug",
            slug
          )
          .maybeSingle();

        if (existing) {
          slug = `${baseSlug}-${Date.now()}`;
        }
      } else if (
        editingPage.slug !==
        slug
      ) {
        const {
          data: existing,
        } = await supabase
          .from("submission_pages")
          .select("id")
          .eq(
            "slug",
            slug
          )
          .neq(
            "id",
            editingPage.id
          )
          .maybeSingle();

        if (existing) {
          slug = `${baseSlug}-${Date.now()}`;
        }
      }

      const payload = {
        event_id:
          selectedEvent.id,

        event_name:
          eventName,

        slug,

        title:
          pageTitle.trim() ||
          eventName,

        description:
          description.trim() ||
          null,

        instructions:
          instructions.trim() ||
          null,

        confirmation_message:
          confirmationMessage.trim() ||
          null,

        submission_deadline:
          submissionDeadline
            ? new Date(
                submissionDeadline
              ).toISOString()
            : null,
      };

      let pageId =
        editingPage?.id;

      if (editingPage) {
        const {
          error,
        } = await supabase
          .from("submission_pages")
          .update(payload)
          .eq(
            "id",
            editingPage.id
          );

        if (error) {
          throw new Error(
            error.message
          );
        }
      } else {
        const {
          data,
          error,
        } = await supabase
          .from("submission_pages")
          .insert({
            ...payload,
            status: "draft",
          })
          .select("id")
          .single();

        if (error) {
          throw new Error(
            error.message
          );
        }

        pageId = data.id;
      }

      if (!pageId) {
        throw new Error(
          "Submission page ID was not created."
        );
      }

      const currentFields = getCurrentFields();

      await saveFields(
        pageId,
        currentFields
      );

      await loadPages();

      setModalOpen(false);
      setEditingPage(null);
    } catch (err) {
      console.error(
        "Save submission page error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save submission page."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     STATUS
  ======================================================= */

  async function changeStatus(
    page: SubmissionPage,
    status: PageStatus
  ) {
    const { error } =
      await supabase
        .from("submission_pages")
        .update({ status })
        .eq(
          "id",
          page.id
        );

    if (error) {
      setError(
        error.message
      );
      return;
    }

    await loadPages();
  }

  /* =======================================================
     DELETE
  ======================================================= */

  async function deletePage(
    page: SubmissionPage
  ) {
    if (
      !window.confirm(
        `Delete the submission page for "${page.event_name}"?`
      )
    ) {
      return;
    }

    const { error } =
      await supabase
        .from("submission_pages")
        .delete()
        .eq(
          "id",
          page.id
        );

    if (error) {
      setError(
        error.message
      );
      return;
    }

    await loadPages();
  }

  /* =======================================================
     FIELD CONFIGURATION UI
  ======================================================= */

  function renderFieldConfiguration() {
    const currentFields = getCurrentFields();

    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-950">
              Fields
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Configure exactly what participants must submit.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddField}
            className="
              inline-flex
              shrink-0
              items-center
              gap-1.5
              rounded-xl
              bg-gradient-to-r
              from-emerald-500
              to-blue-600
              px-3
              py-2
              text-xs
              font-semibold
              text-white
              shadow-sm
              transition
              hover:from-emerald-600
              hover:to-blue-700
            "
          >
            <Plus size={15} />
            Add Field
          </button>
        </div>

        <div className="space-y-2">
          {currentFields.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-center text-xs text-slate-500">
              No fields configured.
            </div>
          ) : (
            currentFields.map(
              (field: SubmissionField, index: number) => (
                <div
                  key={field.id ?? `${field.field_key}-${index}`}
                  draggable={field.field_type !== "file"}
                  onDragStart={() =>
                    handleFieldDragStart(field.field_key)
                  }
                  onDragOver={(event) =>
                    handleFieldDragOver(
                      event,
                      field.field_key
                    )
                  }
                  onDragEnd={handleFieldDragEnd}
                  className={`
                    flex items-center justify-between gap-3 rounded-xl
                    border bg-white p-3 transition
                    ${
                      draggingFieldKey === field.field_key
                        ? "border-blue-400 bg-blue-50/60 opacity-60"
                        : "border-slate-200"
                    }
                    ${
                      field.field_type !== "file"
                        ? "cursor-grab active:cursor-grabbing"
                        : ""
                    }
                  `}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <GripVertical
                      size={17}
                      className={
                        field.field_type === "file"
                          ? "shrink-0 text-slate-300"
                          : "shrink-0 text-slate-400"
                      }
                    />

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {field.field_type === "file" && (
                          <FileUp
                            size={15}
                            className="text-blue-600"
                          />
                        )}

                        <span className="text-sm font-semibold text-slate-900">
                          {field.field_label}
                        </span>

                        {field.required ? (
                          <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-600">
                            Required
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                            Optional
                          </span>
                        )}

                        {field.field_type === "file" && (
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
                            Upload
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-xs capitalize text-slate-400">
                        {field.field_type}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditField(field)}
                      className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                      title="Edit field"
                    >
                      <Edit3 size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() => removeField(field)}
                      className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
                      title="Remove field"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )
            )
          )}
        </div>

        {currentFields.some(
          (field: SubmissionField) =>
            field.field_type === "file"
        ) && (
          <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5 text-xs text-blue-700">
            Drag fields to change their order. Upload fields are automatically kept at the bottom of the form.
          </div>
        )}
      </div>
    );
  }

  const statItems: [
    string,
    number
  ][] = [
    ["Total Pages", stats.total],
    ["Published", stats.published],
    ["Drafts", stats.draft],
    ["Closed", stats.closed],
    ["Submissions", stats.submissions],
  ];

  return (
    <div className="min-h-screen px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1500px]">

        {/* HEADER */}

        <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
              Submission Management
            </p>

            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Submission Pages
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Create configurable submission forms for your published events.
            </p>
          </div>

          <button
            type="button"
            onClick={
              openCreateModal
            }
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
            "
          >
            <Plus size={18} />
            Create Submission Page
          </button>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <span>{error}</span>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="shrink-0"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* STATS */}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {statItems.map(
            (
              [label, value]
            ) => (
              <div
                key={label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {label}
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-950">
                  {value}
                </p>
              </div>
            )
          )}
        </div>

        {/* SEARCH */}

        <div className="mb-5 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(
                event
              ) =>
                setSearch(
                  event.target
                    .value
                )
              }
              placeholder="Search submission pages..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              loadEvents();
              loadPages();
            }}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <RefreshCw
              size={16}
            />
            Refresh
          </button>
        </div>

        {/* TABLE */}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            Loading submission pages...
          </div>
        ) : filteredPages.length ===
          0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <FileUp
              className="mx-auto mb-3 text-slate-300"
              size={34}
            />

            <h2 className="text-base font-bold text-slate-900">
              No submission pages
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Create a submission page from one of your published events.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            {/* DESKTOP */}

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                      Event
                    </th>


                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                      Status
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                      Submissions
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                      URL
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-400">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredPages.map(
                    (
                      page: SubmissionPage
                    ) => (
                      <tr
                        key={page.id}
                        className="border-b border-slate-100 last:border-b-0"
                      >
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-slate-900">
                            {
                              page.event_name
                            }
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            /events/
                            {
                              page.slug
                            }
                            /submit
                          </p>
                        </td>


                        <td className="px-5 py-4">
                          <span
                            className={`
                              inline-flex
                              rounded-full
                              px-2.5
                              py-1
                              text-xs
                              font-semibold
                              capitalize
                              ${
                                page.status ===
                                "published"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : page.status ===
                                      "closed"
                                    ? "bg-rose-50 text-rose-700"
                                    : "bg-amber-50 text-amber-700"
                              }
                            `}
                          >
                            {
                              page.status
                            }
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <Link
                            href={`/admin/submissions/${page.id}`}
                            className="inline-flex items-center rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                          >
                            {
                              submissionCounts[
                                page.id
                              ] ?? 0
                            }
                          </Link>
                        </td>

                        <td className="px-5 py-4">
                          <a
                            href={`/events/${page.slug}/submit`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
                          >
                            Open
                            <ExternalLink
                              size={13}
                            />
                          </a>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  page
                                )
                              }
                              className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                            >
                              Edit
                            </button>

                            {page.status ===
                              "draft" && (
                              <button
                                type="button"
                                onClick={() =>
                                  changeStatus(
                                    page,
                                    "published"
                                  )
                                }
                                className="rounded-lg px-3 py-2 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-50"
                              >
                                Publish
                              </button>
                            )}

                            {page.status ===
                              "published" && (
                              <button
                                type="button"
                                onClick={() =>
                                  changeStatus(
                                    page,
                                    "closed"
                                  )
                                }
                                className="rounded-lg px-3 py-2 text-xs font-semibold text-amber-600 transition hover:bg-amber-50"
                              >
                                Close
                              </button>
                            )}

                            {page.status ===
                              "closed" && (
                              <button
                                type="button"
                                onClick={() =>
                                  changeStatus(
                                    page,
                                    "published"
                                  )
                                }
                                className="rounded-lg px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
                              >
                                Reopen
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                deletePage(
                                  page
                                )
                              }
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                              title="Delete"
                            >
                              <Trash2
                                size={15}
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* MOBILE */}

            <div className="divide-y divide-slate-100 lg:hidden">
              {filteredPages.map(
                (
                  page: SubmissionPage
                ) => (
                  <div
                    key={page.id}
                    className="p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-950">
                          {
                            page.event_name
                          }
                        </h3>

                        <p className="mt-1 text-xs text-slate-400">
                          /events/
                          {
                            page.slug
                          }
                          /submit
                        </p>
                      </div>

                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          openEditModal(
                            page
                          )
                        }
                        className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700"
                      >
                        Edit
                      </button>

                      {page.status ===
                        "draft" && (
                        <button
                          type="button"
                          onClick={() =>
                            changeStatus(
                              page,
                              "published"
                            )
                          }
                          className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"
                        >
                          Publish
                        </button>
                      )}

                      {page.status ===
                        "published" && (
                        <button
                          type="button"
                          onClick={() =>
                            changeStatus(
                              page,
                              "closed"
                            )
                          }
                          className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700"
                        >
                          Close
                        </button>
                      )}

                      {page.status ===
                        "closed" && (
                        <button
                          type="button"
                          onClick={() =>
                            changeStatus(
                              page,
                              "published"
                            )
                          }
                          className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700"
                        >
                          Reopen
                        </button>
                      )}

                      <Link
                        href={`/admin/submissions/${page.id}`}
                        className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700"
                      >
                        {
                          submissionCounts[
                            page.id
                          ] ?? 0
                        }{" "}
                        Submissions
                      </Link>

                      <a
                        href={`/events/${page.slug}/submit`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700"
                      >
                        View
                      </a>

                      <button
                        type="button"
                        onClick={() =>
                          deletePage(
                            page
                          )
                        }
                        className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>

      {/* ===================================================
          CREATE / EDIT MODAL
      =================================================== */}

      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  {editingPage
                    ? "Edit Submission Page"
                    : "Create Submission Page"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Configure exactly what participants will submit.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeModal
                }
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* MODAL BODY */}

            <div className="max-h-[calc(92vh-150px)] overflow-y-auto p-6">
              <div className="grid gap-6">

                {/* EVENT */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    Published Event
                  </label>

                  <div className="relative">
                    <select
                      value={
                        selectedEventId
                      }
                      onChange={(
                        event
                      ) =>
                        setSelectedEventId(
                          event.target
                            .value
                        )
                      }
                      disabled={
                        !!editingPage ||
                        eventsLoading
                      }
                      className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                    >
                      <option value="">
                        {eventsLoading
                          ? "Loading events..."
                          : availableEvents.length ===
                              0
                            ? "No eligible published events"
                            : "Select a published event"}
                      </option>

                      {availableEvents.map(
                        (
                          event: EventItem
                        ) => (
                          <option
                            key={
                              event.id
                            }
                            value={
                              event.id
                            }
                          >
                            {
                              event.title
                            }{" "}
                            —{" "}
                            {
                              event.date
                            }
                          </option>
                        )
                      )}
                    </select>

                    <ChevronDown
                      size={17}
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>

                  {selectedEvent && (
                    <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
                      <p className="text-sm font-bold text-slate-900">
                        {
                          selectedEvent.title
                        }
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {
                          selectedEvent.date
                        }{" "}
                        ·{" "}
                        {
                          selectedEvent.time
                        }{" "}
                        ·{" "}
                        {
                          selectedEvent.location
                        }
                      </p>
                    </div>
                  )}
                </div>

                {/* TITLE */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    Submission Page Title
                  </label>

                  <input
                    value={
                      pageTitle
                    }
                    onChange={(
                      event
                    ) =>
                      setPageTitle(
                        event.target
                          .value
                      )
                    }
                    placeholder="e.g. Project Submission"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* DESCRIPTION */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    Description
                  </label>

                  <textarea
                    value={
                      description
                    }
                    onChange={(
                      event
                    ) =>
                      setDescription(
                        event.target
                          .value
                      )
                    }
                    rows={3}
                    placeholder="Tell participants what they need to submit..."
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* INSTRUCTIONS */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    Instructions
                  </label>

                  <textarea
                    value={
                      instructions
                    }
                    onChange={(
                      event
                    ) =>
                      setInstructions(
                        event.target
                          .value
                      )
                    }
                    rows={4}
                    placeholder="Explain file requirements, naming rules, format, etc."
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* CONFIRMATION */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    Confirmation Message
                  </label>

                  <textarea
                    value={
                      confirmationMessage
                    }
                    onChange={(
                      event
                    ) =>
                      setConfirmationMessage(
                        event.target
                          .value
                      )
                    }
                    rows={3}
                    placeholder="Message shown after successful submission."
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* DEADLINE */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    Submission Deadline
                  </label>

                  <input
                    type="datetime-local"
                    value={
                      submissionDeadline
                    }
                    onChange={(
                      event
                    ) =>
                      setSubmissionDeadline(
                        event.target
                          .value
                      )
                    }
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />

                  <p className="mt-1 text-xs text-slate-400">
                    Leave empty if there is no separate submission deadline.
                  </p>
                </div>

                {/* FIELDS */}

                <div>
                  <div className="mb-4">
                    <h3 className="text-base font-bold text-slate-950">
                      Form Fields
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Add, edit or remove anything you want participants to provide.
                    </p>
                  </div>

                  {renderFieldConfiguration()}
                </div>
              </div>
            </div>

            {/* FOOTER */}

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={
                  closeModal
                }
                disabled={
                  saving
                }
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  savePage
                }
                disabled={
                  saving ||
                  !selectedEventId ||
                  availableEvents.length ===
                    0
                }
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  bg-gradient-to-r
                  from-emerald-500
                  to-blue-600
                  px-5
                  py-2.5
                  text-sm
                  font-semibold
                  text-white
                  shadow-sm
                  transition
                  hover:from-emerald-600
                  hover:to-blue-700
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                {saving ? (
                  <>
                    <RefreshCw
                      size={16}
                      className="animate-spin"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check
                      size={16}
                    />

                    {editingPage
                      ? "Save Changes"
                      : "Create Submission Page"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================
          FIELD EDIT MODAL
      =================================================== */}

      {fieldModalOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setFieldModalOpen(
                false
              );
            }
          }}
        >
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  {editingField
                    ? "Edit Field"
                    : "Add Field"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Configure what participants will be asked.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setFieldModalOpen(
                    false
                  )
                }
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>

            <div className="space-y-5 p-6">

              {/* FIELD NAME */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Field Name
                </label>

                <input
                  value={
                    fieldLabel
                  }
                  onChange={(
                    event
                  ) =>
                    setFieldLabel(
                      event.target
                        .value
                    )
                  }
                  placeholder="e.g. Project Title"
                  className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* FIELD TYPE */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Field Type
                </label>

                <select
                  value={
                    fieldType
                  }
                  onChange={(
                    event
                  ) =>
                    setFieldType(
                      event.target
                        .value as SubmissionFieldType
                    )
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="text">
                    Text
                  </option>

                  <option value="textarea">
                    Textarea
                  </option>

                  <option value="number">
                    Number
                  </option>

                  <option value="email">
                    Email
                  </option>

                  <option value="phone">
                    Phone
                  </option>

                  <option value="dropdown">
                    Dropdown
                  </option>

                  <option value="file">
                    File Upload
                  </option>
                </select>
              </div>

              {/* PLACEHOLDER */}

              {fieldType !==
                "file" && (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    Placeholder
                  </label>

                  <input
                    value={
                      fieldPlaceholder
                    }
                    onChange={(
                      event
                    ) =>
                      setFieldPlaceholder(
                        event.target
                          .value
                      )
                    }
                    placeholder="Optional placeholder text"
                    className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              )}

              {/* HELP TEXT */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Help Text
                </label>

                <textarea
                  value={
                    fieldHelpText
                  }
                  onChange={(
                    event
                  ) =>
                    setFieldHelpText(
                      event.target
                        .value
                    )
                  }
                  rows={3}
                  placeholder="Optional guidance shown below the field."
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* DROPDOWN OPTIONS */}

              {fieldType ===
                "dropdown" && (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    Dropdown Options
                  </label>

                  <textarea
                    value={
                      fieldOptions
                    }
                    onChange={(
                      event
                    ) =>
                      setFieldOptions(
                        event.target
                          .value
                      )
                    }
                    rows={5}
                    placeholder={
                      "Option 1\nOption 2\nOption 3"
                    }
                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />

                  <p className="mt-1 text-xs text-slate-400">
                    Enter one option per line.
                  </p>
                </div>
              )}

              {/* FILE INFORMATION */}

              {fieldType ===
                "file" && (
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <div className="flex items-start gap-3">
                    <FileUp
                      size={18}
                      className="mt-0.5 text-blue-600"
                    />

                    <div>
                      <p className="text-sm font-semibold text-blue-900">
                        File upload field
                      </p>

                      <p className="mt-1 text-xs text-blue-700">
                        Upload fields are automatically placed at the bottom of the submission form.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* REQUIRED */}

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <input
                  type="checkbox"
                  checked={
                    fieldRequired
                  }
                  onChange={(
                    event
                  ) =>
                    setFieldRequired(
                      event.target
                        .checked
                    )
                  }
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />

                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Required field
                  </p>

                  <p className="text-xs text-slate-500">
                    Participants must provide this field.
                  </p>
                </div>
              </label>
            </div>

            {/* FOOTER */}

            <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={() =>
                  setFieldModalOpen(
                    false
                  )
                }
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  !fieldLabel.trim()
                }
                onClick={
                  saveFieldLocally
                }
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  bg-gradient-to-r
                  from-emerald-500
                  to-blue-600
                  px-5
                  py-2.5
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:from-emerald-600
                  hover:to-blue-700
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                <Check size={16} />

                {editingField
                  ? "Save Field"
                  : "Add Field"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}