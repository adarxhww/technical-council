import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type UpdateAdminBody = {
  name?: string;
  email?: string;
  password?: string;
  status?: "active" | "inactive";
};

async function getCurrentAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      supabase,
      user: null,
      admin: null,
    };
  }

  const { data: admin, error: adminError } = await supabase
    .from("admin_profiles")
    .select("id, role, status")
    .eq("id", user.id)
    .maybeSingle();

  if (adminError || !admin) {
    return {
      supabase,
      user,
      admin: null,
    };
  }

  return {
    supabase,
    user,
    admin,
  };
}

function hasAdminAccess(
  admin:
    | {
        id: string;
        role: string;
        status: string;
      }
    | null
) {
  return (
    !!admin &&
    admin.role === "admin" &&
    admin.status === "active"
  );
}

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const { user, admin } = await getCurrentAdmin();

    if (!user || !hasAdminAccess(admin)) {
      return NextResponse.json(
        {
          error: "You must be logged in as an active admin.",
        },
        { status: 403 }
      );
    }

    const body = (await request.json()) as UpdateAdminBody;

    const updates: Record<string, string> = {};

    if (body.name !== undefined) {
      const name = body.name.trim();

      if (!name) {
        return NextResponse.json(
          {
            error: "Name cannot be empty.",
          },
          { status: 400 }
        );
      }

      updates.name = name;
    }

    if (body.email !== undefined) {
      const email = body.email.trim().toLowerCase();

      if (!email) {
        return NextResponse.json(
          {
            error: "Email cannot be empty.",
          },
          { status: 400 }
        );
      }

      updates.email = email;
    }

    if (body.status !== undefined) {
      if (
        body.status !== "active" &&
        body.status !== "inactive"
      ) {
        return NextResponse.json(
          {
            error: "Invalid admin status.",
          },
          { status: 400 }
        );
      }

      updates.status = body.status;
    }

    if (body.password !== undefined) {
      if (body.password.length < 8) {
        return NextResponse.json(
          {
            error: "Password must contain at least 8 characters.",
          },
          { status: 400 }
        );
      }
    }

    const { data: existingProfile, error: existingError } =
      await supabaseAdmin
        .from("admin_profiles")
        .select("id, email")
        .eq("id", id)
        .maybeSingle();

    if (existingError || !existingProfile) {
      return NextResponse.json(
        {
          error: "Admin account not found.",
        },
        { status: 404 }
      );
    }

    const authUpdates: {
      email?: string;
      password?: string;
      user_metadata?: {
        name?: string;
      };
    } = {};

    if (body.email !== undefined) {
      authUpdates.email = body.email.trim().toLowerCase();
    }

    if (body.password !== undefined) {
      authUpdates.password = body.password;
    }

    if (body.name !== undefined) {
      authUpdates.user_metadata = {
        name: body.name.trim(),
      };
    }

    if (Object.keys(authUpdates).length > 0) {
      const { error: authUpdateError } =
        await supabaseAdmin.auth.admin.updateUserById(
          id,
          {
            ...authUpdates,
            ...(authUpdates.email
              ? { email_confirm: true }
              : {}),
          }
        );

      if (authUpdateError) {
        return NextResponse.json(
          {
            error: authUpdateError.message,
          },
          { status: 400 }
        );
      }
    }

    if (Object.keys(updates).length > 0) {
      const { error: profileUpdateError } =
        await supabaseAdmin
          .from("admin_profiles")
          .update(updates)
          .eq("id", id);

      if (profileUpdateError) {
        return NextResponse.json(
          {
            error: profileUpdateError.message,
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Update admin error:", error);

    return NextResponse.json(
      {
        error: "An unexpected error occurred.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const { user, admin } = await getCurrentAdmin();

    if (!user || !hasAdminAccess(admin)) {
      return NextResponse.json(
        {
          error: "You must be logged in as an active admin.",
        },
        { status: 403 }
      );
    }

    if (id === user.id) {
      return NextResponse.json(
        {
          error: "You cannot delete your own admin account.",
        },
        { status: 400 }
      );
    }

    const { data: targetAdmin, error: targetError } =
      await supabaseAdmin
        .from("admin_profiles")
        .select("id, email")
        .eq("id", id)
        .maybeSingle();

    if (targetError || !targetAdmin) {
      return NextResponse.json(
        {
          error: "Admin account not found.",
        },
        { status: 404 }
      );
    }

    const { error: deleteAuthError } =
      await supabaseAdmin.auth.admin.deleteUser(id);

    if (deleteAuthError) {
      return NextResponse.json(
        {
          error: deleteAuthError.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Delete admin error:", error);

    return NextResponse.json(
      {
        error: "An unexpected error occurred.",
      },
      { status: 500 }
    );
  }
}