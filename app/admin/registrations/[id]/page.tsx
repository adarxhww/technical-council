"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Eye,
  Search,
  Users,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type RegistrationPage = {
  id: string;
  event_id: string | null;
  event_name: string;
  slug: string;
  event_type: "individual" | "team";
  description: string;
  status: "draft" | "published" | "closed";
  team_member_count: number | null;
};

type RegistrationField = {
  id: string;
  registration_page_id: string;
  field_scope:
    | "individual"
    | "team"
    | "team_leader"
    | "team_member";
  field_key: string;
  field_label: string;
  field_type: string;
  required: boolean;
  options: unknown;
  display_order: number;
};

type IndividualRegistration = {
  id: string;
  registration_page_id: string;
  name: string | null;
  branch: string | null;
  year: string | null;
  email: string | null;
  contact_no: string | null;
  form_data: Record<string, unknown> | null;
  created_at: string;
};

type TeamMember = {
  id: string;
  team_registration_id: string;
  name: string | null;
  branch: string | null;
  year: string | null;
  email: string | null;
  contact_no: string | null;
  form_data: Record<string, unknown> | null;
};

type TeamRegistration = {
  id: string;
  registration_page_id: string;
  team_name: string | null;
  leader_name: string | null;
  leader_branch: string | null;
  leader_year: string | null;
  leader_email: string | null;
  leader_contact_no: string | null;
  member_count: number | null;
  form_data: Record<string, unknown> | null;
  leader_form_data: Record<string, unknown> | null;
  created_at: string;
  members: TeamMember[];
};

type DetailRegistration =
  | {
      type: "individual";
      data: IndividualRegistration;
    }
  | {
      type: "team";
      data: TeamRegistration;
    };

function safeValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function formatDate(value: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function escapeCsv(value: unknown) {
  const text = safeValue(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function getFieldValue(
  data: Record<string, unknown> | null | undefined,
  key: string
) {
  if (!data) return "";
  return data[key] ?? "";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isSchemaColumnError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const possible = error as {
    code?: string;
    message?: string;
    details?: string;
    hint?: string;
  };

  const text = [
    possible.code,
    possible.message,
    possible.details,
    possible.hint,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    text.includes("schema cache") ||
    text.includes("could not find") ||
    text.includes("column") ||
    text.includes("does not exist")
  );
}

export default function RegistrationMonitoringPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = createClient();

  const [pageId, setPageId] = useState("");
  const [page, setPage] = useState<RegistrationPage | null>(null);
  const [fields, setFields] = useState<RegistrationField[]>([]);
  const [individualRegistrations, setIndividualRegistrations] =
    useState<IndividualRegistration[]>([]);
  const [teamRegistrations, setTeamRegistrations] = useState<
    TeamRegistration[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [search, setSearch] = useState("");
  const [selectedRegistration, setSelectedRegistration] =
    useState<DetailRegistration | null>(null);

  useEffect(() => {
    params.then((value) => {
      setPageId(value.id);
    });
  }, [params]);

  async function loadData(id: string) {
    setLoading(true);
    setError("");
    setWarning("");

    try {
      let pageData: RegistrationPage | null = null;

      const fullPageResult = await supabase
        .from("registration_pages")
        .select(
          `
            id,
            event_id,
            event_name,
            slug,
            event_type,
            description,
            status,
            team_member_count
          `
        )
        .eq("id", id)
        .single();

      if (!fullPageResult.error) {
        pageData = fullPageResult.data as RegistrationPage;
      } else if (isSchemaColumnError(fullPageResult.error)) {
        const fallbackPageResult = await supabase
          .from("registration_pages")
          .select(
            `
              id,
              event_id,
              event_name,
              slug,
              event_type,
              description,
              status
            `
          )
          .eq("id", id)
          .single();

        if (fallbackPageResult.error) {
          throw fallbackPageResult.error;
        }

        pageData = {
          ...(fallbackPageResult.data as Omit<
            RegistrationPage,
            "team_member_count"
          >),
          team_member_count: null,
        };

        setWarning(
          "Some newer registration configuration fields are not available yet."
        );
      } else {
        throw fullPageResult.error;
      }

      if (!pageData) {
        throw new Error("Registration page could not be found.");
      }

      setPage(pageData);

      const { data: fieldData, error: fieldError } = await supabase
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
        .eq("registration_page_id", id)
        .order("display_order", {
          ascending: true,
        });

      if (fieldError) {
        throw fieldError;
      }

      setFields((fieldData ?? []) as RegistrationField[]);

      const fullIndividualResult = await supabase
        .from("individual_registrations")
        .select(
          `
            id,
            registration_page_id,
            name,
            branch,
            year,
            email,
            contact_no,
            form_data,
            created_at
          `
        )
        .eq("registration_page_id", id)
        .order("created_at", {
          ascending: false,
        });

      let individualData: IndividualRegistration[] | null = null;

      if (!fullIndividualResult.error) {
        individualData = (fullIndividualResult.data ??
          []) as IndividualRegistration[];
      } else if (isSchemaColumnError(fullIndividualResult.error)) {
        const fallbackIndividualResult = await supabase
          .from("individual_registrations")
          .select(
            `
              id,
              registration_page_id,
              name,
              branch,
              year,
              email,
              contact_no,
              created_at
            `
          )
          .eq("registration_page_id", id)
          .order("created_at", {
            ascending: false,
          });

        if (fallbackIndividualResult.error) {
          throw fallbackIndividualResult.error;
        }

        individualData = (fallbackIndividualResult.data ?? []).map(
          (item) => ({
            ...(item as Omit<IndividualRegistration, "form_data">),
            form_data: null,
          })
        );

        setWarning(
          "Custom individual registration responses are not available yet because form_data is not ready in the database. Basic registration information is displayed."
        );
      } else {
        throw fullIndividualResult.error;
      }

      setIndividualRegistrations(individualData ?? []);

      const fullTeamResult = await supabase
        .from("team_registrations")
        .select(
          `
            id,
            registration_page_id,
            team_name,
            leader_name,
            leader_branch,
            leader_year,
            leader_email,
            leader_contact_no,
            member_count,
            form_data,
            leader_form_data,
            created_at
          `
        )
        .eq("registration_page_id", id)
        .order("created_at", {
          ascending: false,
        });

      let teamRows: TeamRegistration[] = [];

      if (!fullTeamResult.error) {
        teamRows = (fullTeamResult.data ?? []).map((team) => ({
          ...(team as Omit<TeamRegistration, "members">),
          members: [],
        }));
      } else if (isSchemaColumnError(fullTeamResult.error)) {
        const fallbackTeamResult = await supabase
          .from("team_registrations")
          .select(
            `
              id,
              registration_page_id,
              team_name,
              leader_name,
              leader_branch,
              leader_year,
              leader_email,
              leader_contact_no,
              member_count,
              created_at
            `
          )
          .eq("registration_page_id", id)
          .order("created_at", {
            ascending: false,
          });

        if (fallbackTeamResult.error) {
          throw fallbackTeamResult.error;
        }

        teamRows = (fallbackTeamResult.data ?? []).map((team) => ({
          ...(team as Omit<
            TeamRegistration,
            "members" | "form_data" | "leader_form_data"
          >),
          form_data: null,
          leader_form_data: null,
          members: [],
        }));

        setWarning(
          "Some custom team response fields are not available yet. Basic team information is displayed."
        );
      } else {
        throw fullTeamResult.error;
      }

      if (teamRows.length > 0) {
        const teamIds = teamRows.map((team) => team.id);

        const fullMemberResult = await supabase
          .from("team_members")
          .select(
            `
              id,
              team_registration_id,
              name,
              branch,
              year,
              email,
              contact_no,
              form_data
            `
          )
          .in("team_registration_id", teamIds);

        let members: TeamMember[] = [];

        if (!fullMemberResult.error) {
          members = (fullMemberResult.data ?? []) as TeamMember[];
        } else if (isSchemaColumnError(fullMemberResult.error)) {
          const fallbackMemberResult = await supabase
            .from("team_members")
            .select(
              `
                id,
                team_registration_id,
                name,
                branch,
                year,
                email,
                contact_no
              `
            )
            .in("team_registration_id", teamIds);

          if (fallbackMemberResult.error) {
            throw fallbackMemberResult.error;
          }

          members = (fallbackMemberResult.data ?? []).map((member) => ({
            ...(member as Omit<TeamMember, "form_data">),
            form_data: null,
          }));

          setWarning(
            "Some custom team-member response fields are not available yet."
          );
        } else {
          throw fullMemberResult.error;
        }

        teamRows.forEach((team) => {
          team.members = members.filter(
            (member) => member.team_registration_id === team.id
          );
        });
      }

      setTeamRegistrations(teamRows);
    } catch (err) {
      console.error("Registration monitoring load error:", err);

      if (err && typeof err === "object" && "message" in err) {
        setError(String((err as { message?: unknown }).message));
      } else {
        setError("Unable to load registrations.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!pageId) return;
    loadData(pageId);
  }, [pageId]);

  const filteredIndividuals = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return individualRegistrations;
    }

    return individualRegistrations.filter((registration) => {
      const customValues = Object.values(registration.form_data ?? {})
        .map(safeValue)
        .join(" ");

      return [
        registration.name,
        registration.branch,
        registration.year,
        registration.email,
        registration.contact_no,
        customValues,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [individualRegistrations, search]);

  const filteredTeams = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return teamRegistrations;
    }

    return teamRegistrations.filter((registration) => {
      const customValues = Object.values(registration.form_data ?? {})
        .map(safeValue)
        .join(" ");

      const leaderValues = Object.values(
        registration.leader_form_data ?? {}
      )
        .map(safeValue)
        .join(" ");

      const memberValues = registration.members
        .map((member) =>
          [
            member.name,
            member.branch,
            member.year,
            member.email,
            member.contact_no,
            Object.values(member.form_data ?? {})
              .map(safeValue)
              .join(" "),
          ]
            .filter(Boolean)
            .join(" ")
        )
        .join(" ");

      return [
        registration.team_name,
        registration.leader_name,
        registration.leader_branch,
        registration.leader_year,
        registration.leader_email,
        registration.leader_contact_no,
        customValues,
        leaderValues,
        memberValues,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [teamRegistrations, search]);

  function downloadCsv() {
    if (!page) return;

    if (page.event_type === "individual") {
      downloadIndividualCsv();
    } else {
      downloadTeamCsv();
    }
  }

  function downloadIndividualCsv() {
  if (!page) return;

  /*
   * All fields configured for an individual registration,
   * in the same order as configured by the admin.
   */
  const individualFields = fields
    .filter((field) => field.field_scope === "individual")
    .sort(
      (a, b) => a.display_order - b.display_order
    );

  /*
   * Standard fields are stored directly in the
   * individual_registrations table.
   *
   * They must NOT also be exported from form_data,
   * otherwise they appear twice in the CSV.
   */
  const standardFieldKeys = new Set([
    "name",
    "full_name",
    "student_name",

    "branch",
    "student_branch",

    "year",
    "student_year",

    "email",
    "student_email",

    "contact_no",
    "contact",
    "phone",
    "phone_no",
    "mobile",
    "mobile_no",
  ]);

  /*
   * Also identify standard fields by their LABEL.
   *
   * This protects against cases where the admin-created
   * field has a different key but a standard label.
   *
   * Example:
   * field_key = "field_abc123"
   * field_label = "Name"
   */
  const standardFieldLabels = new Set([
    "name",
    "full name",
    "student name",

    "branch",
    "student branch",

    "year",
    "student year",

    "email",
    "student email",

    "contact",
    "contact no",
    "contact no.",
    "contact number",

    "phone",
    "phone no",
    "phone no.",
    "phone number",

    "mobile",
    "mobile no",
    "mobile no.",
    "mobile number",
  ]);

  /*
   * Only fields that are genuinely additional/custom
   * should be appended after the standard fields.
   *
   * Example:
   * Semester
   * Roll No.
   * College ID
   * Gender
   * etc.
   */
  const customIndividualFields =
    individualFields.filter((field) => {
      const key = field.field_key
        .trim()
        .toLowerCase();

      const label = field.field_label
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

      return (
        !standardFieldKeys.has(key) &&
        !standardFieldLabels.has(label)
      );
    });

  /*
   * CSV HEADERS
   */
  const headers = [
    "Registration ID",
    "Registered At",
    "Name",
    "Branch",
    "Year",
    "Email",
    "Contact No.",

    /*
     * Dynamic custom fields.
     *
     * If the admin adds:
     * Semester
     * Roll No.
     *
     * the CSV automatically gets:
     * Semester
     * Roll No.
     */
    ...customIndividualFields.map(
      (field) => field.field_label
    ),
  ];

  /*
   * CSV ROWS
   */
  const rows = individualRegistrations.map(
    (registration) => [
      registration.id,
      formatDate(registration.created_at),

      /*
       * Standard fields
       */
      registration.name,
      registration.branch,
      registration.year,
      registration.email,
      registration.contact_no,

      /*
       * Custom fields
       */
      ...customIndividualFields.map((field) =>
        getFieldValue(
          registration.form_data,
          field.field_key
        )
      ),
    ]
  );

  downloadCsvFile(
    headers,
    rows,
    `${slugify(page.event_name)}-registrations.csv`
  );
}

function downloadTeamCsv() {
  if (!page) return;

  /*
   * TEAM CUSTOM FIELDS
   *
   * These are fields configured specifically for the team.
   * Example:
   * - Team Name
   * - Team Category
   *
   * Standard Team Name is already exported separately,
   * so it is excluded here.
   */
  const teamFields = fields
    .filter((field) => field.field_scope === "team")
    .filter((field) => field.field_key !== "team_name")
    .sort((a, b) => a.display_order - b.display_order);

  /*
   * MEMBER FIELDS
   *
   * These come directly from the admin's configured
   * team-member registration fields.
   *
   * Example:
   * Name
   * Roll No.
   * Branch
   * Year
   * Email
   * Contact No.
   */
  const memberFields = fields
    .filter((field) => field.field_scope === "team_member")
    .sort((a, b) => a.display_order - b.display_order);

  /*
   * NUMBER OF MEMBERS
   *
   * Use the number configured by the admin.
   * Also look at existing registrations so that
   * already-submitted members are never accidentally omitted.
   */
  const maxMembers = Math.max(
    page.team_member_count ?? 0,
    ...teamRegistrations.map(
      (team) => team.members.length
    ),
    0
  );

  /*
   * STANDARD MEMBER FIELD MAPPING
   *
   * These are the fields stored directly in the
   * team_members table rather than only inside form_data.
   *
   * We identify them by field_key so that their CSV
   * values remain correct even if their labels change.
   */
  const standardMemberFields = new Set([
    "member_name",
    "member_branch",
    "member_year",
    "member_email",
    "member_contact_no",
  ]);

  /*
   * CUSTOM MEMBER FIELDS
   *
   * Anything configured by the admin that is not one
   * of the five standard fields becomes a dynamic field.
   *
   * Example:
   * Roll No.
   * College ID
   * Gender
   * Department
   * etc.
   */
  const customMemberFields = memberFields.filter(
    (field) =>
      !standardMemberFields.has(field.field_key)
  );

  /*
   * HEADERS
   */
  const headers = [
    "Registration ID",
    "Registered At",
    "Team Name",
    "Leader Name",
    "Leader Branch",
    "Leader Year",
    "Leader Email",
    "Leader Contact No.",

    // Dynamic custom team fields
    ...teamFields.map(
      (field) => field.field_label
    ),

    // Dynamic member fields
    ...Array.from(
      { length: maxMembers },
      (_, memberIndex) => {
        const memberNumber = memberIndex + 1;

        return [
          `Member ${memberNumber} Name`,
          `Member ${memberNumber} Branch`,
          `Member ${memberNumber} Year`,
          `Member ${memberNumber} Email`,
          `Member ${memberNumber} Contact No.`,

          // Any extra fields configured by admin
          ...customMemberFields.map(
            (field) =>
              `Member ${memberNumber} ${field.field_label}`
          ),
        ];
      }
    ).flat(),
  ];

  /*
   * ROWS
   */
  const rows = teamRegistrations.map(
    (registration) => {
      const row: unknown[] = [
        registration.id,
        formatDate(registration.created_at),

        // Standard team information
        registration.team_name,

        // Standard leader information
        registration.leader_name,
        registration.leader_branch,
        registration.leader_year,
        registration.leader_email,
        registration.leader_contact_no,
      ];

      /*
       * CUSTOM TEAM FIELDS
       */
      row.push(
        ...teamFields.map((field) =>
          getFieldValue(
            registration.form_data,
            field.field_key
          )
        )
      );

      /*
       * MEMBER DATA
       */
      for (
        let index = 0;
        index < maxMembers;
        index++
      ) {
        const member =
          registration.members[index];

        /*
         * If this particular registration has fewer
         * members than the configured maximum, leave
         * the corresponding cells empty.
         */
        if (!member) {
          row.push(
            "",
            "",
            "",
            "",
            ""
          );

          row.push(
            ...customMemberFields.map(() => "")
          );

          continue;
        }

        /*
         * Standard member fields
         */
        row.push(
          member.name ?? "",
          member.branch ?? "",
          member.year ?? "",
          member.email ?? "",
          member.contact_no ?? ""
        );

        /*
         * Dynamic custom member fields
         *
         * Example:
         * Member 1 Roll No.
         * Member 1 College ID
         * Member 1 Gender
         */
        row.push(
          ...customMemberFields.map((field) =>
            getFieldValue(
              member.form_data,
              field.field_key
            )
          )
        );
      }

      return row;
    }
  );

  downloadCsvFile(
    headers,
    rows,
    `${slugify(page.event_name)}-team-registrations.csv`
  );
}

  function downloadCsvFile(
    headers: string[],
    rows: unknown[][],
    filename: string
  ) {
    const csv = [
      headers.map(escapeCsv).join(","),
      ...rows.map((row) =>
        row.map(escapeCsv).join(",")
      ),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = filename;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  }

  function openIndividual(registration: IndividualRegistration) {
    setSelectedRegistration({
      type: "individual",
      data: registration,
    });
  }

  function openTeam(registration: TeamRegistration) {
    setSelectedRegistration({
      type: "team",
      data: registration,
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f7fb] px-5 py-8 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1500px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            Loading registrations...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f6f7fb] px-5 py-8 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1500px]">
          <Link
            href="/admin/registrations"
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to Registration Pages
          </Link>

          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
            <p className="font-semibold">
              Unable to load registrations.
            </p>

            <p className="mt-2 break-words">{error}</p>

            <button
              type="button"
              onClick={() => pageId && loadData(pageId)}
              className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!page) {
    return null;
  }

  const totalRegistrations =
    page.event_type === "individual"
      ? individualRegistrations.length
      : teamRegistrations.length;

  const totalParticipants =
    page.event_type === "individual"
      ? individualRegistrations.length
      : teamRegistrations.reduce(
          (total, team) => total + 1 + team.members.length,
          0
        );

  return (
    <div className="min-h-screen bg-[#f6f7fb] px-5 py-8 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1500px]">

        {/* HEADER */}
        <div className="mb-7">
          <Link
            href="/admin/registration-monitoring"
            className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
          >
            <ArrowLeft size={16} />
            Back
          </Link>

          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
                Registration Monitoring
              </p>

              <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                {page.event_name}
              </h1>

              <p className="mt-2 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
                Monitor submitted registrations,
                inspect complete responses, and
                export the event data.
              </p>
            </div>

            <button
              type="button"
              onClick={downloadCsv}
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
              <Download size={17} />
              Export CSV
            </button>
          </div>
        </div>

        {/* WARNING */}
        {warning && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
            {warning}
          </div>
        )}

        {/* STATS */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Registrations
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">
              {totalRegistrations}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Participants
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">
              {totalParticipants}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Registration Type
            </p>

            <p className="mt-2 text-2xl font-bold capitalize text-slate-950 dark:text-white">
              {page.event_type}
            </p>
          </div>
        </div>

        {/* SEARCH */}
        <div className="mb-5">
          <div className="relative max-w-md">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={
                page.event_type === "individual"
                  ? "Search registrations..."
                  : "Search teams, leaders or members..."
              }
              className="
                w-full
                rounded-xl
                border
                border-slate-200
                bg-white
                py-2.5
                pl-10
                pr-4
                text-sm
                text-slate-900
                outline-none
                transition
                placeholder:text-slate-400
                focus:border-blue-400
                focus:ring-4
                focus:ring-blue-500/10
                dark:border-slate-800
                dark:bg-slate-900
                dark:text-slate-100
                dark:placeholder:text-slate-500
                dark:focus:border-blue-500
              "
            />
          </div>
        </div>

        {/* INDIVIDUAL TABLE */}
        {page.event_type === "individual" && (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {filteredIndividuals.length === 0 ? (
              <div className="p-12 text-center">
                <Users
                  size={34}
                  className="mx-auto mb-3 text-slate-300 dark:text-slate-700"
                />

                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  No registrations found
                </p>

                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  Submitted registrations will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60">
                      {[
                        "#",
                        "Name",
                        "Branch",
                        "Year",
                        "Email",
                        "Contact",
                        "Registered",
                        "Action",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className={`px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-400 ${
                            heading === "Action"
                              ? "text-right"
                              : ""
                          }`}
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {filteredIndividuals.map(
                      (registration, index) => (
                        <tr
                          key={registration.id}
                          className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70 dark:border-slate-800 dark:hover:bg-slate-800/40"
                        >
                          <td className="px-5 py-4 text-sm text-slate-400">
                            {index + 1}
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                              {safeValue(registration.name)}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                            {safeValue(registration.branch)}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                            {safeValue(registration.year)}
                          </td>

                          <td className="px-5 py-4">
                            <a
                              href={`mailto:${registration.email}`}
                              className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                            >
                              {safeValue(registration.email)}
                            </a>
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                            {safeValue(registration.contact_no)}
                          </td>

                          <td className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400">
                            {formatDate(registration.created_at)}
                          </td>

                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                openIndividual(registration)
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/70"
                            >
                              <Eye size={14} />
                              View
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TEAM TABLE */}
        {page.event_type === "team" && (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {filteredTeams.length === 0 ? (
              <div className="p-12 text-center">
                <Users
                  size={34}
                  className="mx-auto mb-3 text-slate-300 dark:text-slate-700"
                />

                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  No team registrations found
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60">
                      {[
                        "#",
                        "Team",
                        "Leader",
                        "Email",
                        "Members",
                        "Registered",
                        "Action",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className={`px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-400 ${
                            heading === "Action"
                              ? "text-right"
                              : ""
                          }`}
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {filteredTeams.map(
                      (registration, index) => (
                        <tr
                          key={registration.id}
                          className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70 dark:border-slate-800 dark:hover:bg-slate-800/40"
                        >
                          <td className="px-5 py-4 text-sm text-slate-400">
                            {index + 1}
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                              {safeValue(registration.team_name)}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                              {safeValue(registration.leader_name)}
                            </p>

                            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                              {safeValue(
                                registration.leader_branch
                              )}{" "}
                              ·{" "}
                              {safeValue(
                                registration.leader_year
                              )}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <a
                              href={`mailto:${registration.leader_email}`}
                              className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                            >
                              {safeValue(
                                registration.leader_email
                              )}
                            </a>
                          </td>

                          <td className="px-5 py-4">
                            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                              {registration.members.length}{" "}
                              member
                              {registration.members.length === 1
                                ? ""
                                : "s"}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400">
                            {formatDate(registration.created_at)}
                          </td>

                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => openTeam(registration)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/70"
                            >
                              <Eye size={14} />
                              View
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selectedRegistration && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm dark:bg-black/65"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedRegistration(null);
            }
          }}
        >
          <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-600 dark:text-blue-400">
                  Registration Details
                </p>

                <h2 className="mt-1 text-lg font-bold text-slate-950 dark:text-white">
                  {selectedRegistration.type === "individual"
                    ? safeValue(selectedRegistration.data.name)
                    : safeValue(
                        selectedRegistration.data.team_name
                      )}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRegistration(null)}
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[calc(92vh-90px)] overflow-y-auto p-6">
              {selectedRegistration.type === "individual" && (
                <div className="space-y-6">
                  <DetailSection title="Basic Information">
                    <DetailRow
                      label="Name"
                      value={selectedRegistration.data.name}
                    />
                    <DetailRow
                      label="Branch"
                      value={selectedRegistration.data.branch}
                    />
                    <DetailRow
                      label="Year"
                      value={selectedRegistration.data.year}
                    />
                    <DetailRow
                      label="Email"
                      value={selectedRegistration.data.email}
                    />
                    <DetailRow
                      label="Contact No."
                      value={selectedRegistration.data.contact_no}
                    />
                    <DetailRow
                      label="Registered At"
                      value={formatDate(
                        selectedRegistration.data.created_at
                      )}
                    />
                  </DetailSection>
                </div>
              )}

              {selectedRegistration.type === "team" && (
                <div className="space-y-6">
                  <DetailSection title="Team Information">
                    <DetailRow
                      label="Team Name"
                      value={selectedRegistration.data.team_name}
                    />

                    <DetailRow
                      label="Member Count"
                      value={
                        selectedRegistration.data.member_count ??
                        selectedRegistration.data.members.length
                      }
                    />

                    <DetailRow
                      label="Registered At"
                      value={formatDate(
                        selectedRegistration.data.created_at
                      )}
                    />
                  </DetailSection>

                  <DetailSection title="Team Leader">
                    <DetailRow
                      label="Name"
                      value={selectedRegistration.data.leader_name}
                    />

                    <DetailRow
                      label="Branch"
                      value={selectedRegistration.data.leader_branch}
                    />

                    <DetailRow
                      label="Year"
                      value={selectedRegistration.data.leader_year}
                    />

                    <DetailRow
                      label="Email"
                      value={selectedRegistration.data.leader_email}
                    />

                    <DetailRow
                      label="Contact No."
                      value={
                        selectedRegistration.data.leader_contact_no
                      }
                    />
                  </DetailSection>

                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <Users
                        size={17}
                        className="text-blue-600 dark:text-blue-400"
                      />

                      <h3 className="text-sm font-bold text-slate-950 dark:text-white">
                        Team Members
                      </h3>
                    </div>

                    <div className="space-y-3">
                      {selectedRegistration.data.members.length ===
                      0 ? (
                        <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-400 dark:border-slate-700 dark:text-slate-500">
                          No team members found.
                        </div>
                      ) : (
                        selectedRegistration.data.members.map(
                          (member, index) => (
                            <div
                              key={member.id}
                              className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-800/50"
                            >
                              <div className="mb-4">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                  Member {index + 1}
                                </h4>
                              </div>

                              <div className="grid gap-3 sm:grid-cols-2">
                                <DetailRow
                                  label="Name"
                                  value={member.name}
                                />

                                <DetailRow
                                  label="Branch"
                                  value={member.branch}
                                />

                                <DetailRow
                                  label="Year"
                                  value={member.year}
                                />

                                <DetailRow
                                  label="Email"
                                  value={member.email}
                                />

                                <DetailRow
                                  label="Contact No."
                                  value={member.contact_no}
                                />
                              </div>

                            </div>
                          )
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-3 text-sm font-bold text-slate-950 dark:text-white">
        {title}
      </h3>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:grid-cols-2 dark:border-slate-800 dark:bg-slate-800/50">
        {children}
      </div>
    </section>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-medium text-slate-800 dark:text-slate-200">
        {safeValue(value)}
      </p>
    </div>
  );
}

function CustomFieldsSection({
  title,
  fields,
  values,
}: {
  title: string;
  fields: RegistrationField[];
  values: Record<string, unknown> | null;
}) {
  if (fields.length === 0) {
    return null;
  }

  const sortedFields = [...fields].sort(
    (a, b) => a.display_order - b.display_order
  );

  return (
    <section>
      <h3 className="mb-3 text-sm font-bold text-slate-950 dark:text-white">
        {title}
      </h3>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:grid-cols-2 dark:border-slate-800 dark:bg-slate-800/50">
        {sortedFields.map((field) => (
          <div key={field.id}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {field.field_label}
            </p>

            <p className="mt-1 break-words text-sm font-medium text-slate-800 dark:text-slate-200">
              {safeValue(
                getFieldValue(values, field.field_key)
              )}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}