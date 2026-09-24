import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
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

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginRoute = pathname === "/login";

  // Protect the admin area.
  if (isAdminRoute) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const { data: adminProfile } = await supabase
      .from("admin_profiles")
      .select("id, status")
      .eq("id", user.id)
      .maybeSingle();

    if (!adminProfile || adminProfile.status !== "active") {
      await supabase.auth.signOut();

      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Already authenticated admins don't need the login page.
  if (isLoginRoute && user) {
    const { data: adminProfile } = await supabase
      .from("admin_profiles")
      .select("id, status")
      .eq("id", user.id)
      .maybeSingle();

    if (adminProfile?.status === "active") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/login",
  ],
};