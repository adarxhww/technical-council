"use client";

import { FormEvent, useEffect, useState, type ReactNode } from "react";

import {
  ArrowRight,
  CheckCircle2,
  FileText,
  LayoutDashboard,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /*
   * Force the login page to always use light mode.
   *
   * The public website can still use dark mode normally.
   * We only remove the "dark" class while /login is mounted.
   */
  useEffect(() => {
    const html = document.documentElement;

    // Remember whether the user had dark mode enabled.
    const wasDarkMode = html.classList.contains("dark");

    // Force light mode for admin login.
    html.classList.remove("dark");

    // Restore the user's original theme when leaving /login.
    return () => {
      if (wasDarkMode) {
        html.classList.add("dark");
      }
    };
  }, []);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    const { error: loginError } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

    if (loginError) {
      setLoading(false);
      setError("Invalid email or password.");
      return;
    }

    window.location.href = "/admin";
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f6f7fb]">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[400px] w-[400px] rounded-full bg-blue-500/15 blur-[100px]" />

        <div className="absolute -bottom-40 -right-40 h-[440px] w-[440px] rounded-full bg-emerald-400/15 blur-[110px]" />

        <div className="absolute left-[42%] top-[25%] h-[280px] w-[280px] rounded-full bg-violet-400/10 blur-[90px]" />

        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(15,23,42,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.8) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* Main */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-3 sm:px-6 lg:px-8">
        <div className="scale-[1.07]">
          <div
            className="
              grid
              w-full
              max-w-4xl
              overflow-hidden
              rounded-[24px]
              border
              border-slate-200
              bg-white/80
              shadow-[0_20px_60px_rgba(15,23,42,0.10)]
              backdrop-blur-2xl
              lg:grid-cols-[1.05fr_0.95fr]
            "
          >
            {/* LEFT SIDE */}
            <section
              className="
                relative
                hidden
                overflow-hidden
                bg-white
                p-6
                text-slate-900
                lg:flex
                lg:min-h-[520px]
                lg:flex-col
                lg:justify-between
                xl:p-7
              "
            >
              <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

              <div className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

              <div className="pointer-events-none absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/[0.04] blur-3xl" />

              <div className="relative">
                {/* Logo */}
                <div className="flex items-center gap-2.5">
                  <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white p-1.5 shadow-sm">
                    <img
                      src="/images/logo.png"
                      alt="Technical Council"
                      className="h-full w-full object-contain"
                    />
                  </div>

                  <div>
                    <p className="text-xs font-bold tracking-wide text-slate-950">
                      TECHNICAL COUNCIL
                    </p>

                    <p className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.18em] text-slate-400">
                      Administration
                    </p>
                  </div>
                </div>

                {/* Intro */}
                <div className="mt-8 max-w-md">
                  <div
                    className="
                      mb-2.5
                      inline-flex
                      items-center
                      gap-1.5
                      rounded-full
                      border
                      border-blue-100
                      bg-blue-50
                      px-2.5
                      py-1
                      text-[9px]
                      font-semibold
                      text-blue-700
                    "
                  >
                    <Sparkles size={10} />
                    Admin Workspace
                  </div>

                  <h1 className="text-2xl font-black leading-[1.08] tracking-tight text-slate-950 xl:text-[28px]">
                    Everything you need to manage the{" "}
                    <span className="bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 bg-clip-text text-transparent">
                      Technical Council.
                    </span>
                  </h1>

                  <p className="mt-3 max-w-md text-[10px] leading-5 text-slate-500">
                    A dedicated workspace for managing events, registrations,
                    applications, notices, team information and the council
                    website from one place.
                  </p>
                </div>

                {/* Feature Cards */}
                <div className="mt-6 grid grid-cols-2 gap-2">
                  <FeatureCard
                    icon={<CalendarIcon />}
                    title="Events"
                    description="Create & manage"
                  />

                  <FeatureCard
                    icon={<Users size={15} />}
                    title="Registrations"
                    description="Monitor participants"
                  />

                  <FeatureCard
                    icon={<FileText size={15} />}
                    title="Applications"
                    description="Review submissions"
                  />

                  <FeatureCard
                    icon={<LayoutDashboard size={15} />}
                    title="Dashboard"
                    description="Stay in control"
                  />
                </div>
              </div>

              {/* Bottom */}
              <div className="relative flex items-center justify-between border-t border-slate-200 pt-3">
                <div className="flex items-center gap-1.5 text-[9px] text-slate-400">
                  <ShieldCheck
                    size={12}
                    className="text-emerald-500"
                  />
                  Secure administrator access
                </div>

                <div className="text-[9px] font-semibold text-slate-400">
                  TC • Admin
                </div>
              </div>
            </section>

            {/* RIGHT SIDE */}
            <section
              className="
                flex
                min-h-[520px]
                flex-col
                justify-center
                border-l
                border-slate-100
                bg-white
                p-5
                sm:p-6
                lg:p-7
              "
            >
              {/* Mobile Logo */}
              <div className="mb-5 flex items-center gap-2.5 lg:hidden">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white p-1.5 shadow-sm">
                  <img
                    src="/images/logo.png"
                    alt="Technical Council"
                    className="h-full w-full object-contain"
                  />
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-950">
                    Technical Council
                  </p>

                  <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                    Admin Portal
                  </p>
                </div>
              </div>

              <div className="mx-auto w-full max-w-[340px]">
                {/* Heading */}
                <div className="mb-5">
                  <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-blue-600 text-white shadow-md shadow-blue-500/20">
                    <ShieldCheck size={17} />
                  </div>

                  <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-emerald-600">
                    Welcome back
                  </p>

                  <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">
                    Administrator Login
                  </h2>

                  <p className="mt-1.5 text-[10px] leading-4.5 text-slate-500">
                    Sign in to access your Technical Council administration
                    workspace.
                  </p>
                </div>

                {/* Login Card */}
                <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_12px_35px_rgba(15,23,42,0.06)] sm:p-5">
                  <form
                    onSubmit={handleLogin}
                    className="space-y-3"
                  >
                    {/* Email */}
                    <div>
                      <label
                        htmlFor="email"
                        className="mb-1.5 block text-[10px] font-bold text-slate-700"
                      >
                        Email Address
                      </label>

                      <div className="relative">
                        <Mail
                          size={14}
                          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                          id="email"
                          type="email"
                          autoComplete="email"
                          value={email}
                          onChange={(event) =>
                            setEmail(event.target.value)
                          }
                          placeholder="admin@example.com"
                          disabled={loading}
                          className="
                            h-10
                            w-full
                            rounded-lg
                            border
                            border-slate-200
                            bg-slate-50
                            pl-8
                            pr-3
                            text-[11px]
                            text-slate-900
                            outline-none
                            transition
                            placeholder:text-slate-400
                            focus:border-blue-400
                            focus:bg-white
                            focus:ring-4
                            focus:ring-blue-500/[0.07]
                            disabled:cursor-not-allowed
                            disabled:opacity-60
                          "
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label
                        htmlFor="password"
                        className="mb-1.5 block text-[10px] font-bold text-slate-700"
                      >
                        Password
                      </label>

                      <div className="relative">
                        <LockKeyhole
                          size={14}
                          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                          id="password"
                          type="password"
                          autoComplete="current-password"
                          value={password}
                          onChange={(event) =>
                            setPassword(event.target.value)
                          }
                          placeholder="Enter your password"
                          disabled={loading}
                          className="
                            h-10
                            w-full
                            rounded-lg
                            border
                            border-slate-200
                            bg-slate-50
                            pl-8
                            pr-3
                            text-[11px]
                            text-slate-900
                            outline-none
                            transition
                            placeholder:text-slate-400
                            focus:border-blue-400
                            focus:bg-white
                            focus:ring-4
                            focus:ring-blue-500/[0.07]
                            disabled:cursor-not-allowed
                            disabled:opacity-60
                          "
                        />
                      </div>
                    </div>

                    {/* Error */}
                    {error && (
                      <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
                        <p className="text-[10px] font-medium leading-4 text-rose-600">
                          {error}
                        </p>
                      </div>
                    )}

                    {/* Sign In */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="
                        group
                        inline-flex
                        h-10
                        w-full
                        items-center
                        justify-center
                        gap-1.5
                        rounded-lg
                        bg-gradient-to-r
                        from-emerald-500
                        to-blue-600
                        px-3
                        text-[11px]
                        font-bold
                        text-white
                        shadow-md
                        shadow-blue-500/15
                        transition
                        hover:from-emerald-600
                        hover:to-blue-700
                        hover:shadow-blue-500/20
                        disabled:cursor-not-allowed
                        disabled:from-slate-300
                        disabled:to-slate-400
                      "
                    >
                      {loading ? (
                        <>
                          <Loader2
                            size={14}
                            className="animate-spin"
                          />
                          Signing In...
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={14} />
                          Sign In

                          <ArrowRight
                            size={13}
                            className="transition-transform group-hover:translate-x-0.5"
                          />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Security */}
                  <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50/70 px-2.5 py-2">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600">
                      <CheckCircle2 size={12} />
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-emerald-800">
                        Protected workspace
                      </p>

                      <p className="mt-0.5 text-[8px] text-emerald-700/70">
                        Authorized administrators only.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <p className="mt-3 text-center text-[9px] text-slate-400">
                  Technical Council Administration
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

/* =========================================
   Feature Card
========================================= */

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div
      className="
        rounded-lg
        border
        border-slate-200
        bg-slate-50
        p-2.5
        backdrop-blur-md
        transition
        hover:border-slate-300
        hover:bg-slate-100
      "
    >
      <div className="mb-1.5 flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-blue-600">
        {icon}
      </div>

      <p className="text-[10px] font-bold text-slate-900">
        {title}
      </p>

      <p className="mt-0.5 text-[8px] text-slate-500">
        {description}
      </p>
    </div>
  );
}

/* =========================================
   Calendar Icon
========================================= */

function CalendarIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="4.5"
        width="18"
        height="16"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M7 3.5V7M17 3.5V7M3 9H21"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M7.5 13H7.51M12 13H12.01M16.5 13H16.51M7.5 17H7.51M12 17H12.01"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}