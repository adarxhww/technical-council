import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ADMIN_SESSION_COOKIE = "tc_admin_session";
const TAB_SESSION_TIMEOUT_MS = 60 * 1000; // 60 seconds

type AdminSessionBody = {
  tabId?: string;
  startedAt?: number;
  lastActivityAt?: number;
  initialize?: boolean;
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

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

    const { data: adminProfile, error: adminProfileError } =
      await supabase
        .from("admin_profiles")
        .select("id, status")
        .eq("id", user.id)
        .maybeSingle();

    if (
      adminProfileError ||
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
      body = (await request.json()) as AdminSessionBody;
    } catch {
      body = {};
    }

    const tabId =
      typeof body.tabId === "string" && body.tabId.trim()
        ? body.tabId.trim()
        : null;

    if (!tabId) {
      return NextResponse.json(
        {
          error: "Missing admin tab session.",
        },
        {
          status: 400,
        }
      );
    }

    const now = new Date();

    /*
     * A new tab session is only allowed to be created
     * when the login page explicitly initializes it.
     */
    if (body.initialize === true) {
      const startedAt =
        typeof body.startedAt === "number" &&
        Number.isFinite(body.startedAt) &&
        body.startedAt > 0
          ? new Date(body.startedAt)
          : now;

      const { error: insertError } = await supabase
        .from("admin_tab_sessions")
        .upsert(
          {
            user_id: user.id,
            tab_id: tabId,
            started_at: startedAt.toISOString(),
            last_heartbeat_at: now.toISOString(),
          },
          {
            onConflict: "tab_id",
          }
        );

      if (insertError) {
        console.error(
          "Admin tab session creation error:",
          insertError
        );

        return NextResponse.json(
          {
            error: "Unable to create admin tab session.",
          },
          {
            status: 500,
          }
        );
      }

      const response = NextResponse.json({
        success: true,
        startedAt: startedAt.getTime(),
        lastActivityAt: now.getTime(),
      });

      response.cookies.set(ADMIN_SESSION_COOKIE, "1", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });

      return response;
    }

    /*
     * Existing tab session:
     * verify that the session belongs to this user and
     * has sent a heartbeat recently.
     */
    const { data: tabSession, error: tabSessionError } =
      await supabase
        .from("admin_tab_sessions")
        .select(
          "id, user_id, tab_id, started_at, last_heartbeat_at"
        )
        .eq("user_id", user.id)
        .eq("tab_id", tabId)
        .maybeSingle();

    if (tabSessionError) {
      console.error(
        "Admin tab session lookup error:",
        tabSessionError
      );

      return NextResponse.json(
        {
          error: "Unable to verify admin tab session.",
        },
        {
          status: 500,
        }
      );
    }

    if (!tabSession) {
      return NextResponse.json(
        {
          error: "Admin tab session expired.",
        },
        {
          status: 401,
        }
      );
    }

    const lastHeartbeat =
      new Date(tabSession.last_heartbeat_at).getTime();

    if (
      !Number.isFinite(lastHeartbeat) ||
      Date.now() - lastHeartbeat > TAB_SESSION_TIMEOUT_MS
    ) {
      await supabase
        .from("admin_tab_sessions")
        .delete()
        .eq("id", tabSession.id);

      return NextResponse.json(
        {
          error: "Admin tab session expired.",
        },
        {
          status: 401,
        }
      );
    }

    const { error: updateError } = await supabase
      .from("admin_tab_sessions")
      .update({
        last_heartbeat_at: now.toISOString(),
      })
      .eq("id", tabSession.id)
      .eq("user_id", user.id);

    if (updateError) {
      console.error(
        "Admin tab session heartbeat error:",
        updateError
      );

      return NextResponse.json(
        {
          error: "Unable to update admin tab session.",
        },
        {
          status: 500,
        }
      );
    }

    const startedAt = new Date(
      tabSession.started_at
    ).getTime();

    const response = NextResponse.json({
      success: true,
      startedAt,
      lastActivityAt: now.getTime(),
    });

    response.cookies.set(ADMIN_SESSION_COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    return response;
  } catch (error) {
    console.error(
      "Admin session error:",
      error
    );

    return NextResponse.json(
      {
        error: "Unable to synchronize admin session.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      let body: { tabId?: string } = {};

      try {
        body = (await request.json()) as {
          tabId?: string;
        };
      } catch {
        body = {};
      }

      if (
        typeof body.tabId === "string" &&
        body.tabId.trim()
      ) {
        await supabase
          .from("admin_tab_sessions")
          .delete()
          .eq("user_id", user.id)
          .eq("tab_id", body.tabId.trim());
      }
    }

    const response = NextResponse.json({
      success: true,
    });

    response.cookies.delete(
      ADMIN_SESSION_COOKIE
    );

    return response;
  } catch (error) {
    console.error(
      "Admin session deletion error:",
      error
    );

    const response = NextResponse.json({
      success: true,
    });

    response.cookies.delete(
      ADMIN_SESSION_COOKIE
    );

    return response;
  }
}