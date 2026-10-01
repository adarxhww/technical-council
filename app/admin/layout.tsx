"use client";

import { ReactNode, useState } from "react";
import { Menu } from "lucide-react";

import AdminSidebar from "@/components/AdminSidebar";
import AdminSessionGuard from "@/components/AdminSessionGuard";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#f7f9fc] text-slate-900">
      {/* =====================================================
          ADMIN SESSION SECURITY
          =====================================================

          This guard is mounted at the admin-layout level.

          Therefore:

          /admin
          /admin/events
          /admin/events/create
          /admin/events/[id]
          /admin/applications
          /admin/team
          /admin/gallery
          /admin/notices
          /admin/settings
          /admin/submissions
          /admin/submissions/create
          etc.

          all remain inside the same admin session.

          Navigation between /admin/* pages does NOT log out.
      */}
      <AdminSessionGuard />

      {/* =====================================================
          BACKGROUND
          ===================================================== */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        {/* Blue glow */}
        <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-blue-400/15 blur-3xl" />

        {/* Green glow */}
        <div className="absolute right-[-140px] top-[8%] h-[420px] w-[420px] rounded-full bg-emerald-300/15 blur-3xl" />

        {/* Violet glow */}
        <div className="absolute bottom-[-180px] left-[35%] h-[420px] w-[420px] rounded-full bg-violet-300/10 blur-3xl" />

        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(15,23,42,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.035) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            maskImage:
              "linear-gradient(to bottom, black 0%, transparent 90%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, black 0%, transparent 90%)",
          }}
        />
      </div>

      {/* =====================================================
          MOBILE SIDEBAR OVERLAY
          ===================================================== */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="
            fixed
            inset-0
            z-40
            bg-slate-950/35
            backdrop-blur-sm
            lg:hidden
          "
        />
      )}

      {/* =====================================================
          ADMIN SIDEBAR
          ===================================================== */}
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* =====================================================
          MAIN ADMIN CONTENT
          ===================================================== */}
      <main
        className="
          min-h-screen
          min-w-0
          w-full
          lg:ml-[282px]
          lg:w-[calc(100%-282px)]
        "
      >
        {/* ===================================================
            MOBILE MENU BUTTON
            =================================================== */}
        <div className="fixed left-5 top-5 z-30 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
            className="
              rounded-xl
              border
              border-slate-900/[0.08]
              bg-white/75
              p-2.5
              text-slate-700
              shadow-sm
              backdrop-blur-xl
              transition
              hover:bg-white
            "
          >
            <Menu size={20} />
          </button>
        </div>

        {/* ===================================================
            PAGE CONTENT

            IMPORTANT:
            Children are rendered directly here.

            All /admin/* routes therefore share this
            same layout and AdminSessionGuard.
            =================================================== */}
        <div className="min-w-0 w-full">
          {children}
        </div>
      </main>
    </div>
  );
}