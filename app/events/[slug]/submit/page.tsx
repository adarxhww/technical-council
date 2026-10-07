import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import SubmissionForm from "./SubmissionForm";

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

export default async function SubmissionPageRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await createClient();

  const {
    data: submissionPage,
    error: submissionPageError,
  } = await supabase
    .from("submission_pages")
    .select(
      `
        id,
        event_id,
        event_name,
        slug,
        title,
        description,
        instructions,
        status,
        confirmation_message,
        submission_deadline
      `
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (submissionPageError) {
    console.error(
      "Submission page loading error:",
      submissionPageError
    );

    notFound();
  }

  if (!submissionPage) {
    notFound();
  }

  const page = submissionPage as SubmissionPage;

  const [
    { data: fields, error: fieldsError },
    { data: event, error: eventError },
  ] = await Promise.all([
    supabase
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
      .eq("submission_page_id", page.id)
      .eq("enabled", true)
      .order("display_order", {
        ascending: true,
      }),

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
      : Promise.resolve({
          data: null,
          error: null,
        }),
  ]);

  if (fieldsError) {
    console.error(
      "Submission fields loading error:",
      fieldsError
    );

    notFound();
  }

  if (eventError) {
    console.error(
      "Submission event loading error:",
      eventError
    );

    notFound();
  }

  if (!event) {
    notFound();
  }

  const normalizedFields: SubmissionField[] = (
    fields ?? []
  ).map((field) => ({
    id: field.id,
    submission_page_id:
      field.submission_page_id,
    field_key: field.field_key,
    field_label: field.field_label,
    field_type:
      field.field_type as SubmissionField["field_type"],
    required: field.required,
    options: Array.isArray(field.options)
      ? field.options.filter(
          (option): option is string =>
            typeof option === "string"
        )
      : [],
    placeholder:
      field.placeholder ?? null,
    help_text:
      field.help_text ?? null,
    display_order: field.display_order,
    enabled: field.enabled ?? true,
  }));

  return (
    <SubmissionForm
      page={page}
      event={event as EventRecord}
      fields={normalizedFields}
    />
  );
}