import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const ADMIN_SESSION_COOKIE =
  "tc_admin_session";

type LogoutBody = {
  tabId?: string;
};

export async function POST(
  request: Request
) {
  try {
    const supabase =
      await createClient();

    /*
     * Get the currently authenticated admin.
     */
    const {
      data: { user },
    } = await supabase.auth.getUser();

    /*
     * Remove the tab-specific session record.
     *
     * This is done before signing out so the
     * current admin tab is immediately invalidated.
     */
    if (user) {
      let body: LogoutBody = {};

      try {
        body =
          (await request.json()) as LogoutBody;
      } catch {
        body = {};
      }

      if (
        typeof body.tabId === "string" &&
        body.tabId.trim()
      ) {
        const { error: deleteError } =
          await supabase
            .from("admin_tab_sessions")
            .delete()
            .eq("user_id", user.id)
            .eq(
              "tab_id",
              body.tabId.trim()
            );

        if (deleteError) {
          console.error(
            "Admin tab session deletion error:",
            deleteError
          );
        }
      }
    }

    /*
     * Sign out the Supabase authentication session.
     */
    await supabase.auth.signOut();

    const response =
      NextResponse.json({
        success: true,
      });

    /*
     * Remove the admin session marker.
     */
    response.cookies.delete(
      ADMIN_SESSION_COOKIE
    );

    return response;
  } catch (error) {
    console.error(
      "Logout error:",
      error
    );

    /*
     * Even if something fails, make sure the
     * browser is sent a successful response and
     * the admin marker is removed.
     */
    const response =
      NextResponse.json({
        success: true,
      });

    response.cookies.delete(
      ADMIN_SESSION_COOKIE
    );

    return response;
  }
}