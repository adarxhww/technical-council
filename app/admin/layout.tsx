"use client";

import { ReactNode, useCallback, useState } from "react";

import AdminSidebar from "@/components/AdminSidebar";
import AdminSessionGuard from "@/components/AdminSessionGuard";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleOpenSidebar = useCallback(() => {
    setSidebarOpen(true);
  }, []);

  const handleCloseSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#f7f9fc] text-slate-900">
      {/* =====================================================
          ADMIN SESSION SECURITY
          ===================================================== */}

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
          ADMIN SIDEBAR / MOBILE NAVBAR
          ===================================================== */}

      <AdminSidebar
        open={sidebarOpen}
        onOpen={handleOpenSidebar}
        onClose={handleCloseSidebar}
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
        {/* Mobile navbar spacing */}
        <div
          aria-hidden="true"
          className="h-[82px] lg:hidden"
        />

        {/* Page content */}
        <div className="min-w-0 w-full">
          {children}
        </div>
      </main>
    </div>
  );
}