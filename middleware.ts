import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ADMIN_SESSION_COOKIE = "tc_admin_session";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const isAdminRoute =
    pathname === "/admin" ||
    pathname.startsWith("/admin/");

  const isLoginRoute = pathname === "/login";

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });

          cookiesToSet.forEach(
            ({ name, value, options }) => {
              response.cookies.set(
                name,
                value,
                options
              );
            }
          );
        },
      },
    }
  );

  const {
    data,
    error,
  } = await supabase.auth.getUser();

  const user = data?.user ?? null;

  /*
   * ==========================================================
   * ADMIN ROUTES
   * ==========================================================
   */

  if (isAdminRoute) {
    if (error || !user) {
      return NextResponse.redirect(
        new URL("/login", request.url)
      );
    }

    const {
      data: adminProfile,
      error: adminProfileError,
    } = await supabase
      .from("admin_profiles")
      .select("id, status")
      .eq("id", user.id)
      .maybeSingle();

    if (
      adminProfileError ||
      !adminProfile ||
      adminProfile.status !== "active"
    ) {
      await supabase.auth.signOut();

      const redirectResponse =
        NextResponse.redirect(
          new URL("/login", request.url)
        );

      redirectResponse.cookies.delete(
        ADMIN_SESSION_COOKIE
      );

      return redirectResponse;
    }

    /*
     * Keep the admin marker.
     */
    if (
      !request.cookies.get(
        ADMIN_SESSION_COOKIE
      )?.value
    ) {
      response.cookies.set(
        ADMIN_SESSION_COOKIE,
        "1",
        {
          httpOnly: true,
          sameSite: "lax",
          secure:
            process.env.NODE_ENV === "production",
          path: "/",
        }
      );
    }

    return response;
  }

  /*
   * ==========================================================
   * LOGIN ROUTE
   * ==========================================================
   */

  if (isLoginRoute && user && !error) {
    const {
      data: adminProfile,
      error: adminProfileError,
    } = await supabase
      .from("admin_profiles")
      .select("id, status")
      .eq("id", user.id)
      .maybeSingle();

    if (
      !adminProfileError &&
      adminProfile?.status === "active"
    ) {
      return NextResponse.redirect(
        new URL("/admin", request.url)
      );
    }
  }

  /*
   * ==========================================================
   * PUBLIC ROUTES
   * ==========================================================
   *
   * IMPORTANT:
   *
   * DO NOT sign the user out here.
   *
   * An authenticated admin may legitimately access:
   *
   * - public pages
   * - recruitment pages
   * - uploaded/downloaded resources
   * - other application routes
   *
   * Visiting those routes must not destroy
   * the Supabase session.
   */

  return response;
}

/*
 * ==========================================================
 * MATCHER
 * ==========================================================
 *
 * API routes are intentionally excluded because their
 * authentication is handled inside the API route itself.
 */

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};