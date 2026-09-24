import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import RegistrationForm from "./RegistrationForm";

type RegistrationPage = {
  id: string;
  event_id: string | null;
  event_name: string;
  slug: string;
  event_type: "individual" | "team";
  team_member_count: number;
  description: string | null;
  status: "draft" | "published" | "closed";
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

export default async function RegistrationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: registrationPage,
    error: registrationPageError,
  } = await supabase
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
        status
      `
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (registrationPageError) {
    console.error(
      "Registration page loading error:",
      registrationPageError
    );
    notFound();
  }

  if (!registrationPage) {
    notFound();
  }

  const page = registrationPage as RegistrationPage;

  const [
    { data: fields, error: fieldsError },
    { data: event, error: eventError },
  ] = await Promise.all([
    supabase
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
      .eq("registration_page_id", page.id)
      .order("display_order", { ascending: true }),

    page.event_id
      ? supabase
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
          .eq("id", page.event_id)
          .eq("published", true)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (fieldsError) {
    console.error(
      "Registration fields loading error:",
      fieldsError
    );
    notFound();
  }

  if (eventError) {
    console.error(
      "Registration event loading error:",
      eventError
    );
    notFound();
  }

  if (!event) {
    notFound();
  }

  const normalizedFields: RegistrationField[] = (
    fields ?? []
  ).map((field) => ({
    id: field.id,
    registration_page_id: field.registration_page_id,
    field_scope:
      field.field_scope as RegistrationField["field_scope"],
    field_key: field.field_key,
    field_label: field.field_label,
    field_type:
      field.field_type as RegistrationField["field_type"],
    required: field.required,
    options: Array.isArray(field.options) ? field.options : [],
    display_order: field.display_order,
  }));

  const configuredMemberCount =
    page.event_type === "team"
      ? Math.min(
          20,
          Math.max(1, Number(page.team_member_count) || 1)
        )
      : 0;

  return (
    <RegistrationForm
      page={{
        ...page,
        team_member_count: configuredMemberCount,
      }}
      event={event as EventRecord}
      fields={normalizedFields}
    />
  );
}
