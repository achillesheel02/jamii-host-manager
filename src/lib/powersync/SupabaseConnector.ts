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
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (!session || error) {
      throw new Error(`Could not fetch Supabase credentials: ${error?.message}`);
    }

    return {
      endpoint: import.meta.env.VITE_POWERSYNC_URL,
      token: session.access_token ?? "",
      expiresAt: session.expires_at
        ? new Date(session.expires_at * 1000)
        : undefined,
    };
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
