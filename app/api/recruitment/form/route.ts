import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { supabaseAdmin } from "@/lib/supabase/admin";

const ALLOWED_STATUSES = [
  "open",
  "upcoming",
  "closed",
] as const;

const ALLOWED_FIELD_TYPES = [
  "text",
  "textarea",
  "email",
  "tel",
  "number",
  "select",
  "radio",
  "checkbox",
  "multiselect",
  "file",
] as const;

type AllowedStatus =
  (typeof ALLOWED_STATUSES)[number];

type AllowedFieldType =
  (typeof ALLOWED_FIELD_TYPES)[number];

type CleanedField = {
  id: string | null;
  form_id: string;
  field_key: string;
  label: string;
  field_type: AllowedFieldType;
  required: boolean;
  placeholder: string | null;
  help_text: string | null;
  options: unknown[];
  validation: Record<string, unknown>;
  display_order: number;
  enabled: boolean;
  system_field: boolean;
  updated_at: string;
};

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

async function getAuthenticatedAdmin() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },

        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(
              ({
                name,
                value,
                options,
              }) => {
                cookieStore.set(
                  name,
                  value,
                  options
                );
              }
            );
          } catch {
            /*
             * Cookie updates can fail from a
             * Server Component/Route Handler.
             *
             * Middleware handles session refresh.
             */
          }
        },
      },
    }
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  /*
   * First try the authenticated user's ID.
   */
  const {
    data: adminById,
    error: adminByIdError,
  } = await supabaseAdmin
    .from("admin_profiles")
    .select("id, email, status")
    .eq("id", user.id)
    .maybeSingle();

  if (
    !adminByIdError &&
    adminById &&
    adminById.status === "active"
  ) {
    return user;
  }

  /*
   * Fallback to email.
   */
  if (user.email) {
    const {
      data: adminByEmail,
      error: adminByEmailError,
    } = await supabaseAdmin
      .from("admin_profiles")
      .select("id, email, status")
      .eq("email", user.email)
      .maybeSingle();

    if (
      !adminByEmailError &&
      adminByEmail &&
      adminByEmail.status === "active"
    ) {
      return user;
    }
  }

  return null;
}

/*
|--------------------------------------------------------------------------
| PUBLIC GET
|--------------------------------------------------------------------------
|
| Used by the public Technical Council Join Modal.
|
*/

export async function GET() {
  try {
    const {
      data: form,
      error: formError,
    } = await supabaseAdmin
      .from("recruitment_form")
      .select(
        `
          id,
          form_key,
          status,
          title,
          description,
          notice,
          success_message,
          resume_enabled,
          resume_required,
          resume_max_size_mb,
          allowed_resume_types
        `
      )
      .eq(
        "form_key",
        "technical_council_application"
      )
      .maybeSingle();

    if (formError) {
      console.error(
        "Failed to load recruitment form:",
        formError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Failed to load application form.",
        },
        { status: 500 }
      );
    }

    if (!form) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Technical Council application form has not been configured yet.",
        },
        { status: 404 }
      );
    }

    const {
      data: fields,
      error: fieldsError,
    } = await supabaseAdmin
      .from("recruitment_form_fields")
      .select(
        `
          id,
          field_key,
          label,
          field_type,
          required,
          placeholder,
          help_text,
          options,
          validation,
          display_order,
          enabled,
          system_field
        `
      )
      .eq("form_id", form.id)
      .eq("enabled", true)
      .order("display_order", {
        ascending: true,
      });

    if (fieldsError) {
      console.error(
        "Failed to load recruitment form fields:",
        fieldsError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Failed to load application form fields.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      form,
      fields: fields || [],
    });
  } catch (error) {
    console.error(
      "Recruitment form GET error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to load application form.",
      },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| ADMIN PUT
|--------------------------------------------------------------------------
|
| Updates the Technical Council application form
| and its fields.
|
*/

export async function PUT(
  request: Request
) {
  try {
    /*
     * -------------------------------------------------------
     * Authenticate admin
     * -------------------------------------------------------
     */

    const admin =
      await getAuthenticatedAdmin();

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unauthorized. Please log in again.",
        },
        { status: 401 }
      );
    }

    /*
     * -------------------------------------------------------
     * Read request
     * -------------------------------------------------------
     */

    const body = await request.json();

    const incomingForm = body?.form;
    const incomingFields = body?.fields;

    if (
      !incomingForm ||
      !Array.isArray(incomingFields)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid form data.",
        },
        { status: 400 }
      );
    }

    /*
     * -------------------------------------------------------
     * Validate form status
     * -------------------------------------------------------
     */

    if (
      !ALLOWED_STATUSES.includes(
        incomingForm.status as AllowedStatus
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid recruitment status.",
        },
        { status: 400 }
      );
    }

    /*
     * -------------------------------------------------------
     * Validate form ID
     * -------------------------------------------------------
     */

    const formId =
      typeof incomingForm.id === "string"
        ? incomingForm.id.trim()
        : "";

    if (!formId || !isValidUuid(formId)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid recruitment form ID.",
        },
        { status: 400 }
      );
    }

    /*
     * -------------------------------------------------------
     * Normalize resume settings
     * -------------------------------------------------------
     */

    const resumeMaxSize =
      Number(
        incomingForm.resume_max_size_mb
      ) || 5;

    const allowedResumeTypes =
      Array.isArray(
        incomingForm.allowed_resume_types
      )
        ? incomingForm.allowed_resume_types
            .map((type: unknown) =>
              String(type)
                .trim()
                .toLowerCase()
                .replace(/^\./, "")
            )
            .filter(Boolean)
        : ["pdf"];

    const finalResumeTypes =
      allowedResumeTypes.length > 0
        ? allowedResumeTypes
        : ["pdf"];

    /*
     * -------------------------------------------------------
     * Update main form
     * -------------------------------------------------------
     */

    const {
      data: updatedForm,
      error: formError,
    } = await supabaseAdmin
      .from("recruitment_form")
      .update({
        status: incomingForm.status,

        title:
          typeof incomingForm.title ===
          "string"
            ? incomingForm.title.trim()
            : "",

        description:
          typeof incomingForm.description ===
          "string"
            ? incomingForm.description
            : "",

        notice:
          incomingForm.notice == null ||
          incomingForm.notice === ""
            ? null
            : String(
                incomingForm.notice
              ),

        success_message:
          incomingForm.success_message ==
            null ||
          incomingForm.success_message ===
            ""
            ? "Application submitted successfully!"
            : String(
                incomingForm.success_message
              ),

        resume_enabled:
          Boolean(
            incomingForm.resume_enabled
          ),

        resume_required:
          Boolean(
            incomingForm.resume_required
          ),

        resume_max_size_mb:
          resumeMaxSize,

        allowed_resume_types:
          finalResumeTypes,

        updated_at:
          new Date().toISOString(),
      })
      .eq("id", formId)
      .select("id")
      .maybeSingle();

    if (formError) {
      console.error(
        "Failed to update recruitment form:",
        formError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            `Failed to update form: ${formError.message}`,
        },
        { status: 500 }
      );
    }

    if (!updatedForm) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The recruitment form could not be found.",
        },
        { status: 404 }
      );
    }

    /*
     * -------------------------------------------------------
     * Validate and clean fields
     * -------------------------------------------------------
     */

    let cleanedFields: CleanedField[];

    try {
      cleanedFields =
        incomingFields.map(
          (
            field: any,
            index: number
          ) => {
            const fieldKey =
              typeof field.field_key ===
              "string"
                ? field.field_key.trim()
                : "";

            const label =
              typeof field.label ===
              "string"
                ? field.label.trim()
                : "";

            const fieldType =
              field.field_type as AllowedFieldType;

            if (!fieldKey) {
              throw new Error(
                `Field ${
                  index + 1
                } is missing a field key.`
              );
            }

            if (!label) {
              throw new Error(
                `Field ${
                  index + 1
                } is missing a label.`
              );
            }

            if (
              !ALLOWED_FIELD_TYPES.includes(
                fieldType
              )
            ) {
              throw new Error(
                `Invalid field type for "${label}".`
              );
            }

            /*
             * IMPORTANT:
             *
             * Only a real PostgreSQL UUID is treated
             * as an existing database field.
             *
             * Examples:
             *
             * ""                         -> null
             * "new-abc..."               -> null
             * valid UUID                 -> UUID
             */
            const rawId =
              typeof field.id === "string"
                ? field.id.trim()
                : "";

            const databaseId =
              rawId &&
              isValidUuid(rawId)
                ? rawId
                : null;

            return {
              id: databaseId,

              form_id: formId,

              field_key: fieldKey,

              label,

              field_type: fieldType,

              required:
                Boolean(
                  field.required
                ),

              placeholder:
                field.placeholder == null
                  ? null
                  : String(
                      field.placeholder
                    ),

              help_text:
                field.help_text == null
                  ? null
                  : String(
                      field.help_text
                    ),

              options:
                Array.isArray(
                  field.options
                )
                  ? field.options
                  : [],

              validation:
                field.validation &&
                typeof field.validation ===
                  "object" &&
                !Array.isArray(
                  field.validation
                )
                  ? field.validation
                  : {},

              display_order: index,

              enabled:
                field.enabled !== false,

              system_field:
                Boolean(
                  field.system_field
                ),

              updated_at:
                new Date().toISOString(),
            };
          }
        );
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Invalid field configuration.",
        },
        { status: 400 }
      );
    }

    /*
     * -------------------------------------------------------
     * Validate unique field keys
     * -------------------------------------------------------
     */

    const fieldKeys =
      cleanedFields.map(
        (field) => field.field_key
      );

    if (
      new Set(fieldKeys).size !==
      fieldKeys.length
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Each form field must have a unique field key.",
        },
        { status: 400 }
      );
    }

    /*
     * -------------------------------------------------------
     * Load existing fields
     * -------------------------------------------------------
     */

    const {
      data: existingFields,
      error: existingError,
    } = await supabaseAdmin
      .from("recruitment_form_fields")
      .select("id, field_key")
      .eq("form_id", formId);

    if (existingError) {
      console.error(
        "Failed to load existing fields:",
        existingError
      );

      throw new Error(
        `Failed to load existing form fields: ${existingError.message}`
      );
    }

    const existing =
      existingFields || [];

    /*
     * -------------------------------------------------------
     * Validate incoming existing IDs
     * -------------------------------------------------------
     *
     * An ID from the browser must actually belong
     * to this form.
     *
     * This prevents accidental updates to another
     * recruitment form's fields.
     * -------------------------------------------------------
     */

    const existingIds = new Set(
      existing.map(
        (field) => field.id
      )
    );

    const invalidExistingIds =
      cleanedFields
        .filter(
          (field) => field.id !== null
        )
        .filter(
          (field) =>
            !existingIds.has(
              field.id as string
            )
        );

    if (
      invalidExistingIds.length > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "One or more form fields could not be matched to this application form.",
        },
        { status: 400 }
      );
    }

    /*
     * -------------------------------------------------------
     * Delete fields removed by admin
     * -------------------------------------------------------
     */

    const incomingIds =
      cleanedFields
        .filter(
          (field) => field.id !== null
        )
        .map(
          (field) =>
            field.id as string
        );

    const idsToDelete =
      existing
        .map(
          (field) => field.id
        )
        .filter(
          (id) =>
            !incomingIds.includes(id)
        );

    if (
      idsToDelete.length > 0
    ) {
      const {
        error: deleteError,
      } = await supabaseAdmin
        .from(
          "recruitment_form_fields"
        )
        .delete()
        .in(
          "id",
          idsToDelete
        )
        .eq(
          "form_id",
          formId
        );

      if (deleteError) {
        console.error(
          "Failed to delete removed fields:",
          deleteError
        );

        throw new Error(
          `Failed to remove deleted fields: ${deleteError.message}`
        );
      }
    }

    /*
     * -------------------------------------------------------
     * Temporarily rename existing fields
     * -------------------------------------------------------
     *
     * This prevents unique constraint errors when
     * field keys are changed or swapped.
     *
     * Example:
     *
     * full_name -> name
     * name      -> full_name
     *
     * -------------------------------------------------------
     */

    const fieldsStillExisting =
      existing.filter(
        (field) =>
          !idsToDelete.includes(
            field.id
          )
      );

    for (
      const field of fieldsStillExisting
    ) {
      const temporaryKey =
        `__tc_temp_${field.id}`;

      const {
        error: temporaryKeyError,
      } = await supabaseAdmin
        .from(
          "recruitment_form_fields"
        )
        .update({
          field_key:
            temporaryKey,

          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          field.id
        )
        .eq(
          "form_id",
          formId
        );

      if (temporaryKeyError) {
        console.error(
          "Failed to prepare field update:",
          temporaryKeyError
        );

        throw new Error(
          `Failed to prepare field "${field.field_key}": ${temporaryKeyError.message}`
        );
      }
    }

    /*
     * -------------------------------------------------------
     * Insert / update fields
     * -------------------------------------------------------
     */

    for (
      const field of cleanedFields
    ) {
      /*
       * Existing database field
       */
      if (field.id) {
        const {
          error,
        } = await supabaseAdmin
          .from(
            "recruitment_form_fields"
          )
          .update({
            field_key:
              field.field_key,

            label:
              field.label,

            field_type:
              field.field_type,

            required:
              field.required,

            placeholder:
              field.placeholder,

            help_text:
              field.help_text,

            options:
              field.options,

            validation:
              field.validation,

            display_order:
              field.display_order,

            enabled:
              field.enabled,

            system_field:
              field.system_field,

            updated_at:
              field.updated_at,
          })
          .eq(
            "id",
            field.id
          )
          .eq(
            "form_id",
            formId
          );

        if (error) {
          console.error(
            "Failed to update field:",
            field,
            error
          );

          throw new Error(
            `Failed to update "${field.label}": ${error.message}`
          );
        }
      }

      /*
       * New field
       *
       * IMPORTANT:
       * We deliberately DO NOT send an id.
       *
       * PostgreSQL/Supabase generates the UUID.
       */
      else {
        const {
          error,
        } = await supabaseAdmin
          .from(
            "recruitment_form_fields"
          )
          .insert({
            form_id:
              field.form_id,

            field_key:
              field.field_key,

            label:
              field.label,

            field_type:
              field.field_type,

            required:
              field.required,

            placeholder:
              field.placeholder,

            help_text:
              field.help_text,

            options:
              field.options,

            validation:
              field.validation,

            display_order:
              field.display_order,

            enabled:
              field.enabled,

            system_field:
              field.system_field,

            updated_at:
              field.updated_at,
          });

        if (error) {
          console.error(
            "Failed to insert field:",
            field,
            error
          );

          throw new Error(
            `Failed to add "${field.label}": ${error.message}`
          );
        }
      }
    }

    /*
     * -------------------------------------------------------
     * Success
     * -------------------------------------------------------
     */

    return NextResponse.json({
      success: true,
      message:
        "Application form updated successfully.",
    });
  } catch (error) {
    console.error(
      "Recruitment form update error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to update application form.",
      },
      { status: 500 }
    );
  }
}