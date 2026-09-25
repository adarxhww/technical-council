"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CheckCircle2,
  ImagePlus,
  Linkedin,
  Mail,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type SectionKey =
  | "institutional_leadership"
  | "executive_body"
  | "secretaries"
  | "co_secretaries"
  | "general_members";

type TeamMember = {
  id: string;
  name: string;
  role: string;
  team: string;
  year: string;
  email: string;
  photo: string;
  linkedin: string;
  section: SectionKey;
  contact_no?: string | null;
  published: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
};

type MemberForm = {
  name: string;
  role: string;
  team: string;
  year: string;
  email: string;
  photo: string;
  linkedin: string;
  contact_no: string;
  section: SectionKey;
  published: boolean;
};

const SECTION_OPTIONS: {
  value: SectionKey;
  label: string;
  subtitle: string;
}[] = [
  {
    value: "institutional_leadership",
    label: "Institutional Leadership",
    subtitle: "Faculty Administration",
  },
  {
    value: "executive_body",
    label: "Executive Body",
    subtitle: "Final Year Core",
  },
  {
    value: "secretaries",
    label: "Secretaries",
    subtitle: "Core Operations",
  },
  {
    value: "co_secretaries",
    label: "Co-Secretaries",
    subtitle: "Technical Support",
  },
  {
    value: "general_members",
    label: "General Members",
    subtitle: "Active Volunteers",
  },
];

const TEAM_OPTIONS = [
  "Core",
  "Research & Documentation",
  "Development",
  "Media & Design",
  "Management",
  "Finance",
];

const ROLE_OPTIONS = [
  "Director",
  "Technical Council Convenor",
  "Head Secretary",
  "Senior Secretary",
  "Secretary",
  "Co-Secretary",
  "General Member",
];

const YEAR_OPTIONS = [
  "Faculty",
  "Final Year",
  "Third Year",
  "Second Year",
  "First Year",
];

const EMPTY_FORM: MemberForm = {
  name: "",
  role: "",
  team: "",
  year: "",
  email: "",
  photo: "",
  linkedin: "",
  contact_no: "",
  section: "general_members",
  published: false,
};

function getSectionLabel(section: SectionKey) {
  return (
    SECTION_OPTIONS.find((item) => item.value === section)?.label ??
    "General Members"
  );
}

function getSectionSubtitle(section: SectionKey) {
  return (
    SECTION_OPTIONS.find((item) => item.value === section)?.subtitle ??
    "Active Volunteers"
  );
}

function normalizeLinkedIn(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://")
  ) {
    return trimmed;
  }

  if (
    trimmed.startsWith("linkedin.com/") ||
    trimmed.startsWith("www.linkedin.com/")
  ) {
    return `https://${trimmed}`;
  }

  return `https://linkedin.com/in/${trimmed.replace(/^\/+/, "")}`;
}

function isValidEmail(email: string) {
  if (!email.trim()) {
    return true;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function AdminTeamPage() {
  const supabase = useMemo(() => createClient(), []);

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");

  const [sectionFilter, setSectionFilter] = useState<
    "all" | SectionKey
  >("all");

  const [publishedFilter, setPublishedFilter] = useState<
    "all" | "published" | "draft"
  >("all");

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [editingMember, setEditingMember] =
    useState<TeamMember | null>(null);

  const [form, setForm] = useState<MemberForm>(EMPTY_FORM);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function loadMembers() {
    setLoading(true);
    setError("");

    const { data, error: fetchError } = await supabase
      .from("tc_team")
      .select(`
        id,
        name,
        role,
        team,
        year,
        email,
        photo,
        linkedin,
        section,
        contact_no,
        published,
        display_order,
        created_at,
        updated_at
      `)
      .order("section", { ascending: true })
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (fetchError) {
      console.error(
        "Failed to load Technical Council team members:",
        fetchError
      );

      setError(fetchError.message);
      setMembers([]);
      setLoading(false);
      return;
    }

    setMembers((data ?? []) as TeamMember[]);
    setLoading(false);
  }

  useEffect(() => {
    loadMembers();
  }, []);

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return members.filter((member) => {
      const matchesSearch =
        !query ||
        member.name.toLowerCase().includes(query) ||
        member.role.toLowerCase().includes(query) ||
        member.team.toLowerCase().includes(query) ||
        member.year.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query) ||
        (member.contact_no ?? "")
          .toLowerCase()
          .includes(query);

      const matchesSection =
        sectionFilter === "all" ||
        member.section === sectionFilter;

      const matchesPublished =
        publishedFilter === "all" ||
        (publishedFilter === "published" &&
          member.published) ||
        (publishedFilter === "draft" &&
          !member.published);

      return (
        matchesSearch &&
        matchesSection &&
        matchesPublished
      );
    });
  }, [
    members,
    search,
    sectionFilter,
    publishedFilter,
  ]);

  const stats = useMemo(() => {
    const published = members.filter(
      (member) => member.published
    ).length;

    const sectionCounts = SECTION_OPTIONS.reduce(
      (acc, section) => {
        acc[section.value] = members.filter(
          (member) =>
            member.section === section.value
        ).length;

        return acc;
      },
      {} as Record<SectionKey, number>
    );

    return {
      total: members.length,
      published,
      drafts: members.length - published,
      sectionCounts,
    };
  }, [members]);

  function openCreateModal() {
    setEditingMember(null);
    setForm(EMPTY_FORM);
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  }

  function openEditModal(member: TeamMember) {
    setEditingMember(member);

    setForm({
      name: member.name ?? "",
      role: member.role ?? "",
      team: member.team ?? "",
      year: member.year ?? "",
      email: member.email ?? "",
      photo: member.photo ?? "",
      linkedin: member.linkedin ?? "",
      contact_no: member.contact_no ?? "",
      section:
        member.section ?? "general_members",
      published: Boolean(member.published),
    });

    setError("");
    setSuccess("");
    setIsModalOpen(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setIsModalOpen(false);
    setEditingMember(null);
    setForm(EMPTY_FORM);
  }

  function updateForm<K extends keyof MemberForm>(
    key: K,
    value: MemberForm[K]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handlePhotoUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        "Image size must be 5 MB or smaller."
      );
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateForm("photo", reader.result);
        setError("");
      }
    };

    reader.onerror = () => {
      setError(
        "Unable to read the selected image."
      );
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  }

  async function saveMember() {
    setError("");
    setSuccess("");

    const name = form.name.trim();
    const role = form.role.trim();
    const team = form.team.trim();
    const year = form.year.trim();
    const email = form.email.trim();
    const linkedin = normalizeLinkedIn(form.linkedin);
    const contactNo = form.contact_no.trim();

    if (!name) {
      setError("Name is required.");
      return;
    }

    if (!role) {
      setError("Role is required.");
      return;
    }

    if (!isValidEmail(email)) {
      setError(
        "Please enter a valid email address."
      );
      return;
    }

    setSaving(true);

    const basePayload = {
      name,
      role,
      team,
      year,
      email,
      photo: form.photo,
      linkedin,
      section: form.section,

      // Contact number is only applicable
      // to Institutional Leadership.
      contact_no:
        form.section === "institutional_leadership"
          ? contactNo || null
          : null,

      published: form.published,
    };

    if (editingMember) {
      const { data, error: updateError } =
        await supabase
          .from("tc_team")
          .update(basePayload)
          .eq("id", editingMember.id)
          .select(`
            id,
            name,
            role,
            team,
            year,
            email,
            photo,
            linkedin,
            section,
            contact_no,
            published,
            display_order,
            created_at,
            updated_at
          `)
          .single();

      if (updateError) {
        console.error(
          "Failed to update Technical Council team member:",
          updateError
        );

        setError(updateError.message);
        setSaving(false);
        return;
      }

      setMembers((current) =>
        current.map((member) =>
          member.id === editingMember.id
            ? (data as TeamMember)
            : member
        )
      );

      setSuccess(
        "Team member updated successfully."
      );
    } else {
      const nextDisplayOrder =
        members
          .filter(
            (member) =>
              member.section === form.section
          )
          .reduce(
            (highest, member) =>
              Math.max(
                highest,
                member.display_order ?? 0
              ),
            0
          ) + 1;

      const insertPayload = {
        ...basePayload,
        display_order: nextDisplayOrder,
      };

      const { data, error: insertError } =
        await supabase
          .from("tc_team")
          .insert(insertPayload)
          .select(`
            id,
            name,
            role,
            team,
            year,
            email,
            photo,
            linkedin,
            section,
            contact_no,
            published,
            display_order,
            created_at,
            updated_at
          `)
          .single();

      if (insertError) {
        console.error(
          "Failed to create Technical Council team member:",
          insertError
        );

        setError(insertError.message);
        setSaving(false);
        return;
      }

      setMembers((current) => [
        ...current,
        data as TeamMember,
      ]);

      setSuccess(
        "Team member added successfully."
      );
    }

    setSaving(false);

    setTimeout(() => {
      setIsModalOpen(false);
      setEditingMember(null);
      setForm(EMPTY_FORM);
      setSuccess("");
    }, 600);
  }

  async function togglePublished(
    member: TeamMember
  ) {
    setError("");
    setSuccess("");

    const nextPublished = !member.published;

    const { data, error: updateError } =
      await supabase
        .from("tc_team")
        .update({
          published: nextPublished,
        })
        .eq("id", member.id)
        .select(`
          id,
          name,
          role,
          team,
          year,
          email,
          photo,
          linkedin,
          section,
          contact_no,
          published,
          display_order,
          created_at,
          updated_at
        `)
        .single();

    if (updateError) {
      console.error(
        "Failed to update publication status:",
        updateError
      );

      setError(updateError.message);
      return;
    }

    setMembers((current) =>
      current.map((item) =>
        item.id === member.id
          ? (data as TeamMember)
          : item
      )
    );

    setSuccess(
      nextPublished
        ? `${member.name} is now published.`
        : `${member.name} is now hidden.`
    );

    setTimeout(() => setSuccess(""), 2000);
  }

  async function deleteMember(
    member: TeamMember
  ) {
    const confirmed = window.confirm(
      `Delete ${member.name} from the Technical Council team?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    const { error: deleteError } =
      await supabase
        .from("tc_team")
        .delete()
        .eq("id", member.id);

    if (deleteError) {
      console.error(
        "Failed to delete team member:",
        deleteError
      );

      setError(deleteError.message);
      return;
    }

    setMembers((current) =>
      current.filter(
        (item) => item.id !== member.id
      )
    );

    setSuccess(
      `${member.name} was deleted.`
    );

    setTimeout(() => setSuccess(""), 2000);
  }

  async function moveMember(
    member: TeamMember,
    direction: "up" | "down"
  ) {
    const sameSection = members
      .filter(
        (item) => item.section === member.section
      )
      .sort(
        (a, b) =>
          (a.display_order ?? 0) -
          (b.display_order ?? 0)
      );

    const index = sameSection.findIndex(
      (item) => item.id === member.id
    );

    if (index === -1) {
      return;
    }

    const targetIndex =
      direction === "up"
        ? index - 1
        : index + 1;

    if (
      targetIndex < 0 ||
      targetIndex >= sameSection.length
    ) {
      return;
    }

    const target = sameSection[targetIndex];

    const currentOrder =
      member.display_order ?? 0;

    const targetOrder =
      target.display_order ?? 0;

    setError("");

    const firstUpdate = await supabase
      .from("tc_team")
      .update({
        display_order: targetOrder,
      })
      .eq("id", member.id);

    if (firstUpdate.error) {
      setError(firstUpdate.error.message);
      return;
    }

    const secondUpdate = await supabase
      .from("tc_team")
      .update({
        display_order: currentOrder,
      })
      .eq("id", target.id);

    if (secondUpdate.error) {
      setError(secondUpdate.error.message);
      await loadMembers();
      return;
    }

    await loadMembers();
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1500px]">

        {/* HEADER */}
        <div className="mb-8">
          <div className="mb-4">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
            >
              <ArrowLeft size={17} />
              Back to Dashboard
            </Link>
          </div>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700">
                <Users size={14} />
                Team Management
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-slate-950">
                Team
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Manage Technical Council members,
                sections, photos, contact information,
                and public visibility directly from
                Supabase.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-emerald-600 hover:to-blue-700"
            >
              <Plus size={18} />
              Add Team Member
            </button>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <X
              size={18}
              className="mt-0.5 shrink-0"
            />

            <p className="min-w-0 break-words">
              {error}
            </p>

            <button
              type="button"
              onClick={() => setError("")}
              className="ml-auto shrink-0 rounded-lg p-1 hover:bg-red-100"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* SUCCESS */}
        {success && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            <CheckCircle2 size={18} />
            {success}
          </div>
        )}

        {/* STATS */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Members
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-950">
              {stats.total}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Published
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {stats.published}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Drafts / Hidden
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-950">
              {stats.drafts}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Leadership
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-600">
              {
                stats.sectionCounts
                  .institutional_leadership
              }
            </p>
          </div>
        </div>

        {/* SECTION COUNTS */}
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {SECTION_OPTIONS.map((section) => (
            <button
              key={section.value}
              type="button"
              onClick={() =>
                setSectionFilter(section.value)
              }
              className={`rounded-2xl border p-4 text-left transition ${
                sectionFilter === section.value
                  ? "border-blue-300 bg-blue-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {section.label}
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-950">
                {
                  stats.sectionCounts[
                    section.value
                  ]
                }
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {section.subtitle}
              </p>
            </button>
          ))}
        </div>

        {/* FILTERS */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search members..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <select
              value={sectionFilter}
              onChange={(event) =>
                setSectionFilter(
                  event.target.value as
                    | "all"
                    | SectionKey
                )
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-400 focus:bg-white"
            >
              <option value="all">
                All Sections
              </option>

              {SECTION_OPTIONS.map((section) => (
                <option
                  key={section.value}
                  value={section.value}
                >
                  {section.label}
                </option>
              ))}
            </select>

            <select
              value={publishedFilter}
              onChange={(event) =>
                setPublishedFilter(
                  event.target.value as
                    | "all"
                    | "published"
                    | "draft"
                )
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-400 focus:bg-white"
            >
              <option value="all">
                All Status
              </option>

              <option value="published">
                Published
              </option>

              <option value="draft">
                Draft / Hidden
              </option>
            </select>

            <button
              type="button"
              onClick={loadMembers}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* MEMBERS TABLE */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="font-bold text-slate-950">
                Team Members
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Showing{" "}
                {filteredMembers.length} of{" "}
                {members.length} members
              </p>
            </div>

            <BriefcaseBusiness
              size={20}
              className="text-slate-300"
            />
          </div>

          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

                <p className="mt-3 text-sm text-slate-500">
                  Loading team members...
                </p>
              </div>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400">
                <Users size={25} />
              </div>

              <h3 className="mt-4 font-bold text-slate-900">
                No team members found
              </h3>

              <p className="mt-1 max-w-md text-sm text-slate-500">
                {members.length === 0
                  ? "Add your first team member to start managing the public Team page."
                  : "Try changing your search or filters."}
              </p>

              {members.length === 0 && (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:from-emerald-600 hover:to-blue-700"
                >
                  <Plus size={17} />
                  Add Team Member
                </button>
              )}
            </div>
          ) : (
            <>
              {/* DESKTOP */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1100px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-left">
                      <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Member
                      </th>

                      <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Section
                      </th>

                      <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Role
                      </th>
                   
                      <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Year
                      </th>

                      <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Status
                      </th>

                      <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-400">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredMembers.map((member) => (
                      <tr
                        key={member.id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {member.photo ? (
                              <img
                                src={member.photo}
                                alt={member.name}
                                className="h-11 w-11 rounded-xl object-cover ring-1 ring-slate-200"
                              />
                            ) : (
                              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-100 to-blue-100 text-sm font-bold text-slate-700">
                                {member.name
                                  .trim()
                                  .charAt(0)
                                  .toUpperCase() ||
                                  "?"}
                              </div>
                            )}

                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-900">
                                {member.name}
                              </p>

                              {member.email && (
                                <p className="mt-0.5 truncate text-xs text-slate-500">
                                  {member.email}
                                </p>
                              )}

                              {member.section ===
                                "institutional_leadership" &&
                                member.contact_no && (
                                  <p className="mt-0.5 truncate text-xs text-slate-400">
                                    {member.contact_no}
                                  </p>
                                )}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              {getSectionLabel(
                                member.section
                              )}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-400">
                              {getSectionSubtitle(
                                member.section
                              )}
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-sm font-medium text-slate-700">
                            {member.role || "—"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-sm text-slate-600">
                            {member.team || "—"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-sm text-slate-600">
                            {member.year || "—"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() =>
                              togglePublished(member)
                            }
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
                              member.published
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                member.published
                                  ? "bg-emerald-500"
                                  : "bg-slate-400"
                              }`}
                            />

                            {member.published
                              ? "Published"
                              : "Hidden"}
                          </button>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                moveMember(
                                  member,
                                  "up"
                                )
                              }
                              title="Move up"
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            >
                              ↑
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                moveMember(
                                  member,
                                  "down"
                                )
                              }
                              title="Move down"
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            >
                              ↓
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(member)
                              }
                              title="Edit"
                              className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                            >
                              <Pencil size={17} />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                deleteMember(member)
                              }
                              title="Delete"
                              className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE */}
              <div className="divide-y divide-slate-100 lg:hidden">
                {filteredMembers.map((member) => (
                  <div
                    key={member.id}
                    className="p-5"
                  >
                    <div className="flex items-start gap-3">
                      {member.photo ? (
                        <img
                          src={member.photo}
                          alt={member.name}
                          className="h-12 w-12 shrink-0 rounded-xl object-cover ring-1 ring-slate-200"
                        />
                      ) : (
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-100 to-blue-100 font-bold text-slate-700">
                          {member.name
                            .trim()
                            .charAt(0)
                            .toUpperCase() ||
                            "?"}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <h3 className="font-bold text-slate-900">
                              {member.name}
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                              {member.role ||
                                "No role"}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              togglePublished(member)
                            }
                            className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                              member.published
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {member.published
                              ? "Published"
                              : "Hidden"}
                          </button>
                        </div>

                        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                              Section
                            </span>

                            <p className="mt-1 font-medium text-slate-700">
                              {getSectionLabel(
                                member.section
                              )}
                            </p>
                          </div>

                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                              Team
                            </span>

                            <p className="mt-1 text-slate-600">
                              {member.team || "—"}
                            </p>
                          </div>

                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                              Year
                            </span>

                            <p className="mt-1 text-slate-600">
                              {member.year || "—"}
                            </p>
                          </div>

                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                              Email
                            </span>

                            <p className="mt-1 break-all text-slate-600">
                              {member.email || "—"}
                            </p>
                          </div>

                          {member.section ===
                            "institutional_leadership" && (
                            <div>
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Contact No.
                              </span>

                              <p className="mt-1 text-slate-600">
                                {member.contact_no ||
                                  "—"}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              moveMember(
                                member,
                                "up"
                              )
                            }
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                          >
                            ↑ Move Up
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              moveMember(
                                member,
                                "down"
                              )
                            }
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                          >
                            ↓ Move Down
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(member)
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                          >
                            <Pencil size={14} />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              deleteMember(member)
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">

            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  {editingMember
                    ? "Edit Team Member"
                    : "Add Team Member"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {editingMember
                    ? "Update this member's information and public section."
                    : "Add a new member to the Technical Council team."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="overflow-y-auto px-6 py-6">
              {error && (
                <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="grid gap-5 md:grid-cols-2">

                {/* NAME */}
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Full Name *
                  </label>

                  <input
                    value={form.name}
                    onChange={(event) =>
                      updateForm(
                        "name",
                        event.target.value
                      )
                    }
                    placeholder="Full Name"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* SECTION */}
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Public Section *
                  </label>

                  <select
                    value={form.section}
                    onChange={(event) =>
                      updateForm(
                        "section",
                        event.target.value as SectionKey
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  >
                    {SECTION_OPTIONS.map(
                      (section) => (
                        <option
                          key={section.value}
                          value={section.value}
                        >
                          {section.label} —{" "}
                          {section.subtitle}
                        </option>
                      )
                    )}
                  </select>

                  <p className="mt-2 text-xs text-slate-400">
                    This determines which section
                    of the public Team page this
                    member appears in.
                  </p>
                </div>

                {/* ROLE */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Role *
                  </label>

                  <select
                    value={form.role}
                    onChange={(event) =>
                      updateForm(
                        "role",
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">
                      Select role
                    </option>

                    {ROLE_OPTIONS.map((role) => (
                      <option
                        key={role}
                        value={role}
                      >
                        {role}
                      </option>
                    ))}
                  </select>
                </div>

                {/* TEAM */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Team
                  </label>

                  <select
                    value={form.team}
                    onChange={(event) =>
                      updateForm(
                        "team",
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">
                      Select team
                    </option>

                    {TEAM_OPTIONS.map((team) => (
                      <option
                        key={team}
                        value={team}
                      >
                        {team}
                      </option>
                    ))}
                  </select>
                </div>

                {/* YEAR */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Year
                  </label>

                  <select
                    value={form.year}
                    onChange={(event) =>
                      updateForm(
                        "year",
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">
                      Select year
                    </option>

                    {YEAR_OPTIONS.map((year) => (
                      <option
                        key={year}
                        value={year}
                      >
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                {/* EMAIL */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Email
                  </label>

                  <div className="relative">
                    <Mail
                      size={17}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) =>
                        updateForm(
                          "email",
                          event.target.value
                        )
                      }
                      placeholder="name@example.com"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>

                {/* CONTACT NO. — INSTITUTIONAL LEADERSHIP ONLY */}
                {form.section ===
                  "institutional_leadership" && (
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Contact No.
                    </label>

                    <input
                      type="tel"
                      value={form.contact_no}
                      onChange={(event) =>
                        updateForm(
                          "contact_no",
                          event.target.value
                        )
                      }
                      placeholder="+91 XXXXX XXXXX"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                    
                  </div>
                )}

                {/* LINKEDIN */}
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    LinkedIn
                  </label>

                  <div className="relative">
                    <Linkedin
                      size={17}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      value={form.linkedin}
                      onChange={(event) =>
                        updateForm(
                          "linkedin",
                          event.target.value
                        )
                      }
                      placeholder="https://linkedin.com/in/username"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <p className="mt-2 text-xs text-slate-400">
                    You can enter the complete LinkedIn
                    URL or just the username.
                  </p>
                </div>

                {/* PHOTO */}
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Profile Photo
                  </label>

                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        {form.photo ? (
                          <img
                            src={form.photo}
                            alt="Preview"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ImagePlus
                            size={28}
                            className="text-slate-300"
                          />
                        )}
                      </div>

                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={
                            handlePhotoUpload
                          }
                          className="hidden"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            fileInputRef.current?.click()
                          }
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          <Upload size={17} />
                          Upload Photo
                        </button>

                        {form.photo && (
                          <button
                            type="button"
                            onClick={() =>
                              updateForm(
                                "photo",
                                ""
                              )
                            }
                            className="ml-2 inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                          >
                            <Trash2 size={16} />
                            Remove
                          </button>
                        )}

                        <p className="mt-2 text-xs text-slate-400">
                          JPG, PNG, WEBP or other
                          image format. Maximum 5
                          MB.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PUBLISHED */}
                <div className="md:col-span-2">
                  <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <input
                      type="checkbox"
                      checked={form.published}
                      onChange={(event) =>
                        updateForm(
                          "published",
                          event.target.checked
                        )
                      }
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />

                    <span>
                      <span className="block text-sm font-semibold text-slate-800">
                        Publish on public Team page
                      </span>

                      <span className="mt-1 block text-xs leading-5 text-slate-500">
                        When enabled, this member
                        will be visible on the public
                        Team page.
                      </span>
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50/70 px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveMember}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-emerald-600 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Saving...
                  </>
                ) : (
                  <>
                    {editingMember ? (
                      <Pencil size={17} />
                    ) : (
                      <Plus size={17} />
                    )}

                    {editingMember
                      ? "Save Changes"
                      : "Add Member"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}