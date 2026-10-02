import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { supabaseAdmin } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function getActiveAdmin() {
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
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server component / route-handler cookie writes may not
            // always be available. Reading the existing session still works.
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
    return {
      user: null,
      error: "You must be logged in as an admin.",
      status: 401,
    };
  }

  // Check the admin profile using the service-role client.
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
    return {
      user: null,
      error: "You are not authorized to perform this action.",
      status: 403,
    };
  }

  return {
    user,
    error: null,
    status: 200,
  };
}

/* ===========================================================
   GET RESUME
   =========================================================== */

export async function GET(
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

    /* -------------------------------------------------------
       Check admin authentication
       ------------------------------------------------------- */

    const admin = await getActiveAdmin();

    if (!admin.user) {
      return NextResponse.json(
        {
          success: false,
          message: admin.error,
        },
        { status: admin.status }
      );
    }

    /* -------------------------------------------------------
       Get application resume path
       ------------------------------------------------------- */

    const { data: application, error: fetchError } =
      await supabaseAdmin
        .from("recruitment_applications")
        .select("id, resume_path, resume_name")
        .eq("id", id)
        .maybeSingle();

    if (fetchError) {
      console.error(
        "Fetch application resume error:",
        fetchError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            fetchError.message ||
            "Could not fetch the application.",
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

    if (!application.resume_path) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No resume was uploaded for this application.",
        },
        { status: 404 }
      );
    }

    /* -------------------------------------------------------
       Create temporary signed URL
       ------------------------------------------------------- */

    const { data: signedUrl, error: signedUrlError } =
      await supabaseAdmin.storage
        .from("recruitment-resumes")
        .createSignedUrl(
          application.resume_path,
          60 * 10
        );

    if (signedUrlError || !signedUrl?.signedUrl) {
      console.error(
        "Resume signed URL error:",
        signedUrlError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            signedUrlError?.message ||
            "Could not generate a secure resume URL.",
        },
        { status: 500 }
      );
    }

    /* -------------------------------------------------------
       Return URL to frontend
       ------------------------------------------------------- */

    return NextResponse.json({
      success: true,
      url: signedUrl.signedUrl,
      resumeName: application.resume_name,
    });
  } catch (error) {
    console.error(
      "Open resume API error:",
      error
    );

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

/* ===========================================================
   DELETE APPLICATION
   =========================================================== */

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

    /* -------------------------------------------------------
       Check admin authentication
       ------------------------------------------------------- */

    const admin = await getActiveAdmin();

    if (!admin.user) {
      return NextResponse.json(
        {
          success: false,
          message: admin.error,
        },
        { status: admin.status }
      );
    }

    /* -------------------------------------------------------
       Get application first
       ------------------------------------------------------- */

    const { data: application, error: fetchError } =
      await supabaseAdmin
        .from("recruitment_applications")
        .select("id, resume_path")
        .eq("id", id)
        .maybeSingle();

    if (fetchError) {
      console.error(
        "Fetch application error:",
        fetchError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            fetchError.message ||
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

    /* -------------------------------------------------------
       Delete database record
       ------------------------------------------------------- */

    const { error: deleteError } =
      await supabaseAdmin
        .from("recruitment_applications")
        .delete()
        .eq("id", id);

    if (deleteError) {
      console.error(
        "Delete application error:",
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

    /* -------------------------------------------------------
       Delete resume from Storage
       ------------------------------------------------------- */

    let storageWarning: string | null = null;

    if (application.resume_path) {
      const { error: storageError } =
        await supabaseAdmin.storage
          .from("recruitment-resumes")
          .remove([application.resume_path]);

      if (storageError) {
        console.error(
          "Resume deletion error:",
          storageError
        );

        storageWarning =
          "Application was deleted, but the resume file could not be removed.";
      }
    }

    return NextResponse.json({
      success: true,
      message: storageWarning
        ? storageWarning
        : "Application deleted successfully.",
      storageWarning,
    });
  } catch (error) {
    console.error(
      "Delete application API error:",
      error
    );

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