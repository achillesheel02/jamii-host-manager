import { useEffect, type ReactNode } from "react";
import { PowerSyncContext } from "@powersync/react";
import { db } from "./db";
import { SupabaseConnector } from "./SupabaseConnector";

export function PowerSyncProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const connector = new SupabaseConnector();
    db.connect(connector);
    return () => {
      db.disconnect();
    };
  }, []);

  return (
    <PowerSyncContext.Provider value={db}>{children}</PowerSyncContext.Provider>
  );
}
