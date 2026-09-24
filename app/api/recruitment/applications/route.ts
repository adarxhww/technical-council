import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const MAX_RESUME_SIZE = 5 * 1024 * 1024;

const ALLOWED_RESUME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const ALLOWED_RESUME_EXTENSIONS = [".pdf", ".doc", ".docx"];

function isAllowedResume(file: File) {
  const fileName = file.name.toLowerCase();

  const validExtension = ALLOWED_RESUME_EXTENSIONS.some((extension) =>
    fileName.endsWith(extension)
  );

  const validType = ALLOWED_RESUME_TYPES.has(file.type);

  return validExtension && validType;
}

function sanitizeFileName(fileName: string) {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .slice(-100);
}

function getString(formData: FormData, key: string) {
  return formData.get(key)?.toString().trim() || "";
}

export async function POST(request: Request) {
  let applicationId: string | null = null;
  let uploadedResumePath: string | null = null;

  try {
    const formData = await request.formData();

    const fullName = getString(formData, "full_name");
    const email = getString(formData, "email");
    const whatsappNumber = getString(formData, "whatsapp_number");
    const branch = getString(formData, "branch");
    const year = getString(formData, "year");
    const areasOfInterest = getString(
      formData,
      "areas_of_interest"
    );
    const whyJoin = getString(formData, "why_join");

    const technicalSkills = formData
      .getAll("technical_skills")
      .map((value) => value.toString().trim())
      .filter(Boolean);

    const otherSkill = getString(formData, "other_skill");

    const resumeValue = formData.get("resume");

    const resume =
      resumeValue instanceof File && resumeValue.size > 0
        ? resumeValue
        : null;

    /* ---------------------------------------------
       Basic validation
    --------------------------------------------- */

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

    if (!whatsappNumber) {
      return NextResponse.json(
        {
          success: false,
          message: "WhatsApp number is required.",
        },
        { status: 400 }
      );
    }

    if (!branch) {
      return NextResponse.json(
        {
          success: false,
          message: "Branch is required.",
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

    /* ---------------------------------------------
       Resume validation
    --------------------------------------------- */

    if (resume) {
      if (resume.size > MAX_RESUME_SIZE) {
        return NextResponse.json(
          {
            success: false,
            message: "Resume size must be 5 MB or less.",
          },
          { status: 400 }
        );
      }

      if (!isAllowedResume(resume)) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Only PDF, DOC, and DOCX resume files are allowed.",
          },
          { status: 400 }
        );
      }
    }

    /* ---------------------------------------------
       Create application first
    --------------------------------------------- */

    const { data: application, error: applicationError } =
      await supabaseAdmin
        .from("recruitment_applications")
        .insert({
          full_name: fullName,
          email,
          whatsapp_number: whatsappNumber,
          branch,
          year,
          technical_skills: technicalSkills,
          other_skill: otherSkill || null,
          areas_of_interest: areasOfInterest || null,
          why_join: whyJoin || null,
        })
        .select("id")
        .single();

    if (applicationError || !application) {
      console.error(
        "Recruitment application insert error:",
        applicationError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            applicationError?.message ||
            "Could not save your application.",
        },
        { status: 500 }
      );
    }

    applicationId = application.id;

    /* ---------------------------------------------
       Upload optional resume
    --------------------------------------------- */

    if (resume) {
      const safeFileName = sanitizeFileName(resume.name);

      const resumePath = `recruitment/${application.id}/${crypto.randomUUID()}-${safeFileName}`;

      const resumeBuffer = Buffer.from(
        await resume.arrayBuffer()
      );

      const { error: uploadError } =
        await supabaseAdmin.storage
          .from("recruitment-resumes")
          .upload(resumePath, resumeBuffer, {
            contentType: resume.type,
            upsert: false,
          });

      if (uploadError) {
        console.error(
          "Recruitment resume upload error:",
          uploadError
        );

        await supabaseAdmin
          .from("recruitment_applications")
          .delete()
          .eq("id", application.id);

        return NextResponse.json(
          {
            success: false,
            message:
              "Application could not be completed because the resume upload failed.",
          },
          { status: 500 }
        );
      }

      uploadedResumePath = resumePath;

      /* ---------------------------------------------
         Save resume information
      --------------------------------------------- */

      const { error: updateError } =
        await supabaseAdmin
          .from("recruitment_applications")
          .update({
            resume_path: resumePath,
            resume_name: resume.name,
            resume_type: resume.type,
            resume_size: resume.size,
          })
          .eq("id", application.id);

      if (updateError) {
        console.error(
          "Recruitment resume metadata update error:",
          updateError
        );

        await supabaseAdmin.storage
          .from("recruitment-resumes")
          .remove([resumePath]);

        await supabaseAdmin
          .from("recruitment_applications")
          .delete()
          .eq("id", application.id);

        return NextResponse.json(
          {
            success: false,
            message:
              "Application could not be completed.",
          },
          { status: 500 }
        );
      }
    }

    /* ---------------------------------------------
       Success
    --------------------------------------------- */

    return NextResponse.json(
      {
        success: true,
        message: "Application submitted successfully.",
        applicationId: application.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Recruitment application API error:",
      error
    );

    /*
     * Emergency cleanup if something unexpected happens
     * after a resume has already been uploaded.
     */
    if (uploadedResumePath) {
      try {
        await supabaseAdmin.storage
          .from("recruitment-resumes")
          .remove([uploadedResumePath]);
      } catch (cleanupError) {
        console.error(
          "Resume cleanup error:",
          cleanupError
        );
      }
    }

    if (applicationId) {
      try {
        await supabaseAdmin
          .from("recruitment_applications")
          .delete()
          .eq("id", applicationId);
      } catch (cleanupError) {
        console.error(
          "Application cleanup error:",
          cleanupError
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while submitting your application. Please try again.",
      },
      { status: 500 }
    );
  }
}