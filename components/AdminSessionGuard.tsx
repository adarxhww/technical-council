"use client";

import { useEffect, useRef, useState } from "react";

const INACTIVITY_MS = 10 * 60 * 1000;
const WARNING_MS = 60 * 1000;
const MAX_SESSION_MS = 12 * 60 * 60 * 1000;
const ACTIVITY_SYNC_MS = 30 * 1000;

const SESSION_STARTED_KEY = "tc_admin_session_started_at";

const SESSION_RETRY_COUNT = 8;
const SESSION_RETRY_DELAY_MS = 500;

export default function AdminSessionGuard() {
  const [warning, setWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);

  const lastActivityRef = useRef(Date.now());
  const sessionStartedRef = useRef<number | null>(null);
  const lastSyncRef = useRef(0);
  const loggingOutRef = useRef(false);
  const initializedRef = useRef(false);

  /*
   * =========================================================
   * SESSION / ACTIVITY MANAGEMENT
   * =========================================================
   */

  useEffect(() => {
    let mounted = true;

    /*
     * Restore the original session start time.
     *
     * sessionStorage survives:
     * - page refresh
     * - navigation between /admin pages
     * - normal tab switching
     */
    const storedStartedAt = sessionStorage.getItem(
      SESSION_STARTED_KEY
    );

    const parsedStartedAt = storedStartedAt
      ? Number(storedStartedAt)
      : NaN;

    if (
      Number.isFinite(parsedStartedAt) &&
      parsedStartedAt > 0
    ) {
      sessionStartedRef.current = parsedStartedAt;
    }

    lastActivityRef.current = Date.now();

    /*
     * Synchronize browser activity with the
     * server-side admin session.
     */
    async function syncSessionActivity(
      force = false
    ) {
      if (!mounted) {
        return false;
      }

      const now = Date.now();

      if (
        !force &&
        now - lastSyncRef.current <
          ACTIVITY_SYNC_MS
      ) {
        return true;
      }

      lastSyncRef.current = now;

      try {
        const response = await fetch(
          "/api/auth/admin-session",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              startedAt:
                sessionStartedRef.current ??
                undefined,
              lastActivityAt: now,
            }),
          }
        );

        if (!response.ok) {
          return false;
        }

        const result = await response
          .json()
          .catch(() => null);

        /*
         * If the server supplied the original
         * session start time, preserve it locally.
         */
        if (
          result?.startedAt &&
          !sessionStartedRef.current
        ) {
          const startedAt = Number(
            result.startedAt
          );

          if (
            Number.isFinite(startedAt) &&
            startedAt > 0
          ) {
            sessionStartedRef.current =
              startedAt;

            sessionStorage.setItem(
              SESSION_STARTED_KEY,
              String(startedAt)
            );
          }
        }

        return true;
      } catch {
        /*
         * Network/session restoration failures
         * do not log the administrator out.
         */
        return false;
      }
    }

    /*
     * Give Supabase/browser authentication time
     * to restore the session after login or refresh.
     */
    async function initializeAdminSession() {
      if (
        !mounted ||
        initializedRef.current
      ) {
        return;
      }

      for (
        let attempt = 0;
        attempt < SESSION_RETRY_COUNT;
        attempt += 1
      ) {
        if (!mounted) {
          return;
        }

        const synced =
          await syncSessionActivity(true);

        if (synced) {
          initializedRef.current = true;
          return;
        }

        if (
          attempt <
          SESSION_RETRY_COUNT - 1
        ) {
          await new Promise<void>(
            (resolve) => {
              window.setTimeout(
                resolve,
                SESSION_RETRY_DELAY_MS
              );
            }
          );
        }
      }

      /*
       * Do not force logout here.
       * Middleware/server authentication remains
       * authoritative for /admin.
       */
      initializedRef.current = true;
    }

    void initializeAdminSession();

    /*
     * Record genuine user activity.
     */
    function recordActivity() {
      lastActivityRef.current = Date.now();
      setWarning(false);

      void syncSessionActivity();
    }

    const activityEvents = [
      "pointerdown",
      "keydown",
      "touchstart",
      "scroll",
    ] as const;

    activityEvents.forEach((event) => {
      window.addEventListener(
        event,
        recordActivity,
        {
          passive: true,
        }
      );
    });

    /*
     * Automatic logout for:
     *
     * 1. 10 minutes of inactivity
     * 2. 12-hour maximum session lifetime
     */
    async function logout(
      reason:
        | "inactivity"
        | "max-lifetime"
    ) {
      if (loggingOutRef.current) {
        return;
      }

      loggingOutRef.current = true;

      try {
        await fetch(
          "/api/auth/logout",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              reason,
            }),
            keepalive: true,
          }
        );
      } catch {
        /*
         * Even if the logout request fails,
         * leave the protected admin area.
         */
      } finally {
        sessionStorage.removeItem(
          SESSION_STARTED_KEY
        );

        window.location.replace(
          "/login?reason=session-expired"
        );
      }
    }

    /*
     * Check inactivity and maximum session
     * lifetime every second.
     */
    const interval = window.setInterval(() => {
      if (!mounted) {
        return;
      }

      const now = Date.now();

      const inactiveFor =
        now - lastActivityRef.current;

      const sessionStarted =
        sessionStartedRef.current;

      const sessionAge = sessionStarted
        ? now - sessionStarted
        : 0;

      /*
       * Maximum session lifetime.
       */
      if (
        sessionStarted &&
        sessionAge >= MAX_SESSION_MS
      ) {
        void logout("max-lifetime");
        return;
      }

      /*
       * Automatic logout after 10 minutes
       * without activity.
       */
      if (
        inactiveFor >= INACTIVITY_MS
      ) {
        void logout("inactivity");
        return;
      }

      /*
       * Show warning during final 60 seconds.
       */
      const remaining =
        INACTIVITY_MS - inactiveFor;

      if (remaining <= WARNING_MS) {
        setWarning(true);

        setSecondsLeft(
          Math.max(
            1,
            Math.ceil(
              remaining / 1000
            )
          )
        );
      } else {
        setWarning(false);
      }
    }, 1000);

    /*
     * When the administrator returns to the tab:
     *
     * - Switching tabs does NOT automatically log out.
     * - If inactivity was actually exceeded, logout occurs.
     * - Otherwise returning to the tab counts as activity.
     */
    function handleVisibilityChange() {
      if (
        document.visibilityState !==
        "visible"
      ) {
        return;
      }

      const now = Date.now();

      const inactiveFor =
        now - lastActivityRef.current;

      const sessionStarted =
        sessionStartedRef.current;

      const sessionAge = sessionStarted
        ? now - sessionStarted
        : 0;

      if (
        sessionStarted &&
        sessionAge >= MAX_SESSION_MS
      ) {
        void logout("max-lifetime");
        return;
      }

      if (
        inactiveFor >= INACTIVITY_MS
      ) {
        void logout("inactivity");
        return;
      }

      /*
       * Returning to the tab counts as activity.
       */
      recordActivity();
    }

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      mounted = false;

      window.clearInterval(interval);

      activityEvents.forEach((event) => {
        window.removeEventListener(
          event,
          recordActivity
        );
      });

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, []);

  /*
   * =========================================================
   * PUBLIC NAVIGATION DETECTOR
   * =========================================================
   *
   * IMPORTANT:
   *
   * This listener must NOT treat downloads or
   * "open in new tab" actions as leaving /admin.
   */

  useEffect(() => {
    async function handlePublicNavigation(
      event: MouseEvent
    ) {
      const target =
        event.target as HTMLElement | null;

      const anchor =
        target?.closest("a[href]") as
          | HTMLAnchorElement
          | null;

      if (!anchor) {
        return;
      }

      /*
       * Ignore modified clicks:
       *
       * Ctrl/Cmd-click
       * middle-click
       * Shift-click
       * Alt-click
       */
      if (
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey ||
        event.button !== 0
      ) {
        return;
      }

      /*
       * =====================================================
       * FIX #1 — CSV / FILE DOWNLOAD
       * =====================================================
       *
       * The CSV exporter creates a temporary anchor:
       *
       *   <a download href="blob:...">
       *
       * Its click bubbles to document.
       *
       * Without this check, the guard thinks the admin
       * is navigating away and calls /api/auth/logout.
       */
      if (
        anchor.hasAttribute("download") ||
        anchor.href.startsWith("blob:")
      ) {
        return;
      }

      /*
       * =====================================================
       * FIX #2 — RESUME / NEW TAB
       * =====================================================
       *
       * Resume viewing can use:
       *
       *   target="_blank"
       *
       * or:
       *
       *   rel="noopener noreferrer"
       *
       * These actions are NOT an admin navigation.
       *
       * Never log out because of them.
       */
      if (
        anchor.target === "_blank" ||
        anchor.rel.includes("noopener") ||
        anchor.rel.includes("noreferrer")
      ) {
        return;
      }

      /*
       * Build the destination URL.
       */
      const url = new URL(
        anchor.href,
        window.location.origin
      );

      /*
       * Only handle same-origin navigation.
       *
       * External links are left to the browser.
       */
      if (
        url.origin !==
        window.location.origin
      ) {
        return;
      }

      /*
       * =====================================================
       * ADMIN NAVIGATION
       * =====================================================
       *
       * Anything inside /admin remains authenticated.
       */
      const staysInsideAdmin =
        url.pathname === "/admin" ||
        url.pathname.startsWith("/admin/");

      if (staysInsideAdmin) {
        return;
      }

      /*
       * =====================================================
       * GENUINELY LEAVING ADMIN
       * =====================================================
       *
       * Only now do we terminate the admin session.
       */
      event.preventDefault();

      try {
        await fetch(
          "/api/auth/logout",
          {
            method: "POST",
            credentials: "include",
            keepalive: true,
          }
        );
      } catch {
        /*
         * Navigate anyway.
         */
      } finally {
        sessionStorage.removeItem(
          SESSION_STARTED_KEY
        );

        window.location.assign(
          anchor.href
        );
      }
    }

    document.addEventListener(
      "click",
      handlePublicNavigation
    );

    return () => {
      document.removeEventListener(
        "click",
        handlePublicNavigation
      );
    };
  }, []);

  /*
   * =========================================================
   * WARNING UI
   * =========================================================
   */

  if (!warning) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 top-0 z-[9999] flex justify-center px-4 pt-4">
      <div className="w-full max-w-xl rounded-2xl border border-amber-200 bg-white px-5 py-4 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            !
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-900">
              Your admin session is about to expire
            </p>

            <p className="mt-1 text-sm text-slate-500">
              You will be logged out
              automatically after{" "}
              {secondsLeft} seconds of
              inactivity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}