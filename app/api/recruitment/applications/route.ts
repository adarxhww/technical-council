import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const FORM_KEY = "technical_council_application";

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function getStringArray(formData: FormData, key: string): string[] {
  return formData
    .getAll(key)
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getFileExtension(fileName: string): string {
  const parts = fileName.split(".");

  if (parts.length < 2) {
    return "";
  }

  return parts.pop()?.toLowerCase() || "";
}

function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_");
}

export async function POST(request: Request) {
  let uploadedResumePath: string | null = null;

  try {
    const formData = await request.formData();

    // --------------------------------------------------
    // Standard form fields
    // --------------------------------------------------

    const fullName = getString(formData, "full_name");
    const email = getString(formData, "email");
    const phone = getString(formData, "phone");
    const branch = getString(formData, "branch");
    const year = getString(formData, "year");

    const technicalSkills = getStringArray(
      formData,
      "technical_skills"
    );

    const otherSkill = getString(formData, "other_skill");

    /*
     * The current recruitment form uses:
     *
     *     interests
     *
     * while the database column is:
     *
     *     areas_of_interest
     *
     * So we translate it here.
     */
    const areasOfInterest =
      getString(formData, "interests") ||
      getString(formData, "areas_of_interest");

    const whyJoin = getString(formData, "why_join");

    const resume = formData.get("resume");

    // --------------------------------------------------
    // Basic validation
    // --------------------------------------------------

    if (!fullName) {
      return NextResponse.json(
        {
          success: false,
          message: "Full name is required.",
        },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "Email is required.",
        },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid email address.",
        },
        { status: 400 }
      );
    }

    if (!branch) {
      return NextResponse.json(
        {
          success: false,
          message: "Branch / Department is required.",
        },
        { status: 400 }
      );
    }

    if (!year) {
      return NextResponse.json(
        {
          success: false,
          message: "Year is required.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // Get recruitment form settings
    // --------------------------------------------------

    const { data: recruitmentForm, error: formError } =
      await supabaseAdmin
        .from("recruitment_form")
        .select("*")
        .eq("form_key", FORM_KEY)
        .single();

    if (formError || !recruitmentForm) {
      console.error(
        "Recruitment form error:",
        formError
      );

      return NextResponse.json(
        {
          success: false,
          message: "Recruitment form is unavailable.",
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // Check form status
    // --------------------------------------------------

    if (recruitmentForm.status !== "open") {
      return NextResponse.json(
        {
          success: false,
          message: "Applications are currently closed.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
// Resume handling
// --------------------------------------------------

let resumePath: string | null = null;
let resumeName: string | null = null;
let resumeType: string | null = null;
let resumeSize: number | null = null;

if (resume instanceof File && resume.size > 0) {
  const maxSizeMb =
    Number(recruitmentForm.resume_max_size_mb) || 5;

  const maxSizeBytes =
    maxSizeMb * 1024 * 1024;

  // Size validation
  if (resume.size > maxSizeBytes) {
    return NextResponse.json(
      {
        success: false,
        message: `Resume must be smaller than ${maxSizeMb} MB.`,
      },
      { status: 400 }
    );
  }

  // --------------------------------------------------
  // PDF ONLY
  // --------------------------------------------------

  const extension = getFileExtension(
    resume.name
  );

  const normalizedExtension =
    extension.toLowerCase();

  const isPdfExtension =
    normalizedExtension === "pdf";

  const isPdfMimeType =
    resume.type === "application/pdf";

  if (!isPdfExtension || !isPdfMimeType) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Invalid resume format. Only PDF files are allowed.",
      },
      { status: 400 }
    );
  }

  // Upload
  const safeName = sanitizeFileName(
    resume.name
  );

  const fileName =
    `${crypto.randomUUID()}-${safeName}`;

  const storagePath =
    `applications/${fileName}`;

  const fileBuffer =
    await resume.arrayBuffer();

  const { error: uploadError } =
    await supabaseAdmin.storage
      .from("recruitment-resumes")
      .upload(
        storagePath,
        fileBuffer,
        {
          contentType:
            "application/pdf",
          upsert: false,
        }
      );

  if (uploadError) {
    console.error(
      "Resume upload error:",
      uploadError
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to upload resume.",
      },
      { status: 500 }
    );
  }

  resumePath = storagePath;
  uploadedResumePath = storagePath;
  resumeName = resume.name;
  resumeType = "application/pdf";
  resumeSize = resume.size;
} else if (
  recruitmentForm.resume_required
) {
  return NextResponse.json(
    {
      success: false,
      message: "Resume is required.",
    },
    { status: 400 }
  );
}

    // --------------------------------------------------
    // Custom answers
    // --------------------------------------------------
    //
    // The database does NOT have a phone column.
    //
    // Phone and future dynamically-created fields are
    // therefore stored inside custom_answers.
    // --------------------------------------------------

    const customAnswers: Record<
      string,
      unknown
    > = {};

    if (phone) {
      customAnswers.phone = phone;
    }

    /*
     * Preserve any additional fields created through
     * the admin customizer.
     *
     * Known database fields are excluded because they
     * already have dedicated columns.
     */
    const dedicatedFields = new Set([
      "full_name",
      "email",
      "phone",
      "branch",
      "year",
      "technical_skills",
      "other_skill",
      "interests",
      "areas_of_interest",
      "why_join",
      "resume",
    ]);

    for (const [key, value] of formData.entries()) {
      if (dedicatedFields.has(key)) {
        continue;
      }

      if (typeof value === "string") {
        customAnswers[key] = value;
      }
    }

    // --------------------------------------------------
    // Insert application
    // --------------------------------------------------

    const { data: application, error: insertError } =
      await supabaseAdmin
        .from("recruitment_applications")
        .insert({
          full_name: fullName,
          email,
          branch,
          year,
          technical_skills:
            technicalSkills,
          other_skill:
            otherSkill || null,
          areas_of_interest:
            areasOfInterest || null,
          why_join:
            whyJoin || null,
          resume_path:
            resumePath,
          resume_name:
            resumeName,
          resume_type:
            resumeType,
          resume_size:
            resumeSize,
          custom_answers:
            customAnswers,
        })
        .select("id")
        .single();

    if (insertError) {
      console.error(
        "Application insert error:",
        insertError
      );

      // Clean up uploaded resume if DB insert fails.
      if (uploadedResumePath) {
        const {
          error: cleanupError,
        } = await supabaseAdmin.storage
          .from("recruitment-resumes")
          .remove([
            uploadedResumePath,
          ]);

        if (cleanupError) {
          console.error(
            "Resume cleanup error:",
            cleanupError
          );
        }
      }

      return NextResponse.json(
        {
          success: false,
          message:
            insertError.message ||
            "Failed to submit application.",
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // Success
    // --------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        message:
          recruitmentForm.success_message ||
          "Application submitted successfully!",
        applicationId:
          application.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Recruitment application error:",
      error
    );

    // Attempt cleanup if an unexpected error happens
    // after the resume was uploaded.
    if (uploadedResumePath) {
      const {
        error: cleanupError,
      } = await supabaseAdmin.storage
        .from("recruitment-resumes")
        .remove([
          uploadedResumePath,
        ]);

      if (cleanupError) {
        console.error(
          "Unexpected-error resume cleanup error:",
          cleanupError
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while submitting your application.",
      },
      { status: 500 }
    );
  }
}