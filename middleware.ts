import { createServerClient } from "@supabase/ssr";

import {
  NextResponse,
  type NextRequest,
} from "next/server";

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
          cookiesToSet.forEach(
            ({ name, value }) => {
              request.cookies.set(name, value);
            }
          );

          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });

          cookiesToSet.forEach(
            ({
              name,
              value,
              options,
            }) => {
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

  /*
   * Get the currently authenticated
   * Supabase user.
   *
   * getUser() verifies the session
   * with Supabase rather than trusting
   * a client-side value.
   */
  const {
    data,
    error,
  } = await supabase.auth.getUser();

  const user = data?.user ?? null;

  /*
   * ==========================================================
   * ADMIN ROUTES
   * ==========================================================
   *
   * Every /admin route requires:
   *
   * 1. A valid Supabase user
   * 2. An active admin_profiles record
   */
  if (isAdminRoute) {
    /*
     * No authenticated user.
     */
    if (error || !user) {
      return NextResponse.redirect(
        new URL("/login", request.url)
      );
    }

    /*
     * Check the admin profile.
     */
    const {
      data: adminProfile,
      error: adminProfileError,
    } = await supabase
      .from("admin_profiles")
      .select("id, status")
      .eq("id", user.id)
      .maybeSingle();

    /*
     * User must have an active
     * admin profile.
     */
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
     * Create the admin-session marker
     * if it does not already exist.
     *
     * No maxAge or expires is used,
     * so this behaves as a session cookie.
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
            process.env.NODE_ENV ===
            "production",
          path: "/",
        }
      );
    }

    /*
     * Moving between /admin pages does
     * not log the administrator out.
     */
    return response;
  }

  /*
   * ==========================================================
   * LOGIN ROUTE
   * ==========================================================
   *
   * If an already authenticated active
   * admin visits /login, send them
   * back to /admin.
   */
  if (
    isLoginRoute &&
    user &&
    !error
  ) {
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
   * If an authenticated administrator with
   * an admin-session marker reaches an actual
   * public application route, terminate the
   * admin session.
   *
   * Static assets are excluded by the matcher
   * below, so requests such as:
   *
   * /images/logo.png
   * /images/hero.png
   * /manifest.webmanifest
   *
   * cannot accidentally trigger this logout.
   */
  const adminSession =
    request.cookies.get(
      ADMIN_SESSION_COOKIE
    )?.value;

  if (
    adminSession &&
    user &&
    !error
  ) {
    await supabase.auth.signOut();

    response.cookies.delete(
      ADMIN_SESSION_COOKIE
    );
  }

  return response;
}

/*
 * Run middleware for application routes
 * while excluding:
 *
 * - API routes
 * - Next.js internals
 * - static files/assets
 *
 * The final .*\\..* exclusion is important:
 * it prevents public assets such as images,
 * fonts, manifests and other files from being
 * interpreted as navigation to a public page.
 */
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};