"use client";

import { useEffect, useRef, useState } from "react";

const INACTIVITY_MS = 10 * 60 * 1000;
const WARNING_MS = 60 * 1000;
const MAX_SESSION_MS = 12 * 60 * 60 * 1000;
const ACTIVITY_SYNC_MS = 30 * 1000;

const SESSION_STARTED_KEY =
  "tc_admin_session_started_at";

const TAB_ID_KEY =
  "tc_admin_tab_id";

const SESSION_RETRY_COUNT = 8;
const SESSION_RETRY_DELAY_MS = 500;

export default function AdminSessionGuard() {
  const [warning, setWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);

  const lastActivityRef = useRef(Date.now());
  const sessionStartedRef = useRef<number | null>(null);
  const tabIdRef = useRef<string | null>(null);
  const lastSyncRef = useRef(0);
  const loggingOutRef = useRef(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    /*
     * Every browser tab gets its own ID.
     *
     * sessionStorage survives refresh/navigation
     * in the same tab but disappears when the tab
     * is closed.
     */
    let tabId =
      sessionStorage.getItem(TAB_ID_KEY);

    if (!tabId) {
      /*
       * A new tab must NOT create an authenticated
       * admin session by itself.
       *
       * The login page creates the tab ID when
       * authentication succeeds.
       */
      tabId = null;
    }

    tabIdRef.current = tabId;

    const storedStartedAt =
      sessionStorage.getItem(
        SESSION_STARTED_KEY
      );

    const parsedStartedAt = storedStartedAt
      ? Number(storedStartedAt)
      : NaN;

    if (
      Number.isFinite(parsedStartedAt) &&
      parsedStartedAt > 0
    ) {
      sessionStartedRef.current =
        parsedStartedAt;
    }

    lastActivityRef.current = Date.now();

    async function logout(
      reason:
        | "inactivity"
        | "max-lifetime"
        | "tab-session-expired"
        | "session-invalid"
    ) {
      if (loggingOutRef.current) return;

      loggingOutRef.current = true;

      try {
        await fetch(
          "/api/auth/logout",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              reason,
              tabId:
                tabIdRef.current,
            }),
            keepalive: true,
          }
        );
      } catch {
        // Leave the protected admin area anyway.
      } finally {
        sessionStorage.removeItem(
          SESSION_STARTED_KEY
        );

        sessionStorage.removeItem(
          TAB_ID_KEY
        );

        window.location.replace(
          "/login?reason=session-expired"
        );
      }
    }

    async function syncSessionActivity(
      force = false
    ) {
      if (!mounted) return false;

      /*
       * If there is no tab ID, this page was opened
       * in a new browser tab instead of through login.
       */
      if (!tabIdRef.current) {
        void logout("session-invalid");
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
        const response =
          await fetch(
            "/api/auth/admin-session",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              credentials: "include",
              body: JSON.stringify({
                tabId:
                  tabIdRef.current,
                startedAt:
                  sessionStartedRef.current ??
                  undefined,
                lastActivityAt: now,
              }),
            }
          );

        /*
         * 401 means the tab session no longer
         * exists or has expired.
         */
        if (response.status === 401) {
          void logout(
            "tab-session-expired"
          );
          return false;
        }

        if (!response.ok) {
          return false;
        }

        const result =
          await response
            .json()
            .catch(() => null);

        if (
          result?.startedAt &&
          !sessionStartedRef.current
        ) {
          const startedAt =
            Number(result.startedAt);

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
         * Temporary network failures should not
         * immediately log the admin out.
         */
        return false;
      }
    }

    async function initializeAdminSession() {
      if (
        !mounted ||
        initializedRef.current
      ) {
        return;
      }

      /*
       * A missing tab ID means this tab was not
       * created through the login flow.
       */
      if (!tabIdRef.current) {
        initializedRef.current = true;

        void logout(
          "session-invalid"
        );

        return;
      }

      for (
        let attempt = 0;
        attempt < SESSION_RETRY_COUNT;
        attempt += 1
      ) {
        if (!mounted) return;

        const synced =
          await syncSessionActivity(
            true
          );

        if (synced) {
          initializedRef.current =
            true;

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

      initializedRef.current =
        true;
    }

    void initializeAdminSession();

    function recordActivity() {
      lastActivityRef.current =
        Date.now();

      setWarning(false);

      void syncSessionActivity();
    }

    const activityEvents = [
      "pointerdown",
      "keydown",
      "touchstart",
      "scroll",
    ] as const;

    activityEvents.forEach(
      (event) => {
        window.addEventListener(
          event,
          recordActivity,
          {
            passive: true,
          }
        );
      }
    );

    const interval =
      window.setInterval(() => {
        if (!mounted) return;

        const now = Date.now();

        const inactiveFor =
          now -
          lastActivityRef.current;

        const sessionStarted =
          sessionStartedRef.current;

        const sessionAge =
          sessionStarted
            ? now - sessionStarted
            : 0;

        if (
          sessionStarted &&
          sessionAge >=
            MAX_SESSION_MS
        ) {
          void logout(
            "max-lifetime"
          );

          return;
        }

        if (
          inactiveFor >=
          INACTIVITY_MS
        ) {
          void logout(
            "inactivity"
          );

          return;
        }

        /*
         * Heartbeat.
         *
         * This runs independently of user
         * activity so that an open tab continues
         * proving that it is alive.
         */
        void syncSessionActivity();

        const remaining =
          INACTIVITY_MS -
          inactiveFor;

        if (
          remaining <= WARNING_MS
        ) {
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

    function handleVisibilityChange() {
      if (
        document.visibilityState !==
        "visible"
      ) {
        return;
      }

      const now = Date.now();

      const inactiveFor =
        now -
        lastActivityRef.current;

      const sessionStarted =
        sessionStartedRef.current;

      const sessionAge =
        sessionStarted
          ? now - sessionStarted
          : 0;

      if (
        sessionStarted &&
        sessionAge >=
          MAX_SESSION_MS
      ) {
        void logout(
          "max-lifetime"
        );

        return;
      }

      if (
        inactiveFor >=
        INACTIVITY_MS
      ) {
        void logout(
          "inactivity"
        );

        return;
      }

      recordActivity();
    }

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      mounted = false;

      window.clearInterval(
        interval
      );

      activityEvents.forEach(
        (event) => {
          window.removeEventListener(
            event,
            recordActivity
          );
        }
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, []);

  /*
   * When an admin intentionally leaves the
   * admin area, sign out before navigating.
   */
  useEffect(() => {
    async function handlePublicNavigation(
      event: MouseEvent
    ) {
      const target =
        event.target as
          | HTMLElement
          | null;

      const anchor =
        target?.closest(
          "a[href]"
        ) as
          | HTMLAnchorElement
          | null;

      if (!anchor) return;

      if (
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey ||
        event.button !== 0
      ) {
        return;
      }

      if (
        anchor.hasAttribute(
          "download"
        ) ||
        anchor.href.startsWith(
          "blob:"
        )
      ) {
        return;
      }

      if (
        anchor.target === "_blank" ||
        anchor.rel.includes(
          "noopener"
        ) ||
        anchor.rel.includes(
          "noreferrer"
        )
      ) {
        return;
      }

      const url = new URL(
        anchor.href,
        window.location.origin
      );

      if (
        url.origin !==
        window.location.origin
      ) {
        return;
      }

      const staysInsideAdmin =
        url.pathname ===
          "/admin" ||
        url.pathname.startsWith(
          "/admin/"
        );

      if (staysInsideAdmin) {
        return;
      }

      event.preventDefault();

      try {
        await fetch(
          "/api/auth/logout",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              tabId:
                sessionStorage.getItem(
                  TAB_ID_KEY
                ),
            }),
            keepalive: true,
          }
        );
      } catch {
        // Navigate anyway.
      } finally {
        sessionStorage.removeItem(
          SESSION_STARTED_KEY
        );

        sessionStorage.removeItem(
          TAB_ID_KEY
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
              You will be logged out automatically
              after{" "}
              {secondsLeft} seconds of
              inactivity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}