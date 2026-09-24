"use client";

import { ReactNode, useState } from "react";
import { Menu } from "lucide-react";

import AdminSidebar from "@/components/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#f7f9fc] text-slate-900">
      {/* =====================================================
          SHARED AURORA BACKGROUND
      ===================================================== */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-blue-400/15 blur-3xl" />

        <div className="absolute right-[-140px] top-[8%] h-[420px] w-[420px] rounded-full bg-emerald-300/15 blur-3xl" />

        <div className="absolute bottom-[-180px] left-[35%] h-[420px] w-[420px] rounded-full bg-violet-300/10 blur-3xl" />

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
          MOBILE SIDEBAR
      ===================================================== */}
      {sidebarOpen && (
        <button
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* =====================================================
          SIDEBAR
      ===================================================== */}
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* =====================================================
          MAIN CONTENT

          IMPORTANT:
          Use margin-left instead of padding-left.
          This reserves the sidebar's actual width and prevents
          child pages from rendering underneath the sidebar.
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
        =================================================== */}
        <div className="min-w-0 w-full">
          {children}
        </div>
      </main>
    </div>
  );
}