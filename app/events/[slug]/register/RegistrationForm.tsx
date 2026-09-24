"use client";

import {
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import Link from "next/link";

import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Loader2,
  MapPin,
  Users,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type EventType = "individual" | "team";

type RegistrationPage = {
  id: string;
  event_id: string | null;
  event_name: string;
  slug: string;
  event_type: EventType;
  description: string | null;
  status: "draft" | "published" | "closed";
  team_member_count: number;
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
  field_type:
    | "text"
    | "number"
    | "email"
    | "phone"
    | "dropdown";
  required: boolean;
  options: string[];
  display_order: number;
};

type EventRecord = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  type: string;
  description: string;
  published: boolean;
};

type Props = {
  page: RegistrationPage;
  event: EventRecord;
  fields: RegistrationField[];
};

type FormValues = Record<string, string>;

type MemberValues = {
  values: FormValues;
};

export default function RegistrationForm({
  page,
  event,
  fields,
}: Props) {
  const supabase = useMemo(() => createClient(), []);

  /*
   * The number of team members is completely controlled by the admin.
   * The public user cannot change this value.
   */
  const configuredMemberCount =
    page.event_type === "team"
      ? Math.min(
          20,
          Math.max(1, Number(page.team_member_count) || 1)
        )
      : 0;

  const [values, setValues] = useState<FormValues>({});
  const [leaderValues, setLeaderValues] =
    useState<FormValues>({});

  const [memberValues, setMemberValues] =
    useState<MemberValues[]>(() =>
      Array.from(
        { length: configuredMemberCount },
        () => ({
          values: {},
        })
      )
    );

  const [confirmationChecked, setConfirmationChecked] =
    useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const individualFields = fields.filter(
    (field) => field.field_scope === "individual"
  );

  const teamFields = fields.filter(
    (field) => field.field_scope === "team"
  );

  const leaderFields = fields.filter(
    (field) => field.field_scope === "team_leader"
  );

  const memberFields = fields.filter(
    (field) => field.field_scope === "team_member"
  );

  function updateValue(key: string, value: string) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateLeaderValue(
    key: string,
    value: string
  ) {
    setLeaderValues((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateMemberValue(
    index: number,
    key: string,
    value: string
  ) {
    setMemberValues((current) =>
      current.map((member, memberIndex) =>
        memberIndex === index
          ? {
              values: {
                ...member.values,
                [key]: value,
              },
            }
          : member
      )
    );
  }

  function validateFields(
    configuredFields: RegistrationField[],
    data: FormValues
  ) {
    for (const field of configuredFields) {
      if (
        field.required &&
        !String(data[field.field_key] ?? "").trim()
      ) {
        return `${field.field_label} is required.`;
      }

      if (
        field.field_type === "email" &&
        data[field.field_key]
      ) {
        const email = data[field.field_key].trim();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return `Please enter a valid ${field.field_label}.`;
        }
      }
    }

    return "";
  }

  async function handleSubmit(
    eventObject: FormEvent<HTMLFormElement>
  ) {
    eventObject.preventDefault();

    if (submitting) return;

    setError("");

    if (!confirmationChecked) {
      setError(
        "Please confirm that the information provided is correct before submitting."
      );
      return;
    }

    if (page.event_type === "individual") {
      const validationError = validateFields(
        individualFields,
        values
      );

      if (validationError) {
        setError(validationError);
        return;
      }
    }

    if (page.event_type === "team") {
      const teamError = validateFields(
        teamFields,
        values
      );

      if (teamError) {
        setError(teamError);
        return;
      }

      const leaderError = validateFields(
        leaderFields,
        leaderValues
      );

      if (leaderError) {
        setError(leaderError);
        return;
      }

      /*
       * Make sure the client-side member array still matches
       * the count configured by the admin.
       */
      if (
        memberValues.length !==
        configuredMemberCount
      ) {
        setError(
          "The team configuration is invalid. Please refresh the page and try again."
        );
        return;
      }

      for (
        let index = 0;
        index < memberValues.length;
        index += 1
      ) {
        const memberError = validateFields(
          memberFields,
          memberValues[index].values
        );

        if (memberError) {
          setError(
            `Member ${index + 1}: ${memberError}`
          );
          return;
        }
      }
    }

    setSubmitting(true);

    try {
      if (page.event_type === "individual") {
        const payload =
          buildIndividualPayload(values);

        const { error: insertError } = await supabase
          .from("individual_registrations")
          .insert({
            registration_page_id: page.id,
            ...payload,
            form_data: values,
          });

        if (insertError) {
          throw new Error(insertError.message);
        }
      } else {
        const teamPayload =
           buildTeamPayload(values, leaderValues);

        const {
          data: teamRegistration,
          error: teamError,
        } = await supabase
          .from("team_registrations")
          .insert({
            registration_page_id: page.id,
            ...teamPayload,
            member_count: configuredMemberCount,
            leader_form_data: leaderValues,
            form_data: values,
          })
          .select("id")
          .single();

        if (teamError) {
          throw new Error(teamError.message);
        }

        if (!teamRegistration) {
          throw new Error(
            "Unable to create team registration."
          );
        }

        const members = memberValues.map(
          (member, index) => ({
            team_registration_id:
              teamRegistration.id,
            member_number: index + 1,
            ...buildMemberPayload(member.values),
            form_data: member.values,
          })
        );

        const { error: membersError } =
          await supabase
            .from("team_members")
            .insert(members);

        if (membersError) {
          throw new Error(membersError.message);
        }
      }

      setSuccess(true);
    } catch (submitError) {
      console.error(
        "Registration submission error:",
        submitError
      );

      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to submit registration."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#f7f9fc] px-5 py-12 text-slate-900 dark:bg-[#07111f] dark:text-white sm:px-8">
        <Background />

        <div className="relative mx-auto flex min-h-[75vh] max-w-2xl items-center justify-center">
          <div className="w-full rounded-[32px] border border-slate-200/80 bg-white/80 p-8 text-center shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70 sm:p-12">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-50 dark:bg-emerald-500/15">
              <CheckCircle2
                size={44}
                className="text-emerald-500"
              />
            </div>

            <h1 className="mt-6 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
              Registration Successful
            </h1>

            <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-500 dark:text-slate-400">
              Your registration for{" "}
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {event.title}
              </span>{" "}
              has been submitted successfully.
            </p>

            <Link
              href="/events"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/10 transition hover:scale-[1.01] hover:from-blue-700 hover:to-emerald-600"
            >
              Back to Events
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f9fc] px-5 pb-20 pt-8 text-slate-900 dark:bg-[#07111f] dark:text-white sm:px-8 lg:pt-12">
      <Background />

      <div className="relative mx-auto max-w-6xl">
        <Link
          href="/events"
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm backdrop-blur-xl transition hover:bg-white hover:text-slate-900 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to Events
        </Link>

        {/* Event Header */}
        <section className="relative overflow-hidden rounded-[34px] border border-white/70 bg-white/65 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.045]">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.08] via-transparent to-emerald-400/[0.08] dark:from-blue-500/[0.12] dark:to-emerald-400/[0.08]" />

          <div className="relative grid gap-0 lg:grid-cols-[1fr_auto]">
            <div className="p-7 sm:p-10 lg:p-12">
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                  {page.event_type === "team" ? (
                    <>
                      <Users size={14} />
                      Team Event
                    </>
                  ) : (
                    "Individual Event"
                  )}
                </span>

                {event.type && (
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-blue-700 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-300">
                    {event.type}
                  </span>
                )}
              </div>

              <h1 className="max-w-4xl text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl lg:text-5xl">
                {event.title}
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-500 dark:text-slate-400 sm:text-base">
                {page.description ||
                  event.description}
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <EventInfo
                  icon={<CalendarDays size={16} />}
                  value={formatDate(event.date)}
                />

                <EventInfo
                  icon={<Clock size={16} />}
                  value={event.time || "Time TBA"}
                />

                <EventInfo
                  icon={<MapPin size={16} />}
                  value={
                    event.location || "Venue TBA"
                  }
                />
              </div>
            </div>
          </div>
        </section>

        {/* Form Heading */}
        <div className="mb-5 mt-8">
          <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">
            Registration Form
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Fill in the details carefully before
            submitting.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          {/* Individual */}
          {page.event_type === "individual" ? (
            <FormSection
              title="Participant Details"
              description="Enter your registration information."
            >
              {individualFields.length > 0 ? (
                <div className="grid gap-5 sm:grid-cols-2">
                  {individualFields.map((field) => (
                    <FieldInput
                      key={field.id}
                      field={field}
                      value={
                        values[field.field_key] ?? ""
                      }
                      onChange={(value) =>
                        updateValue(
                          field.field_key,
                          value
                        )
                      }
                    />
                  ))}
                </div>
              ) : (
                <EmptyFields />
              )}
            </FormSection>
          ) : (
            <>
              {/* Team Details */}
              <FormSection
                title="Team Details"
                description="Provide the basic details of your team."
              >
                {teamFields.length > 0 ? (
                  <div className="grid gap-5 sm:grid-cols-2">
                    {teamFields.map((field) => (
                      <FieldInput
                        key={field.id}
                        field={field}
                        value={
                          values[field.field_key] ??
                          ""
                        }
                        onChange={(value) =>
                          updateValue(
                            field.field_key,
                            value
                          )
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyFields />
                )}
              </FormSection>

              {/* Team Leader */}
              <FormSection
                title="Team Leader"
                description="Enter the leader's information."
              >
                {leaderFields.length > 0 ? (
                  <div className="grid gap-5 sm:grid-cols-2">
                    {leaderFields.map((field) => (
                      <FieldInput
                        key={field.id}
                        field={field}
                        value={
                          leaderValues[
                            field.field_key
                          ] ?? ""
                        }
                        onChange={(value) =>
                          updateLeaderValue(
                            field.field_key,
                            value
                          )
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyFields />
                )}
              </FormSection>

              {/* Team Members */}
              <FormSection
                title="Team Members"
                description={`Enter the information for ${configuredMemberCount} team member${
                  configuredMemberCount === 1
                    ? ""
                    : "s"
                }.`}
              >
                <div className="space-y-5">
                  {memberValues.map(
                    (member, index) => (
                      <div
                        key={index}
                        className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 dark:border-white/10 dark:bg-[#191919]"
                      >
                        {/* Plain number — NO gradient */}
                        <div className="mb-5 flex items-center gap-3">
                          <span className="text-sm font-black text-slate-400 dark:text-slate-500">
                            {index + 1}.
                          </span>

                          <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                              Member {index + 1}
                            </h3>

                            <p className="text-xs text-slate-400 dark:text-slate-500">
                              Participant details
                            </p>
                          </div>
                        </div>

                        {memberFields.length > 0 ? (
                          <div className="grid gap-5 sm:grid-cols-2">
                            {memberFields.map(
                              (field) => (
                                <FieldInput
                                  key={`${index}-${field.id}`}
                                  field={field}
                                  value={
                                    member.values[
                                      field.field_key
                                    ] ?? ""
                                  }
                                  onChange={(value) =>
                                    updateMemberValue(
                                      index,
                                      field.field_key,
                                      value
                                    )
                                  }
                                />
                              )
                            )}
                          </div>
                        ) : (
                          <EmptyFields />
                        )}
                      </div>
                    )
                  )}
                </div>
              </FormSection>
            </>
          )}

          {/* Confirmation */}
          <section className="rounded-[28px] border border-blue-100 bg-blue-50/70 p-5 dark:border-blue-400/15 dark:bg-blue-500/[0.07] sm:p-6">
            <label className="flex cursor-pointer items-start gap-3">
              <span className="relative mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  checked={confirmationChecked}
                  onChange={(eventObject) => {
                    setConfirmationChecked(
                      eventObject.target.checked
                    );

                    if (
                      eventObject.target.checked &&
                      error.includes("confirm")
                    ) {
                      setError("");
                    }
                  }}
                  className="peer sr-only"
                />

                <span className="grid h-5 w-5 place-items-center rounded-md border border-slate-300 bg-white transition peer-checked:border-blue-600 peer-checked:bg-blue-600 dark:border-white/20 dark:bg-slate-900 dark:peer-checked:border-blue-500 dark:peer-checked:bg-blue-600">
                  <Check
                    size={13}
                    strokeWidth={3}
                    className={`text-white transition ${
                      confirmationChecked
                        ? "opacity-100"
                        : "opacity-0"
                    }`}
                  />
                </span>
              </span>

              <span className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                I confirm that the information
                provided above is correct and
                complete. I understand that I am
                responsible for the accuracy of the
                information submitted.
              </span>
            </label>
          </section>

          {/* Error */}
          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-300">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Link
              href="/events"
              className="inline-flex h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-7 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-900"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={
                submitting || !confirmationChecked
              }
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 px-8 text-sm font-bold text-white shadow-lg shadow-blue-500/10 transition hover:from-blue-700 hover:to-emerald-600 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {submitting ? (
                <>
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                  Submitting...
                </>
              ) : (
                "Submit Registration"
              )}
            </button>
          </div>

          {!confirmationChecked && (
            <p className="text-center text-xs text-slate-400 dark:text-slate-500">
              Please confirm the information above
              before submitting.
            </p>
          )}
        </form>
      </div>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* Background                                                                  */
/* -------------------------------------------------------------------------- */

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-blue-400/15 blur-3xl dark:bg-blue-500/10" />

      <div className="absolute right-[-120px] top-[12%] h-[420px] w-[420px] rounded-full bg-emerald-300/15 blur-3xl dark:bg-emerald-500/10" />

      <div className="absolute bottom-[-180px] left-[35%] h-[420px] w-[420px] rounded-full bg-violet-300/10 blur-3xl dark:bg-violet-500/10" />

      <div
        className="absolute inset-0 opacity-[0.35] dark:opacity-[0.12]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15,23,42,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.035) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage:
            "linear-gradient(to bottom, black 0%, transparent 90%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 0%, transparent 90%)",
        }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Form Section                                                                */
/* -------------------------------------------------------------------------- */

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-white/70 bg-white/75 p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.045] sm:p-8">
      <div className="mb-6 flex items-start gap-4">
        <div className="mt-1 h-8 w-1 rounded-full bg-gradient-to-b from-blue-600 to-emerald-500" />

        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-white">
            {title}
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>
      </div>

      {children}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Field Input                                                                  */
/* -------------------------------------------------------------------------- */

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: RegistrationField;
  value: string;
  onChange: (value: string) => void;
}) {
  const commonClass =
    "h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-500/10";

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-200">
        {field.field_label}

        {field.required && (
          <span className="ml-1 text-rose-500">
            *
          </span>
        )}
      </label>

      {field.field_type === "dropdown" ? (
        <div className="relative">
          <select
            value={value}
            onChange={(eventObject) =>
              onChange(eventObject.target.value)
            }
            className={`${commonClass} appearance-none pr-10`}
            required={field.required}
          >
            <option value="">
              Select {field.field_label}
            </option>

            {field.options.map((option) => (
              <option
                key={option}
                value={option}
                className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white"
              >
                {option}
              </option>
            ))}
          </select>

          <ChevronDown
            size={17}
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
        </div>
      ) : (
        <input
          type={
            field.field_type === "email"
              ? "email"
              : field.field_type === "number"
                ? "number"
                : field.field_type === "phone"
                  ? "tel"
                  : "text"
          }
          inputMode={
            field.field_type === "phone"
              ? "tel"
              : undefined
          }
          value={value}
          onChange={(eventObject) =>
            onChange(eventObject.target.value)
          }
          placeholder={`Enter ${field.field_label.toLowerCase()}`}
          className={commonClass}
          required={field.required}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Event Info                                                                   */
/* -------------------------------------------------------------------------- */

function EventInfo({
  icon,
  value,
}: {
  icon: ReactNode;
  value: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300">
      <span className="text-emerald-500">
        {icon}
      </span>

      {value}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty Fields                                                                */
/* -------------------------------------------------------------------------- */

function EmptyFields() {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-500">
      No fields have been configured for this
      section.
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                      */
/* -------------------------------------------------------------------------- */

function formatDate(value: string) {
  if (!value) return "Date TBA";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function buildIndividualPayload(
  values: FormValues
) {
  return {
    name:
      values.name ??
      values.full_name ??
      "",
    branch: values.branch ?? "",
    year: values.year ?? "",
    email: values.email ?? "",
    contact_no:
      values.contact_no ??
      values.phone ??
      "",
  };
}

function buildTeamPayload(
  values: FormValues,
  leaderValues: FormValues
) {
  return {
    team_name: values.team_name ?? "",

    leader_name:
      leaderValues.leader_name ??
      leaderValues.name ??
      leaderValues.full_name ??
      "",

    leader_branch:
      leaderValues.leader_branch ??
      leaderValues.branch ??
      "",

    leader_year:
      leaderValues.leader_year ??
      leaderValues.year ??
      "",

    leader_email:
      leaderValues.leader_email ??
      leaderValues.email ??
      "",

    leader_contact_no:
      leaderValues.leader_contact_no ??
      leaderValues.contact_no ??
      leaderValues.phone ??
      "",
  };
}

function buildMemberPayload(
  values: FormValues
) {
  return {
    name:
      values.member_name ??
      values.name ??
      values.full_name ??
      "",

    branch:
      values.member_branch ??
      values.branch ??
      "",

    year:
      values.member_year ??
      values.year ??
      "",

    email:
      values.member_email ??
      values.email ??
      "",

    contact_no:
      values.member_contact_no ??
      values.contact_no ??
      values.phone ??
      "",
  };
}