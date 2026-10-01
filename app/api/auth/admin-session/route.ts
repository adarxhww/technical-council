import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const ADMIN_SESSION_COOKIE =
  "tc_admin_session";

type AdminSessionBody = {
  startedAt?: number;
  lastActivityAt?: number;
};

export async function POST(
  request: Request
) {
  try {
    const supabase =
      await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const { data: adminProfile } =
      await supabase
        .from("admin_profiles")
        .select("id, status")
        .eq("id", user.id)
        .maybeSingle();

    if (
      !adminProfile ||
      adminProfile.status !== "active"
    ) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 403,
        }
      );
    }

    let body: AdminSessionBody = {};

    try {
      body =
        (await request.json()) as AdminSessionBody;
    } catch {
      body = {};
    }

    const now = Date.now();

    const requestedStartedAt =
      typeof body.startedAt === "number" &&
      Number.isFinite(
        body.startedAt
      )
        ? body.startedAt
        : null;

    const startedAt =
      requestedStartedAt &&
      requestedStartedAt > 0
        ? requestedStartedAt
        : now;

    const response =
      NextResponse.json({
        success: true,
        startedAt,
        lastActivityAt:
          typeof body.lastActivityAt ===
          "number"
            ? body.lastActivityAt
            : now,
      });

    response.cookies.set(
      ADMIN_SESSION_COOKIE,
      "1",
      {
        httpOnly: true,
        sameSite: "lax",
        secure:
          process.env.NODE_ENV ===
          "production",
        path: "/",
      }
    );

    return response;
  } catch (error) {
    console.error(
      "Admin session error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to synchronize admin session.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE() {
  const response =
    NextResponse.json({
      success: true,
    });

  response.cookies.delete(
    ADMIN_SESSION_COOKIE
  );

  return response;
}