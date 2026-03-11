import { useEffect, useRef, type ReactNode } from "react";
import { PowerSyncContext } from "@powersync/react";
import { db } from "./db";
import { SupabaseConnector } from "./SupabaseConnector";
import { useAuth } from "../auth/AuthContext";

/**
 * PowerSyncProvider — wraps children with the PowerSync context.
 *
 * Key offline-first behaviour:
 *   - When authenticated → connect to PowerSync for live sync.
 *   - When auth drops (e.g. token expired while offline) → DON'T disconnect.
 *     The local SQLite database remains fully queryable so the UI keeps working.
 *   - Only disconnect on explicit sign-out (session goes null while online).
 */
export function PowerSyncProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const isAuthenticated = !!session;
  const hasConnected = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      // If we previously connected and the user is now signed out while online,
      // disconnect. But if we're offline and auth just expired, keep the DB open
      // so queries still work against cached data.
      if (hasConnected.current && navigator.onLine) {
        console.debug("[PowerSync] Auth lost while online — disconnecting");
        hasConnected.current = false;
        db.disconnect();
      } else if (hasConnected.current) {
        console.debug(
          "[PowerSync] Auth lost while offline — keeping local DB open for reads",
        );
      }
      return;
    }

    const connector = new SupabaseConnector();

    // Status listener — the ONLY way to observe connection errors.
    // ConnectionManager internally swallows promise rejections via .catch(() => {}).
    const dispose = db.registerListener({
      statusChanged: (status) => {
        const flow = status.dataFlowStatus;
        console.debug(
          "[PowerSync] status:",
          `connected=${status.connected}`,
          `connecting=${status.connecting}`,
          `hasSynced=${status.hasSynced}`,
          `downloadError=${flow?.downloadError?.message ?? "none"}`,
          `uploadError=${flow?.uploadError?.message ?? "none"}`,
        );
        if (flow?.downloadError) {
          console.error("[PowerSync] download error:", flow.downloadError);
        }
        if (flow?.uploadError) {
          console.error("[PowerSync] upload error:", flow.uploadError);
        }
      },
    });

    console.debug("[PowerSync] connecting...");
    db.connect(connector);
    hasConnected.current = true;

    return () => {
      dispose();
      // Only truly disconnect on cleanup — not just auth transitions
      db.disconnect();
      hasConnected.current = false;
    };
  }, [isAuthenticated]);

  return (
    <PowerSyncContext.Provider value={db}>{children}</PowerSyncContext.Provider>
  );
}
