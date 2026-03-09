import { useEffect, type ReactNode } from "react";
import { PowerSyncContext } from "@powersync/react";
import { db } from "./db";
import { SupabaseConnector } from "./SupabaseConnector";
import { useAuth } from "../auth/AuthContext";

export function PowerSyncProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const isAuthenticated = !!session;

  useEffect(() => {
    if (!isAuthenticated) return;

    const connector = new SupabaseConnector();

    // Status listener is the ONLY way to observe connection errors —
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

    return () => {
      dispose();
      db.disconnect();
    };
  }, [isAuthenticated]);

  return (
    <PowerSyncContext.Provider value={db}>{children}</PowerSyncContext.Provider>
  );
}
