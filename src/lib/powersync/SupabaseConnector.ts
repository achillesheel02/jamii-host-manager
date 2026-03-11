import {
  AbstractPowerSyncDatabase,
  CrudEntry,
  PowerSyncBackendConnector,
  UpdateType,
} from "@powersync/web";
import { supabase } from "../supabase";

const FATAL_RESPONSE_CODES = [
  /^22\d{3}$/, // data exception
  /^23\d{3}$/, // integrity constraint violation
  /^42\d{3}$/, // syntax error or access rule violation
  /^PGRST\d{3}$/, // PostgREST errors
];

export class SupabaseConnector implements PowerSyncBackendConnector {
  async fetchCredentials() {
    // Try to get a fresh session. If offline, getSession() still returns the
    // cached session from localStorage — which may have an expired JWT.
    // That's OK: PowerSync will fail to connect to its cloud endpoint but
    // the local SQLite database remains fully usable.
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (!session || error) {
      // If offline and we have no cached session at all, throw so PowerSync
      // knows it can't sync. The local DB still works for reads.
      if (!navigator.onLine) {
        console.warn(
          "[PowerSync] fetchCredentials — offline with no cached session. " +
          "Local reads still work.",
        );
      }
      console.error("[PowerSync] fetchCredentials failed:", error?.message ?? "no session");
      throw new Error(`Could not fetch Supabase credentials: ${error?.message}`);
    }

    const endpoint = import.meta.env.VITE_POWERSYNC_URL;
    if (!endpoint) {
      console.error("[PowerSync] VITE_POWERSYNC_URL is not set");
      throw new Error("VITE_POWERSYNC_URL environment variable is not configured");
    }

    const credentials = {
      endpoint,
      token: session.access_token ?? "",
      expiresAt: session.expires_at
        ? new Date(session.expires_at * 1000)
        : undefined,
    };

    console.debug(
      "[PowerSync] fetchCredentials OK:",
      `endpoint=${endpoint}`,
      `tokenLength=${credentials.token.length}`,
      `expiresAt=${credentials.expiresAt?.toISOString() ?? "none"}`,
      `online=${navigator.onLine}`,
    );

    return credentials;
  }

  async uploadData(database: AbstractPowerSyncDatabase) {
    const transaction = await database.getNextCrudTransaction();
    if (!transaction) return;

    let lastOp: CrudEntry | null = null;

    try {
      for (const op of transaction.crud) {
        lastOp = op;
        const table = supabase.from(op.table);
        let result;

        switch (op.op) {
          case UpdateType.PUT:
            result = await table.upsert({ ...op.opData, id: op.id });
            break;
          case UpdateType.PATCH:
            result = await table.update(op.opData).eq("id", op.id);
            break;
          case UpdateType.DELETE:
            result = await table.delete().eq("id", op.id);
            break;
        }

        if (result?.error) {
          console.error(
            `Supabase upload error on ${op.table}:`,
            result.error.message,
          );
          throw new Error(
            JSON.stringify({ code: result.error.code, message: result.error.message }),
          );
        }
      }
      await transaction.complete();
    } catch (ex: unknown) {
      const code = (ex as { code?: string }).code;
      if (
        typeof code === "string" &&
        FATAL_RESPONSE_CODES.some((r) => r.test(code))
      ) {
        console.error(
          `Fatal error on ${lastOp?.table}:${lastOp?.id} — marking complete to prevent retry loop`,
        );
        await transaction.complete();
      } else {
        throw ex;
      }
    }
  }
}
