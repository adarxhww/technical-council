"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  Edit3,
  ExternalLink,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  UserRound,
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

type RegistrationPage = {
  id: string;
  event_id: string | null;
  event_name: string;
  slug: string;
  event_type: "individual" | "team";
  team_member_count: number;
  description: string | null;
  status: "draft" | "published" | "closed";
  created_at: string;
  updated_at: string;
};

type FieldScope =
  | "individual"
  | "team"
  | "team_leader"
  | "team_member";

type FieldType =
  | "text"
  | "number"
  | "email"
  | "phone"
  | "dropdown";

type RegistrationCounts = Record<string, number>;

type RegistrationField = {
  id?: string;
  registration_page_id?: string;
  field_scope: FieldScope;
  field_key: string;
  field_label: string;
  field_type: FieldType;
  required: boolean;
  options: string[];
  display_order: number;
};

/* =========================================================
   DEFAULT FIELDS
========================================================= */

const DEFAULT_INDIVIDUAL_FIELDS: RegistrationField[] = [
  {
    field_scope: "individual",
    field_key: "name",
    field_label: "Name",
    field_type: "text",
    required: true,
    options: [],
    display_order: 0,
  },
  {
    field_scope: "individual",
    field_key: "branch",
    field_label: "Branch",
    field_type: "text",
    required: true,
    options: [],
    display_order: 1,
  },
  {
    field_scope: "individual",
    field_key: "year",
    field_label: "Year",
    field_type: "text",
    required: true,
    options: [],
    display_order: 2,
  },
  {
    field_scope: "individual",
    field_key: "email",
    field_label: "Email",
    field_type: "email",
    required: true,
    options: [],
    display_order: 3,
  },
  {
    field_scope: "individual",
    field_key: "contact_no",
    field_label: "Contact No.",
    field_type: "phone",
    required: true,
    options: [],
    display_order: 4,
  },
];

const DEFAULT_TEAM_FIELDS: RegistrationField[] = [
  {
    field_scope: "team",
    field_key: "team_name",
    field_label: "Team Name",
    field_type: "text",
    required: true,
    options: [],
    display_order: 0,
  },
];

const DEFAULT_LEADER_FIELDS: RegistrationField[] = [
  {
    field_scope: "team_leader",
    field_key: "leader_name",
    field_label: "Leader Name",
    field_type: "text",
    required: true,
    options: [],
    display_order: 0,
  },
  {
    field_scope: "team_leader",
    field_key: "leader_branch",
    field_label: "Leader Branch",
    field_type: "text",
    required: true,
    options: [],
    display_order: 1,
  },
  {
    field_scope: "team_leader",
    field_key: "leader_year",
    field_label: "Leader Year",
    field_type: "text",
    required: true,
    options: [],
    display_order: 2,
  },
  {
    field_scope: "team_leader",
    field_key: "leader_email",
    field_label: "Leader Email",
    field_type: "email",
    required: true,
    options: [],
    display_order: 3,
  },
  {
    field_scope: "team_leader",
    field_key: "leader_contact_no",
    field_label: "Leader Contact No.",
    field_type: "phone",
    required: true,
    options: [],
    display_order: 4,
  },
];

const DEFAULT_MEMBER_FIELDS: RegistrationField[] = [
  {
    field_scope: "team_member",
    field_key: "member_name",
    field_label: "Member Name",
    field_type: "text",
    required: true,
    options: [],
    display_order: 0,
  },
  {
    field_scope: "team_member",
    field_key: "member_branch",
    field_label: "Member Branch",
    field_type: "text",
    required: true,
    options: [],
    display_order: 1,
  },
  {
    field_scope: "team_member",
    field_key: "member_year",
    field_label: "Member Year",
    field_type: "text",
    required: true,
    options: [],
    display_order: 2,
  },
  {
    field_scope: "team_member",
    field_key: "member_email",
    field_label: "Member Email",
    field_type: "email",
    required: true,
    options: [],
    display_order: 3,
  },
  {
    field_scope: "team_member",
    field_key: "member_contact_no",
    field_label: "Member Contact No.",
    field_type: "phone",
    required: true,
    options: [],
    display_order: 4,
  },
];

/* =========================================================
   HELPERS
========================================================= */

function cloneFields(
  fields: RegistrationField[]
): RegistrationField[] {
  return fields.map((field, index) => ({
    ...field,
    id: undefined,
    registration_page_id: undefined,
    options: [...field.options],
    display_order: index,
  }));
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

export default function RegistrationsPage() {
  const supabase = createClient();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [pages, setPages] = useState<RegistrationPage[]>([]);
  const [registrationCounts, setRegistrationCounts] = useState<RegistrationCounts>({});

  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [fieldModalOpen, setFieldModalOpen] = useState(false);

  const [editingPage, setEditingPage] =
    useState<RegistrationPage | null>(null);

  const [editingField, setEditingField] =
    useState<RegistrationField | null>(null);

  const [selectedEventId, setSelectedEventId] =
    useState("");

  const [eventType, setEventType] =
    useState<"individual" | "team">("individual");

  const [description, setDescription] =
    useState("");

  const [teamMemberCount, setTeamMemberCount] =
    useState(3);

  /* =======================================================
     FIELD STATE
  ======================================================= */

  const [individualFields, setIndividualFields] =
    useState<RegistrationField[]>(
      cloneFields(DEFAULT_INDIVIDUAL_FIELDS)
    );

  const [teamFields, setTeamFields] =
    useState<RegistrationField[]>(
      cloneFields(DEFAULT_TEAM_FIELDS)
    );

  const [leaderFields, setLeaderFields] =
    useState<RegistrationField[]>(
      cloneFields(DEFAULT_LEADER_FIELDS)
    );

  const [memberFields, setMemberFields] =
    useState<RegistrationField[]>(
      cloneFields(DEFAULT_MEMBER_FIELDS)
    );

  /* =======================================================
     FIELD MODAL STATE
  ======================================================= */

  const [fieldScope, setFieldScope] =
    useState<FieldScope>("individual");

  const [fieldLabel, setFieldLabel] =
    useState("");

  const [fieldType, setFieldType] =
    useState<FieldType>("text");

  const [fieldRequired, setFieldRequired] =
    useState(true);

  const [fieldOptions, setFieldOptions] =
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
      setEvents(data ?? []);
    }

    setEventsLoading(false);
  }

  /* =======================================================
     LOAD REGISTRATION PAGES
  ======================================================= */

  async function loadPages() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("registration_pages")
      .select(
        `
          id,
          event_id,
          event_name,
          slug,
          event_type,
          team_member_count,
          description,
          status,
          created_at,
          updated_at
        `
      )
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Registration pages error:",
        error
      );

      setError(error.message);
      setPages([]);
      setRegistrationCounts({});
      setLoading(false);
      return;
    }

    const loadedPages = (data ?? []) as RegistrationPage[];
    setPages(loadedPages);

    if (!loadedPages.length) {
      setRegistrationCounts({});
      setLoading(false);
      return;
    }

    const counts: RegistrationCounts = {};

    await Promise.all(
      loadedPages.map(async (page) => {
        if (page.event_type === "individual") {
          const { count } = await supabase
            .from("individual_registrations")
            .select("id", { count: "exact", head: true })
            .eq("registration_page_id", page.id);

          counts[page.id] = count ?? 0;
        } else {
          const { count } = await supabase
            .from("team_registrations")
            .select("id", { count: "exact", head: true })
            .eq("registration_page_id", page.id);

          counts[page.id] = count ?? 0;
        }
      })
    );

    setRegistrationCounts(counts);
    setLoading(false);
  }

  /* =======================================================
     LOAD FIELD CONFIGURATION
  ======================================================= */

  async function loadFields(pageId: string) {
    const { data, error } = await supabase
      .from("registration_fields")
      .select(
        `
          id,
          registration_page_id,
          field_scope,
          field_key,
          field_label,
          field_type,
          required,
          options,
          display_order
        `
      )
      .eq("registration_page_id", pageId)
      .order("display_order", {
        ascending: true,
      });

    if (error) {
      console.error(
        "Registration fields error:",
        error
      );

      throw new Error(error.message);
    }

    const rows: RegistrationField[] = (
      data ?? []
    ).map((field) => ({
      ...field,
      field_scope:
        field.field_scope as FieldScope,
      field_type:
        field.field_type as FieldType,
      options: Array.isArray(field.options)
        ? field.options
        : [],
    }));

    const individual = rows
      .filter(
        (field) =>
          field.field_scope ===
          "individual"
      )
      .map((field, index) => ({
        ...field,
        display_order: index,
      }));

    const team = rows
      .filter(
        (field) =>
          field.field_scope === "team"
      )
      .map((field, index) => ({
        ...field,
        display_order: index,
      }));

    const leader = rows
      .filter(
        (field) =>
          field.field_scope ===
          "team_leader"
      )
      .map((field, index) => ({
        ...field,
        display_order: index,
      }));

    const member = rows
      .filter(
        (field) =>
          field.field_scope ===
          "team_member"
      )
      .map((field, index) => ({
        ...field,
        display_order: index,
      }));

    setIndividualFields(
      individual.length
        ? individual
        : cloneFields(
            DEFAULT_INDIVIDUAL_FIELDS
          )
    );

    setTeamFields(
      team.length
        ? team
        : cloneFields(DEFAULT_TEAM_FIELDS)
    );

    setLeaderFields(
      leader.length
        ? leader
        : cloneFields(
            DEFAULT_LEADER_FIELDS
          )
    );

    setMemberFields(
      member.length
        ? member
        : cloneFields(
            DEFAULT_MEMBER_FIELDS
          )
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

  const availableEvents = useMemo(() => {
    return events.filter(
      (event) =>
        event.published &&
        isEventDateValid(event.date)
    );
  }, [events]);

  const selectedEvent = useMemo(() => {
    return events.find(
      (event) =>
        event.id === selectedEventId
    );
  }, [events, selectedEventId]);

  const filteredPages = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return pages;
    }

    return pages.filter((page) =>
      [
        page.event_name,
        page.slug,
        page.event_type,
        page.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [pages, search]);

  const stats = {
    total: pages.length,
    published: pages.filter(
      (page) =>
        page.status === "published"
    ).length,
    draft: pages.filter(
      (page) => page.status === "draft"
    ).length,
    closed: pages.filter(
      (page) => page.status === "closed"
    ).length,
    registrations: Object.values(registrationCounts).reduce(
      (total, count) => total + count,
      0
    ),
  };

  /* =======================================================
     RESET FORM
  ======================================================= */

  function resetForm() {
    setEditingPage(null);
    setSelectedEventId("");
    setEventType("individual");
    setDescription("");
    setTeamMemberCount(3);

    setIndividualFields(
      cloneFields(DEFAULT_INDIVIDUAL_FIELDS)
    );

    setTeamFields(
      cloneFields(DEFAULT_TEAM_FIELDS)
    );

    setLeaderFields(
      cloneFields(DEFAULT_LEADER_FIELDS)
    );

    setMemberFields(
      cloneFields(DEFAULT_MEMBER_FIELDS)
    );
  }

  function openCreateModal() {
    resetForm();
    setModalOpen(true);
  }

  async function openEditModal(
    page: RegistrationPage
  ) {
    setEditingPage(page);

    setSelectedEventId(
      page.event_id ?? ""
    );

    setEventType(page.event_type);

    setDescription(
      page.description ?? ""
    );

    setTeamMemberCount(
      page.event_type === "team"
        ? Math.min(
            20,
            Math.max(
              1,
              Number(page.team_member_count) || 1
            )
          )
        : 1
    );

    try {
      await loadFields(page.id);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load fields."
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

  function getFieldsForScope(
    scope: FieldScope
  ) {
    if (scope === "individual") {
      return individualFields;
    }

    if (scope === "team") {
      return teamFields;
    }

    if (scope === "team_leader") {
      return leaderFields;
    }

    return memberFields;
  }

  function setFieldsForScope(
    scope: FieldScope,
    fields: RegistrationField[]
  ) {
    if (scope === "individual") {
      setIndividualFields(fields);
      return;
    }

    if (scope === "team") {
      setTeamFields(fields);
      return;
    }

    if (scope === "team_leader") {
      setLeaderFields(fields);
      return;
    }

    setMemberFields(fields);
  }

  function createFieldKey(
    label: string,
    scope: FieldScope
  ) {
    const base = slugify(label).replace(
      /-/g,
      "_"
    );

    const fallback =
      scope === "individual"
        ? "field"
        : scope === "team"
          ? "team_field"
          : scope ===
              "team_leader"
            ? "leader_field"
            : "member_field";

    const fields =
      getFieldsForScope(scope);

    let key = base || fallback;

    let count = 2;

    while (
      fields.some(
        (field) =>
          field.field_key === key &&
          field.id !== editingField?.id
      )
    ) {
      key = `${
        base || fallback
      }_${count}`;

      count++;
    }

    return key;
  }

  function openAddField(
    scope: FieldScope
  ) {
    setEditingField(null);
    setFieldScope(scope);
    setFieldLabel("");
    setFieldType("text");
    setFieldRequired(true);
    setFieldOptions("");
    setFieldModalOpen(true);
  }

  function openEditField(
    field: RegistrationField
  ) {
    setEditingField(field);

    setFieldScope(
      field.field_scope
    );

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

    setFieldModalOpen(true);
  }

  function saveFieldLocally() {
    if (!fieldLabel.trim()) {
      return;
    }

    const fields =
      getFieldsForScope(
        fieldScope
      );

    const options =
      fieldType === "dropdown"
        ? fieldOptions
            .split("\n")
            .map((option) =>
              option.trim()
            )
            .filter(Boolean)
        : [];

    if (editingField?.id) {
      const updated =
        fields.map((field) =>
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
              }
            : field
        );

      setFieldsForScope(
        fieldScope,
        updated
      );
    } else {
      const newField: RegistrationField =
        {
          field_scope: fieldScope,
          field_key:
            createFieldKey(
              fieldLabel,
              fieldScope
            ),
          field_label:
            fieldLabel.trim(),
          field_type:
            fieldType,
          required:
            fieldRequired,
          options,
          display_order:
            fields.length,
        };

      setFieldsForScope(
        fieldScope,
        [
          ...fields,
          newField,
        ]
      );
    }

    setFieldModalOpen(false);
  }

  function removeField(
    field: RegistrationField
  ) {
    if (
      !window.confirm(
        `Remove "${field.field_label}" from this registration form?`
      )
    ) {
      return;
    }

    const fields =
      getFieldsForScope(
        field.field_scope
      ).filter(
        (item) =>
          item.id !== field.id &&
          item.field_key !==
            field.field_key
      );

    setFieldsForScope(
      field.field_scope,
      fields.map(
        (item, index) => ({
          ...item,
          display_order:
            index,
        })
      )
    );
  }

  /* =======================================================
     SAVE FIELD CONFIGURATION
  ======================================================= */

  async function saveFields(
    pageId: string,
    fields: RegistrationField[]
  ) {
    const { error: deleteError } =
      await supabase
        .from("registration_fields")
        .delete()
        .eq(
          "registration_page_id",
          pageId
        );

    if (deleteError) {
      throw new Error(
        deleteError.message
      );
    }

    if (!fields.length) {
      return;
    }

    const payload = fields.map(
      (field, index) => ({
        registration_page_id:
          pageId,
        field_scope:
          field.field_scope,
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
        display_order:
          index,
      })
    );

    const {
      error: insertError,
    } = await supabase
      .from("registration_fields")
      .insert(payload);

    if (insertError) {
      throw new Error(
        insertError.message
      );
    }
  }

  /* =======================================================
     SAVE REGISTRATION PAGE
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
        "This event has already ended and cannot be used for registration."
      );

      return;
    }

    if (
      eventType === "team" &&
      teamMemberCount < 1
    ) {
      setError(
        "A team must have at least one member excluding the leader."
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
        const { data: existing } =
          await supabase
            .from(
              "registration_pages"
            )
            .select("id")
            .eq("slug", slug)
            .maybeSingle();

        if (existing) {
          slug = `${baseSlug}-${Date.now()}`;
        }
      } else if (
        editingPage.slug !==
        slug
      ) {
        const { data: existing } =
          await supabase
            .from(
              "registration_pages"
            )
            .select("id")
            .eq("slug", slug)
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
        event_type:
          eventType,
        team_member_count:
          eventType === "team"
            ? Math.min(
                20,
                Math.max(
                  1,
                  Number(teamMemberCount) || 1
                )
              )
            : 0,
        description:
          description.trim() ||
          null,
      };

      let pageId =
        editingPage?.id;

      if (editingPage) {
        const { error } =
          await supabase
            .from(
              "registration_pages"
            )
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
          .from(
            "registration_pages"
          )
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
          "Registration page ID was not created."
        );
      }

      let fields: RegistrationField[] =
        [];

      if (
        eventType ===
        "individual"
      ) {
        fields = [
          ...individualFields,
        ];
      } else {
        fields = [
          ...teamFields,
          ...leaderFields,
          ...memberFields,
        ];
      }

      await saveFields(
        pageId,
        fields
      );


      await loadPages();

      setModalOpen(false);
      setEditingPage(null);
    } catch (err) {
      console.error(
        "Save registration page error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save registration page."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     STATUS
  ======================================================= */

  async function changeStatus(
    page: RegistrationPage,
    status: RegistrationPage["status"]
  ) {
    const { error } =
      await supabase
        .from(
          "registration_pages"
        )
        .update({ status })
        .eq(
          "id",
          page.id
        );

    if (error) {
      setError(error.message);
      return;
    }

    await loadPages();
  }

  /* =======================================================
     DELETE
  ======================================================= */

  async function deletePage(
    page: RegistrationPage
  ) {
    if (
      !window.confirm(
        `Delete the registration page for "${page.event_name}"?`
      )
    ) {
      return;
    }

    const { error } =
      await supabase
        .from(
          "registration_pages"
        )
        .delete()
        .eq(
          "id",
          page.id
        );

    if (error) {
      setError(error.message);
      return;
    }

    await loadPages();
  }

  /* =======================================================
     FIELD CONFIGURATION UI
  ======================================================= */

  function renderFieldConfiguration(
    scope: FieldScope,
    title: string,
    subtitle: string,
    icon: React.ReactNode
  ) {
    const fields =
      getFieldsForScope(
        scope
      );

    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-white p-2 text-slate-700 shadow-sm">
              {icon}
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-950">
                {title}
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                {subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              openAddField(
                scope
              )
            }
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
          {fields.length ===
          0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-center text-xs text-slate-500">
              No fields configured.
            </div>
          ) : (
            fields.map(
              (
                field,
                index
              ) => (
                <div
                  key={
                    field.id ??
                    `${field.field_scope}-${field.field_key}-${index}`
                  }
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">
                        {
                          field.field_label
                        }
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
                    </div>

                    <p className="mt-1 text-xs capitalize text-slate-400">
                      {
                        field.field_type
                      }
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        openEditField(
                          field
                        )
                      }
                      className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                      title="Edit field"
                    >
                      <Edit3
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
                      className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
                      title="Remove field"
                    >
                      <Trash2
                        size={15}
                      />
                    </button>
                  </div>
                </div>
              )
            )
          )}
        </div>
      </div>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

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
              Registration Pages
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Create configurable registration
              forms for your published events.
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
            Create Registration Page
          </button>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <span>
              {error}
            </span>

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

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            [
              "Total Pages",
              stats.total,
            ],
            [
              "Published",
              stats.published,
            ],
            [
              "Drafts",
              stats.draft,
            ],
            [
              "Closed",
              stats.closed,
            ],
            [
              "Registrations",
              stats.registrations,
            ],
          ].map(
            ([
              label,
              value,
            ]) => (
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
              placeholder="Search registration pages..."
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
            Loading registration pages...
          </div>
        ) : filteredPages.length ===
          0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <Users
              className="mx-auto mb-3 text-slate-300"
              size={34}
            />

            <h2 className="text-base font-bold text-slate-900">
              No registration pages
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Create a registration page
              from one of your published
              events.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[900px]">
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
                      URL
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-400">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredPages.map(
                    (page) => (
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
                            /register
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-600">
                            {
                              page.event_type
                            }
                          </span>
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
                            href={`/admin/registrations/${page.id}`}
                            className="inline-flex items-center rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                          >
                            {registrationCounts[page.id] ?? 0}
                          </Link>
                        </td>

                        <td className="px-5 py-4">
                          <a
                            href={`/events/${page.slug}/register`}
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
                (page) => (
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
                          /register
                        </p>
                      </div>

                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold capitalize text-slate-600">
                        {
                          page.event_type
                        }
                      </span>
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
                        href={`/admin/registrations/${page.id}`}
                        className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700"
                      >
                        {registrationCounts[page.id] ?? 0} Registrations
                      </Link>

                      <a
                        href={`/events/${page.slug}/register`}
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
                    ? "Edit Registration Page"
                    : "Create Registration Page"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Configure exactly what participants
                  will be asked.
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
                          event
                            .target
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
                          event
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

                {/* TYPE */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    Registration Type
                  </label>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() =>
                        setEventType(
                          "individual"
                        )
                      }
                      className={`
                        rounded-2xl
                        border
                        p-4
                        text-left
                        transition
                        ${
                          eventType ===
                          "individual"
                            ? "border-blue-400 bg-blue-50 ring-2 ring-blue-100"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                        }
                      `}
                    >
                      <UserRound
                        size={20}
                        className="text-blue-600"
                      />

                      <p className="mt-3 text-sm font-bold text-slate-950">
                        Individual
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        One participant
                        registers at a time.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setEventType(
                          "team"
                        )
                      }
                      className={`
                        rounded-2xl
                        border
                        p-4
                        text-left
                        transition
                        ${
                          eventType ===
                          "team"
                            ? "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-100"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                        }
                      `}
                    >
                      <Users
                        size={20}
                        className="text-emerald-600"
                      />

                      <p className="mt-3 text-sm font-bold text-slate-950">
                        Team
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Leader plus
                        configurable
                        members.
                      </p>
                    </button>
                  </div>
                </div>

                {/* TEAM SIZE */}

                {eventType ===
                  "team" && (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                    <label className="mb-2 block text-sm font-semibold text-slate-800">
                      Number of members
                      excluding leader
                    </label>

                    <div className="flex flex-wrap items-center gap-3">
                      <select
                        value={
                          teamMemberCount
                        }
                        onChange={(
                          event
                        ) =>
                          setTeamMemberCount(
                            Number(
                              event
                                .target
                                .value
                            )
                          )
                        }
                        className="h-11 w-32 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                      >
                        {Array.from(
                          {
                            length: 20,
                          },
                          (
                            _,
                            index
                          ) =>
                            index +
                            1
                        ).map(
                          (
                            count
                          ) => (
                            <option
                              key={
                                count
                              }
                              value={
                                count
                              }
                            >
                              {
                                count
                              }
                            </option>
                          )
                        )}
                      </select>

                      <p className="text-xs text-slate-500">
                        The leader is not
                        included in this
                        number.
                      </p>
                    </div>
                  </div>
                )}

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
                        event
                          .target
                          .value
                      )
                    }
                    rows={3}
                    placeholder="Tell participants what this registration is for..."
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* FIELDS */}

                <div>
                  <div className="mb-4">
                    <h3 className="text-base font-bold text-slate-950">
                      Form Fields
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Add, edit or remove anything you want
                      participants to provide.
                    </p>
                  </div>

                  {/* INDIVIDUAL */}

                  {eventType ===
                    "individual" &&
                    renderFieldConfiguration(
                      "individual",
                      "Individual Fields",
                      "Fields shown to every individual participant.",
                      <UserRound
                        size={
                          18
                        }
                      />
                    )}

                  {/* TEAM */}

                  {eventType ===
                    "team" && (
                    <div className="grid gap-4">
                      {/* TEAM DETAILS */}

                      {renderFieldConfiguration(
                        "team",
                        "Team Details",
                        "Information about the entire team.",
                        <Users
                          size={
                            18
                          }
                        />
                      )}

                      {/* TEAM LEADER */}

                      {renderFieldConfiguration(
                        "team_leader",
                        "Team Leader Fields",
                        "Fields collected from the team leader.",
                        <UserRound
                          size={
                            18
                          }
                        />
                      )}

                      {/* TEAM MEMBERS */}

                      {renderFieldConfiguration(
                        "team_member",
                        "Team Member Fields",
                        "These fields repeat for every team member.",
                        <Users
                          size={
                            18
                          }
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* MODAL FOOTER */}

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
                      size={
                        16
                      }
                      className="animate-spin"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check
                      size={
                        16
                      }
                    />

                    {editingPage
                      ? "Save Changes"
                      : "Create Registration Page"}
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
                      event
                        .target
                        .value
                    )
                  }
                  placeholder="e.g. Roll No."
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
                      event
                        .target
                        .value as FieldType
                    )
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="text">
                    Text
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
                </select>
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
                        event
                          .target
                          .value
                      )
                    }
                    rows={5}
                    placeholder={
                      "CSE\nECE\nME\nCE"
                    }
                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />

                  <p className="mt-1 text-xs text-slate-400">
                    Enter one option per
                    line.
                  </p>
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
                      event
                        .target
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
                    Participants must
                    provide this field.
                  </p>
                </div>
              </label>
            </div>

            {/* FIELD MODAL FOOTER */}

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