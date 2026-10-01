import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const ADMIN_SESSION_COOKIE =
  "tc_admin_session";

export async function POST() {
  try {
    const supabase =
      await createClient();

    await supabase.auth.signOut();

    const response =
      NextResponse.json({
        success: true,
      });

    response.cookies.delete(
      ADMIN_SESSION_COOKIE
    );

    return response;
  } catch (error) {
    console.error(
      "Logout error:",
      error
    );

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