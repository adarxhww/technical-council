import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Application ID is required.",
        },
        { status: 400 }
      );
    }

    // Check logged-in user
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          message: "You must be logged in as an admin.",
        },
        { status: 401 }
      );
    }

    // Verify active admin
    const { data: adminProfile, error: adminError } =
      await supabaseAdmin
        .from("admin_profiles")
        .select("id, status")
        .eq("id", user.id)
        .maybeSingle();

    if (
      adminError ||
      !adminProfile ||
      adminProfile.status !== "active"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorized to delete applications.",
        },
        { status: 403 }
      );
    }

    // Get application first so we know whether it has a resume
    const { data: application, error: applicationError } =
      await supabaseAdmin
        .from("recruitment_applications")
        .select("id, resume_path")
        .eq("id", id)
        .maybeSingle();

    if (applicationError) {
      console.error(
        "Application lookup error:",
        applicationError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            applicationError.message ||
            "Could not find the application.",
        },
        { status: 500 }
      );
    }

    if (!application) {
      return NextResponse.json(
        {
          success: false,
          message: "Application not found.",
        },
        { status: 404 }
      );
    }

    // Delete application from database
    const { error: deleteError } = await supabaseAdmin
      .from("recruitment_applications")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error(
        "Application delete error:",
        deleteError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            deleteError.message ||
            "Could not delete the application.",
        },
        { status: 500 }
      );
    }

    // Delete associated resume from private storage
    let storageWarning: string | null = null;

    if (application.resume_path) {
      const { error: storageError } = await supabaseAdmin.storage
        .from("recruitment-resumes")
        .remove([application.resume_path]);

      if (storageError) {
        console.error(
          "Resume delete error:",
          storageError
        );

        storageWarning =
          "Application was deleted, but the resume file could not be removed.";
      }
    }

    return NextResponse.json({
      success: true,
      message: "Application deleted successfully.",
      storageWarning,
    });
  } catch (error) {
    console.error("Delete application API error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unexpected server error.",
      },
      { status: 500 }
    );
  }
}