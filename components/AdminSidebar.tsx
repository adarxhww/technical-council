"use client";

import {
  Bell,
  CalendarDays,
  ClipboardList,
  FilePlus2,
  Image as ImageIcon,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mail,
  Settings,
  Users,
  X,
  UserPlus,
} from "lucide-react";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type SidebarItemProps = {
  icon: typeof LayoutDashboard;
  label: string;
  href: string;
  active?: boolean;
  badge?: string;
  onClick?: () => void;
};

type AdminProfile = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  avatar_url: string | null;
};

export default function AdminSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [loggingOut, setLoggingOut] = useState(false);
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [loadingAdmin, setLoadingAdmin] = useState(true);
  const [unreadMessages, setUnreadMessages] = useState(0);

  /*
   * Create the Supabase client once for this sidebar instance.
   * This prevents the effects below from re-running unnecessarily.
   */
  const [supabase] = useState(() => createClient());

  /*
   * General sidebar active state.
   */
  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  /*
   * Registration-specific active states.
   *
   * IMPORTANT:
   * /admin/registrations/[id]
   * is a MONITORING detail page, not a Create Registration page.
   */

  const isCreateRegistrationActive =
    pathname === "/admin/registrations" ||
    pathname === "/admin/registrations/create";

  const isMonitorRegistrationActive =
    pathname === "/admin/registration-monitoring" ||
    (
      pathname.startsWith("/admin/registrations/") &&
      pathname !== "/admin/registrations/create"
    );

  /*
   * Load logged-in admin profile.
   */
  useEffect(() => {
    let mounted = true;

    async function loadAdminProfile() {
      setLoadingAdmin(true);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (mounted) {
            setAdmin(null);
          }
          return;
        }

        const { data: profile, error } = await supabase
          .from("admin_profiles")
          .select("id, name, email, role, status, avatar_url")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Unable to load admin profile:", error);

          if (mounted) {
            setAdmin(null);
          }

          return;
        }

        if (mounted) {
          setAdmin(profile);
        }
      } catch (error) {
        console.error("Admin profile loading error:", error);

        if (mounted) {
          setAdmin(null);
        }
      } finally {
        if (mounted) {
          setLoadingAdmin(false);
        }
      }
    }

    loadAdminProfile();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  /*
   * Load unread message count.
   */
  useEffect(() => {
    let mounted = true;

    async function loadUnreadMessageCount() {
      try {
        const { count, error } = await supabase
          .from("contact_messages")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("status", "unread");

        if (error) {
          console.error(
            "Unable to load unread message count:",
            error
          );

          if (mounted) {
            setUnreadMessages(0);
          }

          return;
        }

        if (mounted) {
          setUnreadMessages(count ?? 0);
        }
      } catch (error) {
        console.error(
          "Unread message count loading error:",
          error
        );

        if (mounted) {
          setUnreadMessages(0);
        }
      }
    }

    loadUnreadMessageCount();

    /*
     * Realtime updates:
     * - New message
     * - Message marked read
     * - Message deleted
     */
    const channel = supabase
      .channel("admin-sidebar-messages")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contact_messages",
        },
        () => {
          loadUnreadMessageCount();
        }
      )
      .subscribe();

    /*
     * Refresh when returning to the browser tab.
     */
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadUnreadMessageCount();
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      mounted = false;

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      supabase.removeChannel(channel);
    };
  }, [supabase]);

  /*
   * Logout.
   */
  async function handleLogout() {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        const result = await response.json().catch(() => null);

        throw new Error(
          result?.error ?? "Unable to log out."
        );
      }

      await supabase.auth.signOut();

      onClose();

      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);

      try {
        await supabase.auth.signOut();
      } catch {
        // Ignore fallback sign-out errors.
      }

      onClose();

      window.location.href = "/login";
    }
  }

  const displayName =
    admin?.name?.trim() || "Administrator";

  const displayEmail =
    admin?.email?.trim() || "Loading...";

  const avatarLetter =
    displayName.charAt(0).toUpperCase() || "A";

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-3 left-3 z-50 flex w-[258px] flex-col overflow-hidden rounded-[26px] border border-white/70 bg-white/75 shadow-[0_20px_60px_rgba(15,23,42,0.10)] backdrop-blur-2xl transition-transform duration-300 lg:translate-x-0 ${
          open
            ? "translate-x-0"
            : "-translate-x-[290px]"
        }`}
      >
        {/* Logo */}
        <div className="flex h-[82px] items-center justify-between border-b border-slate-900/[0.07] px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-[15px] bg-white shadow-[0_10px_25px_rgba(79,124,255,0.12)]">
  <img
    src="/images/logo.png"
    alt="Technical Council"
    className="h-full w-full object-contain"
  />
</div>

            <div>
              <p className="text-sm font-extrabold tracking-tight text-slate-950">
                Technical Council
              </p>

              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.13em] text-slate-400">
                Admin Portal
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden"
          >
            <X size={19} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {/* Workspace */}
          <p className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
            Workspace
          </p>

          <div className="space-y-1">
            <SidebarItem
              icon={LayoutDashboard}
              label="Dashboard"
              href="/admin"
              active={isActive("/admin")}
              onClick={onClose}
            />

            <SidebarItem
               icon={UserPlus}
               label="Applications"
               href="/admin/applications"
               active={isActive("/admin/applications")}
               onClick={onClose}
            />

            <SidebarItem
              icon={Bell}
              label="Notices"
              href="/admin/notices"
              active={isActive("/admin/notices")}
              onClick={onClose}
            />

            <SidebarItem
              icon={CalendarDays}
              label="Events"
              href="/admin/events"
              active={isActive("/admin/events")}
              onClick={onClose}
            />

            <SidebarItem
              icon={Users}
              label="Team"
              href="/admin/team"
              active={isActive("/admin/team")}
              onClick={onClose}
            />

            <SidebarItem
              icon={ImageIcon}
              label="Gallery"
              href="/admin/gallery"
              active={isActive("/admin/gallery")}
              onClick={onClose}
            />
          </div>

          {/* Registration */}
          <p className="mb-2 mt-8 px-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
            Registration
          </p>

          <div className="space-y-1">
            <SidebarItem
              icon={FilePlus2}
              label="Create Registration Page"
              href="/admin/registrations"
              active={isCreateRegistrationActive}
              onClick={onClose}
            />

            <SidebarItem
              icon={ClipboardList}
              label="Monitor Registration"
              href="/admin/registration-monitoring"
              active={isMonitorRegistrationActive}
              onClick={onClose}
            />
          </div>

          {/* Communication */}
          <p className="mb-2 mt-8 px-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
            Communication
          </p>

          <div className="space-y-1">
            <SidebarItem
              icon={Mail}
              label="Messages"
              href="/admin/messages"
              active={isActive("/admin/messages")}
              badge={
                unreadMessages > 0
                  ? String(unreadMessages)
                  : undefined
              }
              onClick={onClose}
            />
          </div>

          {/* System */}
          <p className="mb-2 mt-8 px-3 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
            System
          </p>

          <div className="space-y-1">
            <SidebarItem
              icon={Settings}
              label="Settings"
              href="/admin/settings"
              active={isActive("/admin/settings")}
              onClick={onClose}
            />
          </div>
        </nav>

        {/* Logged-in admin */}
        <div className="border-t border-slate-900/[0.07] p-3">
          <div className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/55 p-3 shadow-sm backdrop-blur-xl">
            {loadingAdmin ? (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100">
                <Loader2
                  size={15}
                  className="animate-spin text-slate-400"
                />
              </div>
            ) : admin?.avatar_url ? (
              <img
                src={admin.avatar_url}
                alt={displayName}
                className="h-9 w-9 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#527dff] to-[#21c997] text-xs font-bold text-white">
                {avatarLetter}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-900">
                {loadingAdmin
                  ? "Loading..."
                  : displayName}
              </p>

              <p className="truncate text-[11px] text-slate-500">
                {displayEmail}
              </p>
            </div>

            <button
              type="button"
              title="Logout"
              aria-label="Logout"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl p-2 text-slate-400 transition hover:bg-white hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loggingOut ? (
                <Loader2
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <LogOut size={17} />
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function SidebarItem({
  icon: Icon,
  label,
  href,
  active = false,
  badge,
  onClick,
}: SidebarItemProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        router.push(href);
        onClick?.();
      }}
      className={`group flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-sm font-bold transition duration-200 ${
        active
          ? "bg-gradient-to-r from-[#527dff] to-[#21c997] text-white shadow-[0_10px_24px_rgba(79,124,255,0.18)]"
          : "text-slate-600 hover:translate-x-0.5 hover:bg-blue-500/[0.05] hover:text-slate-950"
      }`}
    >
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-[10px] ${
          active
            ? "bg-white/15"
            : "bg-slate-100/70 group-hover:bg-white"
        }`}
      >
        <Icon
          size={17}
          className={
            active
              ? "text-white"
              : "text-slate-400 group-hover:text-blue-600"
          }
        />
      </span>

      <span className="flex-1 text-left">
        {label}
      </span>

      {badge && (
        <span
          className={`min-w-[22px] rounded-full px-2 py-0.5 text-center text-[10px] font-bold ${
            active
              ? "bg-white/15 text-white"
              : "bg-rose-50 text-rose-600"
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}