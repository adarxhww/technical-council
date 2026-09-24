import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type CreateAdminBody = {
  name?: string;
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  try {
    // -----------------------------------------------------
    // 1. Verify the currently logged-in admin
    // -----------------------------------------------------

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error: "You must be logged in to create an admin.",
        },
        { status: 401 }
      );
    }

    // -----------------------------------------------------
    // 2. Verify current user's admin profile
    // -----------------------------------------------------

    const { data: currentAdmin, error: profileError } =
      await supabase
        .from("admin_profiles")
        .select("id, role, status")
        .eq("id", user.id)
        .maybeSingle();

    if (
      profileError ||
      !currentAdmin ||
      currentAdmin.role !== "admin" ||
      currentAdmin.status !== "active"
    ) {
      return NextResponse.json(
        {
          error: "You do not have permission to create admins.",
        },
        { status: 403 }
      );
    }

    // -----------------------------------------------------
    // 3. Read request body
    // -----------------------------------------------------

    const body = (await request.json()) as CreateAdminBody;

    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    // -----------------------------------------------------
    // 4. Validate input
    // -----------------------------------------------------

    if (!name || !email || !password) {
      return NextResponse.json(
        {
          error: "Name, email, and password are required.",
        },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          error: "Password must contain at least 8 characters.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------------------
    // 5. Create Supabase Auth user
    // -----------------------------------------------------

    const {
      data: createdUser,
      error: createUserError,
    } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name,
        },
      });

    if (createUserError || !createdUser.user) {
      return NextResponse.json(
        {
          error:
            createUserError?.message ??
            "Unable to create the admin account.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------------------
    // 6. The database trigger creates admin_profiles
    // -----------------------------------------------------
    //
    // handle_new_admin() automatically creates:
    //
    // id
    // name
    // email
    // role = admin
    // status = active
    //
    // We don't insert it manually here.
    // -----------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        admin: {
          id: createdUser.user.id,
          email: createdUser.user.email,
          name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create admin error:", error);

    return NextResponse.json(
      {
        error: "An unexpected error occurred.",
      },
      { status: 500 }
    );
  }
}