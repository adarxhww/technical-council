"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Bell,
  Check,
  KeyRound,
  Loader2,
  Mail,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserX,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type AdminProfile = {
  id: string;
  name: string;
  email: string;
  role: "admin";
  status: "active" | "inactive";
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
};

type ModalMode = "create" | "edit";

export default function SettingsPage() {
  const supabase = createClient();

  /* =========================================================
     CURRENT ACCOUNT
  ========================================================= */

  const [currentUserId, setCurrentUserId] = useState("");
  const [currentAdmin, setCurrentAdmin] =
    useState<AdminProfile | null>(null);

  const [accountName, setAccountName] = useState("");
  const [accountEmail, setAccountEmail] = useState("");

  const [accountPassword, setAccountPassword] = useState("");
  const [accountConfirmPassword, setAccountConfirmPassword] =
    useState("");

  const [accountSaving, setAccountSaving] = useState(false);

  /* =========================================================
     ADMIN MANAGEMENT
  ========================================================= */

  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [refreshingAdmins, setRefreshingAdmins] = useState(false);

  const [adminSearch, setAdminSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] =
    useState<ModalMode>("create");

  const [selectedAdmin, setSelectedAdmin] =
    useState<AdminProfile | null>(null);

  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const [adminSaving, setAdminSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  /* =========================================================
     NOTIFICATIONS
  ========================================================= */

  const [emailNotifications, setEmailNotifications] =
    useState(true);

  const [newAdminNotifications, setNewAdminNotifications] =
    useState(true);

  const [systemNotifications, setSystemNotifications] =
    useState(true);

  /* =========================================================
     FEEDBACK
  ========================================================= */

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* =========================================================
     LOAD CURRENT ADMIN + ADMINS
  ========================================================= */

  async function loadSettings(showRefresh = false) {
    if (showRefresh) {
      setRefreshingAdmins(true);
    } else {
      setLoadingAdmins(true);
    }

    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(
          "Your session has expired. Please sign in again."
        );
      }

      setCurrentUserId(user.id);

      const { data, error: adminsError } = await supabase
        .from("admin_profiles")
        .select(
          "id, name, email, role, status, avatar_url, created_at, updated_at, last_login_at"
        )
        .order("created_at", {
          ascending: false,
        });

      if (adminsError) {
        throw new Error(adminsError.message);
      }

      const adminList = (data ?? []) as AdminProfile[];

      setAdmins(adminList);

      const me =
        adminList.find((admin) => admin.id === user.id) ??
        null;

      setCurrentAdmin(me);

      if (me) {
        setAccountName(me.name);
        setAccountEmail(me.email);
      }
    } catch (loadError) {
      console.error(loadError);

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load settings."
      );
    } finally {
      setLoadingAdmins(false);
      setRefreshingAdmins(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  /* =========================================================
     ADMIN COUNTS
  ========================================================= */

  const activeCount = admins.filter(
    (admin) => admin.status === "active"
  ).length;

  const inactiveCount = admins.filter(
    (admin) => admin.status === "inactive"
  ).length;

  const filteredAdmins = useMemo(() => {
    const query = adminSearch.trim().toLowerCase();

    if (!query) {
      return admins;
    }

    return admins.filter(
      (admin) =>
        admin.name.toLowerCase().includes(query) ||
        admin.email.toLowerCase().includes(query)
    );
  }, [admins, adminSearch]);

  /* =========================================================
     CURRENT ACCOUNT UPDATE
  ========================================================= */

  async function saveMyAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const name = accountName.trim();
    const email = accountEmail.trim().toLowerCase();

    if (!name) {
      setError("Please enter your name.");
      return;
    }

    if (!email) {
      setError("Please enter your email.");
      return;
    }

    if (
      accountPassword &&
      accountPassword.length < 8
    ) {
      setError(
        "New password must contain at least 8 characters."
      );
      return;
    }

    if (
      accountPassword &&
      accountPassword !== accountConfirmPassword
    ) {
      setError("Passwords do not match.");
      return;
    }

    if (!currentUserId) {
      setError("Unable to identify your admin account.");
      return;
    }

    setAccountSaving(true);

    try {
      const response = await fetch(
        `/api/admins/${currentUserId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            ...(accountPassword
              ? {
                  password: accountPassword,
                }
              : {}),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ?? "Unable to update your account."
        );
      }

      setAccountPassword("");
      setAccountConfirmPassword("");

      setSuccess("Your account has been updated successfully.");

      await loadSettings();
    } catch (accountError) {
      console.error(accountError);

      setError(
        accountError instanceof Error
          ? accountError.message
          : "Unable to update your account."
      );
    } finally {
      setAccountSaving(false);
    }
  }

  /* =========================================================
     ADMIN MODAL
  ========================================================= */

  function openCreateAdmin() {
    setModalMode("create");
    setSelectedAdmin(null);

    setAdminName("");
    setAdminEmail("");
    setAdminPassword("");

    setError("");
    setSuccess("");

    setModalOpen(true);
  }

  function openEditAdmin(admin: AdminProfile) {
    setModalMode("edit");
    setSelectedAdmin(admin);

    setAdminName(admin.name);
    setAdminEmail(admin.email);
    setAdminPassword("");

    setError("");
    setSuccess("");

    setModalOpen(true);
  }

  function closeAdminModal() {
    if (adminSaving) {
      return;
    }

    setModalOpen(false);
    setSelectedAdmin(null);

    setAdminName("");
    setAdminEmail("");
    setAdminPassword("");

    setError("");
  }

  /* =========================================================
     CREATE / EDIT ADMIN
  ========================================================= */

  async function saveAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const name = adminName.trim();
    const email = adminEmail.trim().toLowerCase();

    if (!name) {
      setError("Please enter the admin name.");
      return;
    }

    if (!email) {
      setError("Please enter the admin email.");
      return;
    }

    if (modalMode === "create" && !adminPassword) {
      setError("Please enter a password.");
      return;
    }

    if (
      adminPassword &&
      adminPassword.length < 8
    ) {
      setError(
        "Password must contain at least 8 characters."
      );
      return;
    }

    setAdminSaving(true);

    try {
      if (modalMode === "create") {
        const response = await fetch("/api/admins", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            password: adminPassword,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ?? "Unable to create admin."
          );
        }

        setSuccess("Administrator created successfully.");

        await loadSettings();

        setTimeout(() => {
          setModalOpen(false);
          setSuccess("");
        }, 700);
      } else {
        if (!selectedAdmin) {
          throw new Error("No administrator selected.");
        }

        const response = await fetch(
          `/api/admins/${selectedAdmin.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name,
              email,
              ...(adminPassword
                ? {
                    password: adminPassword,
                  }
                : {}),
            }),
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ?? "Unable to update admin."
          );
        }

        setSuccess("Administrator updated successfully.");

        await loadSettings();

        setTimeout(() => {
          setModalOpen(false);
          setSuccess("");
        }, 700);
      }
    } catch (adminError) {
      console.error(adminError);

      setError(
        adminError instanceof Error
          ? adminError.message
          : "Something went wrong."
      );
    } finally {
      setAdminSaving(false);
    }
  }

  /* =========================================================
     ACTIVATE / DEACTIVATE
  ========================================================= */

  async function toggleAdminStatus(admin: AdminProfile) {
    setError("");
    setSuccess("");

    const nextStatus =
      admin.status === "active"
        ? "inactive"
        : "active";

    if (
      admin.id === currentUserId &&
      nextStatus === "inactive"
    ) {
      const confirmed = window.confirm(
        "Deactivate your own account?\n\nYou will lose access to the admin portal."
      );

      if (!confirmed) {
        return;
      }
    }

    try {
      const response = await fetch(
        `/api/admins/${admin.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: nextStatus,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ??
            "Unable to update administrator status."
        );
      }

      setSuccess(
        nextStatus === "active"
          ? `${admin.name} has been activated.`
          : `${admin.name} has been deactivated.`
      );

      await loadSettings();
    } catch (statusError) {
      console.error(statusError);

      setError(
        statusError instanceof Error
          ? statusError.message
          : "Unable to update administrator status."
      );
    }
  }

  /* =========================================================
     DELETE ADMIN
  ========================================================= */

  async function deleteAdmin(admin: AdminProfile) {
    if (admin.id === currentUserId) {
      setError("You cannot delete your own account.");
      return;
    }

    const confirmed = window.confirm(
      `Delete "${admin.name}" permanently?\n\nThis will remove their administrator login and account.`
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(admin.id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/admins/${admin.id}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ?? "Unable to delete administrator."
        );
      }

      setSuccess(`${admin.name} has been deleted.`);

      await loadSettings();
    } catch (deleteError) {
      console.error(deleteError);

      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete administrator."
      );
    } finally {
      setDeletingId("");
    }
  }

  /* =========================================================
     NOTIFICATION SAVE
  ========================================================= */

  function saveNotifications() {
    setError("");
    setSuccess("Notification preferences saved.");

    // These can later be connected to a Supabase settings table.
  }

  /* =========================================================
     HELPERS
  ========================================================= */

  function formatDate(date: string | null) {
    if (!date) {
      return "Never";
    }

    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  }

  return (
    <main className="min-h-screen bg-[#f6f7fb] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

        <div className="mb-8">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-blue-500">
            Administration
          </p>

          <h1 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
            Settings
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage your account, administrators and portal
            preferences.
          </p>
        </div>

        {/* =====================================================
            GLOBAL FEEDBACK
        ===================================================== */}

        {error && (
          <div className="mb-5 flex items-start justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
            <p className="text-sm font-medium text-rose-600">
              {error}
            </p>

            <button
              type="button"
              onClick={() => setError("")}
              className="text-rose-400 transition hover:text-rose-600"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white">
              <Check size={15} />
            </div>

            <p className="text-sm font-medium text-emerald-700">
              {success}
            </p>
          </div>
        )}

        <div className="space-y-6">

          {/* ===================================================
              MY ACCOUNT
          =================================================== */}

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <ShieldCheck size={19} />
                </div>

                <div>
                  <h2 className="text-sm font-bold text-slate-950">
                    My Account
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Manage your administrator account details.
                  </p>
                </div>
              </div>
            </div>

            <form
              onSubmit={saveMyAccount}
              className="p-5"
            >
              <div className="grid gap-5 lg:grid-cols-2">

                {/* NAME */}

                <div>
                  <label
                    htmlFor="account-name"
                    className="mb-2 block text-xs font-semibold text-slate-600"
                  >
                    Name
                  </label>

                  <input
                    id="account-name"
                    type="text"
                    value={accountName}
                    onChange={(event) =>
                      setAccountName(event.target.value)
                    }
                    disabled={accountSaving}
                    placeholder="Your name"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/[0.08] disabled:opacity-60"
                  />
                </div>

                {/* EMAIL */}

                <div>
                  <label
                    htmlFor="account-email"
                    className="mb-2 block text-xs font-semibold text-slate-600"
                  >
                    Email Address
                  </label>

                  <div className="relative">
                    <Mail
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="account-email"
                      type="email"
                      value={accountEmail}
                      onChange={(event) =>
                        setAccountEmail(event.target.value)
                      }
                      disabled={accountSaving}
                      placeholder="admin@example.com"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/[0.08] disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* NEW PASSWORD */}

                <div>
                  <label
                    htmlFor="account-password"
                    className="mb-2 block text-xs font-semibold text-slate-600"
                  >
                    New Password
                  </label>

                  <div className="relative">
                    <KeyRound
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="account-password"
                      type="password"
                      value={accountPassword}
                      onChange={(event) =>
                        setAccountPassword(
                          event.target.value
                        )
                      }
                      disabled={accountSaving}
                      placeholder="Leave blank to keep current password"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/[0.08] disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* CONFIRM PASSWORD */}

                <div>
                  <label
                    htmlFor="account-confirm-password"
                    className="mb-2 block text-xs font-semibold text-slate-600"
                  >
                    Confirm New Password
                  </label>

                  <div className="relative">
                    <KeyRound
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="account-confirm-password"
                      type="password"
                      value={accountConfirmPassword}
                      onChange={(event) =>
                        setAccountConfirmPassword(
                          event.target.value
                        )
                      }
                      disabled={accountSaving}
                      placeholder="Repeat new password"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/[0.08] disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>

              {/* ACCOUNT INFO */}

              {currentAdmin && (
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-slate-50 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Role
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      Administrator
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Status
                    </p>

                    <p className="mt-1 text-sm font-semibold text-emerald-600">
                      {currentAdmin.status === "active"
                        ? "Active"
                        : "Inactive"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Account Created
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {formatDate(currentAdmin.created_at)}
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-5 flex justify-end border-t border-slate-100 pt-5">
                <button
                  type="submit"
                  disabled={accountSaving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-emerald-600 hover:to-blue-700 disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-400"
                >
                  {accountSaving ? (
                    <>
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Save Account
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>

          {/* ===================================================
              ADMINISTRATORS
          =================================================== */}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-100 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <UserCheck size={19} />
                    </div>

                    <div>
                      <h2 className="text-sm font-bold text-slate-950">
                        Administrators
                      </h2>

                      <p className="mt-1 text-xs text-slate-500">
                        All administrators have equal access.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={openCreateAdmin}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-emerald-600 hover:to-blue-700"
                >
                  <Plus size={17} />
                  Add Admin
                </button>
              </div>
            </div>

            {/* ADMIN STATS */}

            <div className="grid grid-cols-1 gap-4 border-b border-slate-100 p-5 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Total Admins
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-950">
                  {admins.length}
                </p>
              </div>

              <div className="rounded-xl bg-emerald-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-500">
                  Active
                </p>

                <p className="mt-2 text-2xl font-bold text-emerald-700">
                  {activeCount}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Inactive
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-700">
                  {inactiveCount}
                </p>
              </div>
            </div>

            {/* SEARCH / REFRESH */}

            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                {filteredAdmins.length} administrator
                {filteredAdmins.length === 1 ? "" : "s"}
                displayed
              </p>

              <div className="flex gap-2">
                <div className="relative w-full sm:w-64">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="text"
                    value={adminSearch}
                    onChange={(event) =>
                      setAdminSearch(event.target.value)
                    }
                    placeholder="Search admins..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/[0.08]"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => loadSettings(true)}
                  disabled={refreshingAdmins}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50"
                  title="Refresh"
                >
                  <RefreshCw
                    size={16}
                    className={
                      refreshingAdmins
                        ? "animate-spin"
                        : ""
                    }
                  />
                </button>
              </div>
            </div>

            {/* ADMIN LIST */}

            {loadingAdmins ? (
              <div className="flex min-h-56 items-center justify-center">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                  Loading administrators...
                </div>
              </div>
            ) : filteredAdmins.length === 0 ? (
              <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <ShieldCheck size={22} />
                </div>

                <h3 className="mt-4 text-sm font-bold text-slate-900">
                  {adminSearch
                    ? "No administrators found"
                    : "No administrators yet"}
                </h3>

                {!adminSearch && (
                  <button
                    type="button"
                    onClick={openCreateAdmin}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:from-emerald-600 hover:to-blue-700"
                  >
                    <Plus size={16} />
                    Add Admin
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* DESKTOP */}

                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70">
                        <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          Administrator
                        </th>

                        <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          Status
                        </th>

                        <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          Created
                        </th>

                        <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredAdmins.map((admin) => (
                        <tr
                          key={admin.id}
                          className="border-b border-slate-100 last:border-0"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 text-sm font-bold text-white">
                                {admin.name
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="truncate text-sm font-semibold text-slate-900">
                                    {admin.name}
                                  </p>

                                  {admin.id ===
                                    currentUserId && (
                                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
                                      You
                                    </span>
                                  )}
                                </div>

                                <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                                  <Mail size={12} />
                                  {admin.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            {admin.status === "active" ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                Inactive
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4 text-xs text-slate-500">
                            {formatDate(admin.created_at)}
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-2">

                              <button
                                type="button"
                                onClick={() =>
                                  openEditAdmin(admin)
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                              >
                                <Pencil size={14} />
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  toggleAdminStatus(admin)
                                }
                                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition ${
                                  admin.status === "active"
                                    ? "border border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100"
                                    : "border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                }`}
                              >
                                {admin.status ===
                                "active" ? (
                                  <>
                                    <UserX size={14} />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <UserCheck size={14} />
                                    Activate
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  deleteAdmin(admin)
                                }
                                disabled={
                                  deletingId === admin.id
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {deletingId ===
                                admin.id ? (
                                  <Loader2
                                    size={14}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Trash2 size={14} />
                                )}

                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* MOBILE */}

                <div className="divide-y divide-slate-100 md:hidden">
                  {filteredAdmins.map((admin) => (
                    <div
                      key={admin.id}
                      className="p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 text-sm font-bold text-white">
                          {admin.name
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {admin.name}
                            </p>

                            {admin.id ===
                              currentUserId && (
                              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
                                You
                              </span>
                            )}
                          </div>

                          <p className="mt-1 break-all text-xs text-slate-500">
                            {admin.email}
                          </p>

                          <div className="mt-2">
                            {admin.status ===
                            "active" ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                Inactive
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            openEditAdmin(admin)
                          }
                          className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 px-2 py-2 text-xs font-semibold text-slate-600"
                        >
                          <Pencil size={13} />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            toggleAdminStatus(admin)
                          }
                          className={`inline-flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold ${
                            admin.status === "active"
                              ? "border border-amber-200 bg-amber-50 text-amber-600"
                              : "border border-emerald-200 bg-emerald-50 text-emerald-600"
                          }`}
                        >
                          {admin.status === "active" ? (
                            <>
                              <UserX size={13} />
                              Off
                            </>
                          ) : (
                            <>
                              <UserCheck size={13} />
                              On
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deleteAdmin(admin)
                          }
                          disabled={
                            deletingId === admin.id
                          }
                          className="inline-flex items-center justify-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-2 text-xs font-semibold text-rose-600 disabled:opacity-50"
                        >
                          {deletingId === admin.id ? (
                            <Loader2
                              size={13}
                              className="animate-spin"
                            />
                          ) : (
                            <Trash2 size={13} />
                          )}

                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          {/* ===================================================
              NOTIFICATIONS
          =================================================== */}

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <Bell size={19} />
                </div>

                <div>
                  <h2 className="text-sm font-bold text-slate-950">
                    Notifications
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Choose which administrator notifications
                    you want to receive.
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-100">

              {/* EMAIL */}

              <div className="flex items-center justify-between gap-5 p-5">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Email Notifications
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Receive important website and administration
                    updates by email.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setEmailNotifications(
                      !emailNotifications
                    )
                  }
                  aria-pressed={emailNotifications}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                    emailNotifications
                      ? "bg-emerald-500"
                      : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
                      emailNotifications
                        ? "left-6"
                        : "left-1"
                    }`}
                  />
                </button>
              </div>

              {/* NEW ADMIN */}

              <div className="flex items-center justify-between gap-5 p-5">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    New Admin Alerts
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Notify you when an administrator account is
                    created or changed.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setNewAdminNotifications(
                      !newAdminNotifications
                    )
                  }
                  aria-pressed={newAdminNotifications}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                    newAdminNotifications
                      ? "bg-emerald-500"
                      : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
                      newAdminNotifications
                        ? "left-6"
                        : "left-1"
                    }`}
                  />
                </button>
              </div>

              {/* SYSTEM */}

              <div className="flex items-center justify-between gap-5 p-5">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    System Notifications
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Receive important system and website alerts.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSystemNotifications(
                      !systemNotifications
                    )
                  }
                  aria-pressed={systemNotifications}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                    systemNotifications
                      ? "bg-emerald-500"
                      : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
                      systemNotifications
                        ? "left-6"
                        : "left-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-100 p-5">
              <button
                type="button"
                onClick={saveNotifications}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-emerald-600 hover:to-blue-700"
              >
                <Check size={16} />
                Save Notifications
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* =======================================================
          ADD / EDIT ADMIN MODAL
      ======================================================= */}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeAdminModal();
            }
          }}
        >
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">

            <div className="flex items-start justify-between border-b border-slate-100 p-5">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 text-white">
                    <ShieldCheck size={18} />
                  </div>

                  <h2 className="text-base font-bold text-slate-950">
                    {modalMode === "create"
                      ? "Add Administrator"
                      : "Edit Administrator"}
                  </h2>
                </div>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  {modalMode === "create"
                    ? "Create another administrator with the same access level as you."
                    : "Update this administrator's account details."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeAdminModal}
                disabled={adminSaving}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={saveAdmin}
              className="space-y-5 p-5"
            >
              {/* NAME */}

              <div>
                <label
                  htmlFor="new-admin-name"
                  className="mb-2 block text-xs font-semibold text-slate-600"
                >
                  Full Name
                </label>

                <input
                  id="new-admin-name"
                  type="text"
                  value={adminName}
                  onChange={(event) =>
                    setAdminName(event.target.value)
                  }
                  disabled={adminSaving}
                  placeholder="Enter admin name"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/[0.08] disabled:opacity-60"
                />
              </div>

              {/* EMAIL */}

              <div>
                <label
                  htmlFor="new-admin-email"
                  className="mb-2 block text-xs font-semibold text-slate-600"
                >
                  Email Address
                </label>

                <div className="relative">
                  <Mail
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="new-admin-email"
                    type="email"
                    value={adminEmail}
                    onChange={(event) =>
                      setAdminEmail(event.target.value)
                    }
                    disabled={adminSaving}
                    placeholder="admin@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/[0.08] disabled:opacity-60"
                  />
                </div>
              </div>

              {/* PASSWORD */}

              <div>
                <label
                  htmlFor="new-admin-password"
                  className="mb-2 block text-xs font-semibold text-slate-600"
                >
                  {modalMode === "create"
                    ? "Password"
                    : "New Password"}
                </label>

                <div className="relative">
                  <KeyRound
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="new-admin-password"
                    type="password"
                    value={adminPassword}
                    onChange={(event) =>
                      setAdminPassword(
                        event.target.value
                      )
                    }
                    disabled={adminSaving}
                    placeholder={
                      modalMode === "create"
                        ? "Minimum 8 characters"
                        : "Leave blank to keep current password"
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/[0.08] disabled:opacity-60"
                  />
                </div>

                <p className="mt-2 text-[11px] text-slate-400">
                  Password must contain at least 8 characters.
                </p>
              </div>

              {/* MODAL ERROR */}

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                  <p className="text-xs font-medium leading-5 text-rose-600">
                    {error}
                  </p>
                </div>
              )}

              {/* MODAL ACTIONS */}

              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeAdminModal}
                  disabled={adminSaving}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={adminSaving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-emerald-600 hover:to-blue-700 disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-400"
                >
                  {adminSaving ? (
                    <>
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                      {modalMode === "create"
                        ? "Creating..."
                        : "Saving..."}
                    </>
                  ) : (
                    <>
                      {modalMode === "create" ? (
                        <Plus size={16} />
                      ) : (
                        <Check size={16} />
                      )}

                      {modalMode === "create"
                        ? "Create Admin"
                        : "Save Changes"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}