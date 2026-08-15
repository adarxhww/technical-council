"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Mail,
  Phone,
  Send,
  Sparkles,
  Users,
} from "lucide-react";

/* =========================================================
   REGISTRATION CONFIGURATION
   Change ONLY these values for a new event.
   ========================================================= */

const registrationConfig = {
  eventName: "Fusion !!",

  // Total number of people in the team INCLUDING the Team Leader.
  teamSize: 5,

  // Paste your deployed Google Apps Script Web App URL here.
  googleScriptUrl: "YOUR_GOOGLE_APPS_SCRIPT_URL",
};

/* =========================================================
   TYPES
   ========================================================= */

type TeamMember = {
  name: string;
  branch: string;
  year: string;
};

type FormData = {
  teamName: string;

  teamLeaderName: string;
  teamLeaderEmail: string;
  teamLeaderPhone: string;
  teamLeaderBranch: string;
  teamLeaderYear: string;

  members: TeamMember[];

  confirmation: boolean;
};

/* =========================================================
   HELPERS
   ========================================================= */

function createMembers(count: number): TeamMember[] {
  return Array.from({ length: count }, () => ({
    name: "",
    branch: "",
    year: "",
  }));
}

function createInitialForm(): FormData {
  return {
    teamName: "",

    teamLeaderName: "",
    teamLeaderEmail: "",
    teamLeaderPhone: "",
    teamLeaderBranch: "",
    teamLeaderYear: "",

    // Team size includes the leader.
    // Therefore only teamSize - 1 additional members are shown.
    members: createMembers(
      Math.max(registrationConfig.teamSize - 1, 0)
    ),

    confirmation: false,
  };
}

/* =========================================================
   INPUT COMPONENT
   ========================================================= */

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = true,
  icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  required?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
        {label}
        {required && <span className="ml-1 text-emerald-500">*</span>}
      </span>

      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
            {icon}
          </div>
        )}

        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className={`w-full rounded-2xl border border-slate-200/80 bg-white/75 px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-white/[0.055] dark:text-white dark:placeholder:text-slate-600 dark:focus:border-white/25 dark:focus:ring-white/5 ${
            icon ? "pl-11" : ""
          }`}
        />
      </div>
    </label>
  );
}

/* =========================================================
   SELECT COMPONENT
   ========================================================= */

function SelectField({
  label,
  value,
  onChange,
  options,
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
        {label}
        {required && <span className="ml-1 text-emerald-500">*</span>}
      </span>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full rounded-2xl border border-slate-200/80 bg-white/75 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-[#151515] dark:text-white dark:focus:border-white/25"
      >
        <option value="">Select {label.toLowerCase()}</option>

        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

/* =========================================================
   PAGE
   ========================================================= */

export default function RegisterPage() {
  const [form, setForm] = useState<FormData>(createInitialForm());

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [registrationId, setRegistrationId] = useState("");

  const [error, setError] = useState("");

  const [submitted, setSubmitted] = useState(false);

  const additionalMemberCount = useMemo(
    () => Math.max(registrationConfig.teamSize - 1, 0),
    []
  );

  /* =======================================================
     UPDATE LEADER FIELD
     ======================================================= */

  function updateLeader(
    field:
      | "teamLeaderName"
      | "teamLeaderEmail"
      | "teamLeaderPhone"
      | "teamLeaderBranch"
      | "teamLeaderYear",
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  /* =======================================================
     UPDATE MEMBER
     ======================================================= */

  function updateMember(
    index: number,
    field: keyof TeamMember,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,

      members: previous.members.map((member, memberIndex) =>
        memberIndex === index
          ? {
              ...member,
              [field]: value,
            }
          : member
      ),
    }));
  }

  /* =======================================================
     SUBMIT
     ======================================================= */

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    /* -------------------------------------------------------
       Check Google Script URL
       ------------------------------------------------------- */

    if (
      !registrationConfig.googleScriptUrl ||
      registrationConfig.googleScriptUrl ===
        "YOUR_GOOGLE_APPS_SCRIPT_URL"
    ) {
      setError(
        "Registration is not connected to Google Sheets yet. Please add your Google Apps Script Web App URL."
      );

      return;
    }

    /* -------------------------------------------------------
       Check team members
       ------------------------------------------------------- */

    const incompleteMember = form.members.some(
      (member) =>
        !member.name.trim() ||
        !member.branch.trim() ||
        !member.year.trim()
    );

    if (incompleteMember) {
      setError(
        "Please complete the details of every team member."
      );

      return;
    }

    /* -------------------------------------------------------
       Submit
       ------------------------------------------------------- */

    setIsSubmitting(true);

    try {
      const payload = {
        event: registrationConfig.eventName,

        teamSize: registrationConfig.teamSize,

        teamName: form.teamName,

        teamLeaderName: form.teamLeaderName,
        teamLeaderEmail: form.teamLeaderEmail,
        teamLeaderPhone: form.teamLeaderPhone,
        teamLeaderBranch: form.teamLeaderBranch,
        teamLeaderYear: form.teamLeaderYear,

        members: form.members,

        submittedAt: new Date().toISOString(),
      };

      const response = await fetch(
        registrationConfig.googleScriptUrl,
        {
          method: "POST",

          headers: {
            "Content-Type": "text/plain;charset=utf-8",
          },

          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(
          result.error || "Registration failed."
        );
      }

      setRegistrationId(
        result.registrationId || "TC-REGISTRATION"
      );

      setSubmitted(true);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (submitError) {
      console.error(submitError);

      setError(
        "Something went wrong while submitting your registration. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  /* =======================================================
     SUCCESS SCREEN
     ======================================================= */

  if (submitted) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#f7f9fc] px-5 py-10 text-[#101828] dark:bg-[#080808] dark:text-white sm:py-16">
        {/* Background */}
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute left-[-180px] top-[80px] h-[420px] w-[420px] rounded-full bg-blue-200/30 blur-[120px] dark:bg-white/[0.025]" />

          <div className="absolute right-[-180px] top-[220px] h-[480px] w-[480px] rounded-full bg-violet-200/25 blur-[130px] dark:bg-white/[0.02]" />

          <div className="absolute bottom-[-180px] left-[30%] h-[420px] w-[420px] rounded-full bg-emerald-100/30 blur-[120px] dark:bg-white/[0.02]" />
        </div>

        <div className="mx-auto flex min-h-[80vh] max-w-2xl items-center justify-center">
          <div className="w-full rounded-[32px] border border-white/80 bg-white/70 p-7 text-center shadow-[0_25px_80px_rgba(60,70,120,0.12)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.055] dark:shadow-[0_25px_80px_rgba(0,0,0,0.5)] sm:p-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[26px] bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400">
              <CheckCircle2 size={42} strokeWidth={1.7} />
            </div>

            <p className="mt-7 text-xs font-bold tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
              REGISTRATION SUCCESSFUL
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              You're all set!
            </h1>

            <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
              Your team has been successfully registered for{" "}
              <span className="font-semibold text-slate-800 dark:text-white">
                {registrationConfig.eventName}
              </span>
              .
            </p>

            <div className="mx-auto mt-7 max-w-sm rounded-2xl border border-slate-200/80 bg-slate-50/80 p-5 dark:border-white/10 dark:bg-white/[0.04]">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Registration ID
              </p>

              <p className="mt-2 break-all text-lg font-bold tracking-wide text-slate-900 dark:text-white">
                {registrationId}
              </p>
            </div>

            <p className="mt-6 text-xs leading-5 text-slate-400">
              Please save your Registration ID for future reference.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/events"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white shadow-xl transition hover:-translate-y-0.5 dark:bg-white dark:text-black"
              >
                Back to Events
                <ArrowRight size={16} />
              </Link>

              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/70 px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/[0.055] dark:text-slate-200 dark:hover:bg-white/[0.09]"
              >
                Home
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* =======================================================
     MAIN FORM
     ======================================================= */

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f9fc] px-4 py-7 text-[#101828] dark:bg-[#080808] dark:text-white sm:px-6 sm:py-10">
      {/* =====================================================
          BACKGROUND
          ===================================================== */}

      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[-180px] top-[70px] h-[420px] w-[420px] rounded-full bg-blue-200/35 blur-[120px] dark:bg-white/[0.025]" />

        <div className="absolute right-[-180px] top-[220px] h-[480px] w-[480px] rounded-full bg-violet-200/30 blur-[130px] dark:bg-white/[0.02]" />

        <div className="absolute bottom-[-180px] left-[30%] h-[420px] w-[420px] rounded-full bg-emerald-100/35 blur-[120px] dark:bg-white/[0.02]" />
      </div>

      <div className="mx-auto max-w-5xl">
        {/* ===================================================
            TOP NAV
            =================================================== */}

        <div className="mb-7 flex items-center justify-between">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/[0.055] dark:text-slate-300 dark:hover:bg-white/[0.09]"
          >
            <ArrowLeft size={16} />
            Events
          </Link>

          <span className="hidden items-center gap-2 text-xs font-semibold text-slate-400 sm:flex">
            <Sparkles
              size={14}
              className="text-emerald-500"
            />
            Technical Council
          </span>
        </div>

        {/* ===================================================
            HERO
            =================================================== */}

        <div className="mb-8 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.055] dark:text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.7)]" />
            Event Registration
          </div>

          <h1 className="mt-5 text-4xl font-bold tracking-[-0.04em] sm:text-5xl lg:text-6xl">
            Register for{" "}
            <span className="bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
              {registrationConfig.eventName}
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400 sm:text-base">
            Enter your team details carefully. Your registration will be
            submitted directly to the Technical Council.
          </p>
        </div>

        {/* ===================================================
            FORM CARD
            =================================================== */}

        <form onSubmit={handleSubmit}>
          <div className="rounded-[32px] border border-white/80 bg-white/65 p-5 shadow-[0_25px_80px_rgba(60,70,120,0.10)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.055] dark:shadow-[0_25px_80px_rgba(0,0,0,0.5)] sm:p-8 lg:p-10">
            {/* =================================================
                EVENT INFO
                ================================================= */}

            <section>
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
                  <Sparkles size={19} />
                </div>

                <div>
                  <p className="text-xs font-bold tracking-[0.16em] text-blue-600 dark:text-blue-400">
                    EVENT
                  </p>

                  <h2 className="text-xl font-bold">
                    {registrationConfig.eventName}
                  </h2>
                </div>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 dark:border-white/10 dark:bg-white/[0.035]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Team size
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-800 dark:text-white">
                      {registrationConfig.teamSize}{" "}
                      {registrationConfig.teamSize === 1
                        ? "person"
                        : "people"}
                    </p>
                  </div>

                  <Users
                    size={22}
                    className="text-blue-500"
                  />
                </div>
              </div>
            </section>

            <div className="my-9 h-px bg-slate-200/70 dark:bg-white/10" />

            {/* =================================================
                TEAM DETAILS
                ================================================= */}

            <section>
              <div className="mb-6">
                <p className="text-xs font-bold tracking-[0.16em] text-violet-600 dark:text-violet-400">
                  TEAM
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  Team details
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Tell us about your team.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field
                    label="Team Name"
                    value={form.teamName}
                    onChange={(value) =>
                      setForm((previous) => ({
                        ...previous,
                        teamName: value,
                      }))
                    }
                    placeholder="Enter your team name"
                  />
                </div>
              </div>
            </section>

            <div className="my-9 h-px bg-slate-200/70 dark:bg-white/10" />

            {/* =================================================
                TEAM LEADER
                ================================================= */}

            <section>
              <div className="mb-6">
                <p className="text-xs font-bold tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
                  TEAM LEADER
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  Team Leader details
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  The Team Leader will be the primary contact for this
                  registration.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Team Leader Name"
                  value={form.teamLeaderName}
                  onChange={(value) =>
                    updateLeader(
                      "teamLeaderName",
                      value
                    )
                  }
                  placeholder="Enter Team Leader Name"
                />

                <Field
                  label="Team Leader Email"
                  type="email"
                  value={form.teamLeaderEmail}
                  onChange={(value) =>
                    updateLeader(
                      "teamLeaderEmail",
                      value
                    )
                  }
                  placeholder="leader@example.com"
                  icon={<Mail size={17} />}
                />

                <Field
                  label="Team Leader Phone Number"
                  type="tel"
                  value={form.teamLeaderPhone}
                  onChange={(value) =>
                    updateLeader(
                      "teamLeaderPhone",
                      value
                    )
                  }
                  placeholder="Enter phone number"
                  icon={<Phone size={17} />}
                />

                <SelectField
                  label="Branch / Department"
                  value={form.teamLeaderBranch}
                  onChange={(value) =>
                    updateLeader(
                      "teamLeaderBranch",
                      value
                    )
                  }
                  options={[
                    "Computer Science & Engineering",
                    "Information Technology",
                    "Electronics Engineering",
                    "Electrical Engineering",
                    "Mechanical Engineering",
                    "Civil Engineering",
                    "Other",
                  ]}
                />

                <SelectField
                  label="Year"
                  value={form.teamLeaderYear}
                  onChange={(value) =>
                    updateLeader(
                      "teamLeaderYear",
                      value
                    )
                  }
                  options={[
                    "1st Year",
                    "2nd Year",
                    "3rd Year",
                    "4th Year",
                  ]}
                />
              </div>
            </section>

            {/* =================================================
                TEAM MEMBERS
                ================================================= */}

            {additionalMemberCount > 0 && (
              <>
                <div className="my-9 h-px bg-slate-200/70 dark:bg-white/10" />

                <section>
                  <div className="mb-6">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold tracking-[0.16em] text-blue-600 dark:text-blue-400">
                          TEAM MEMBERS
                        </p>

                        <h2 className="mt-1 text-2xl font-bold">
                          Team member details
                        </h2>
                      </div>

                      <div className="hidden rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500 dark:bg-white/[0.06] dark:text-slate-400 sm:block">
                        {registrationConfig.teamSize} total
                      </div>
                    </div>

                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      Enter the details of the remaining{" "}
                      {additionalMemberCount}{" "}
                      {additionalMemberCount === 1
                        ? "member"
                        : "members"}{" "}
                      of your team.
                    </p>
                  </div>

                  <div className="space-y-5">
                    {form.members.map((member, index) => (
                      <div
                        key={index}
                        className="rounded-3xl border border-slate-200/70 bg-white/45 p-5 dark:border-white/10 dark:bg-white/[0.025]"
                      >
                        <div className="mb-5 flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-xs font-bold text-white dark:bg-white dark:text-black">
                            {index + 1}
                          </div>

                          <div>
                            <h3 className="text-sm font-bold">
                              Team Member {index + 1}
                            </h3>

                            <p className="text-xs text-slate-400">
                              Member details
                            </p>
                          </div>
                        </div>

                        <div className="grid gap-5 sm:grid-cols-3">
                          <Field
                            label="Member Name"
                            value={member.name}
                            onChange={(value) =>
                              updateMember(
                                index,
                                "name",
                                value
                              )
                            }
                            placeholder="Enter member name"
                          />

                          <SelectField
                            label="Branch / Department"
                            value={member.branch}
                            onChange={(value) =>
                              updateMember(
                                index,
                                "branch",
                                value
                              )
                            }
                            options={[
                              "Computer Science & Engineering",
                              "Information Technology",
                              "Electronics Engineering",
                              "Electrical Engineering",
                              "Mechanical Engineering",
                              "Civil Engineering",
                              "Other",
                            ]}
                          />

                          <SelectField
                            label="Year"
                            value={member.year}
                            onChange={(value) =>
                              updateMember(
                                index,
                                "year",
                                value
                              )
                            }
                            options={[
                              "1st Year",
                              "2nd Year",
                              "3rd Year",
                              "4th Year",
                            ]}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}

            {/* =================================================
                CONFIRMATION
                ================================================= */}

            <div className="my-9 h-px bg-slate-200/70 dark:bg-white/10" />

            <section>
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200/70 bg-white/45 p-4 transition hover:bg-white/70 dark:border-white/10 dark:bg-white/[0.025] dark:hover:bg-white/[0.05]">
                <input
                  type="checkbox"
                  checked={form.confirmation}
                  onChange={(e) =>
                    setForm((previous) => ({
                      ...previous,
                      confirmation: e.target.checked,
                    }))
                  }
                  required
                  className="mt-0.5 h-4 w-4 accent-emerald-500"
                />

                <span className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                  I confirm that the information provided above is
                  correct and that I am registering my team for{" "}
                  <strong className="text-slate-900 dark:text-white">
                    {registrationConfig.eventName}
                  </strong>
                  .
                </span>
              </label>
            </section>

            {/* =================================================
                ERROR
                ================================================= */}

            {error && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-600 dark:border-red-400/20 dark:bg-red-400/[0.06] dark:text-red-300">
                {error}
              </div>
            )}

            {/* =================================================
                SUBMIT
                ================================================= */}

            <div className="mt-7">
              <button
                type="submit"
                disabled={isSubmitting}
                className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 text-sm font-bold text-white shadow-xl shadow-slate-900/15 transition duration-300 hover:-translate-y-0.5 hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-black dark:shadow-black/30"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-black/20 dark:border-t-black" />
                    Submitting Registration...
                  </>
                ) : (
                  <>
                    <Send size={17} />
                    Submit Registration
                    <ChevronRight
                      size={17}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </>
                )}
              </button>
            </div>

            <p className="mt-4 text-center text-[11px] leading-5 text-slate-400">
              Your registration details will be securely submitted to the
              Technical Council registration database.
            </p>
          </div>
        </form>

        {/* ===================================================
            FOOTER
            =================================================== */}

        <div className="py-8 text-center">
          <p className="text-xs text-slate-400">
            Technical Council · Rajkiya Engineering College,
            Ambedkar Nagar
          </p>
        </div>
      </div>
    </main>
  );
}