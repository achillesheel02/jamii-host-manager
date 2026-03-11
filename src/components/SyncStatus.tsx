import { useSyncExternalStore } from "react";
import { useStatus } from "@powersync/react";

/** Track browser online/offline state reactively */
function subscribeBrowserOnline(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}
const getBrowserOnline = () => navigator.onLine;

export function SyncStatus() {
  const status = useStatus();
  const browserOnline = useSyncExternalStore(subscribeBrowserOnline, getBrowserOnline);

  const downloadError = status.dataFlowStatus?.downloadError;
  const uploadError = status.dataFlowStatus?.uploadError;
  const error = downloadError || uploadError;
  const hasSynced = status.hasSynced;

  // True online = browser online AND PowerSync connected
  const isOnline = browserOnline && status.connected;
  const isConnecting = browserOnline && status.connecting;
  const isOffline = !browserOnline || (!status.connected && !status.connecting);

  const dotColor = isOnline
    ? "bg-green-500"
    : isConnecting
      ? "bg-yellow-500 animate-pulse"
      : "bg-red-500";

  const label = isOnline
    ? "Online"
    : isConnecting
      ? "Connecting..."
      : "Offline";

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={`w-2 h-2 rounded-full ${dotColor}`} />
      <span className={isOffline ? "text-red-600 font-medium" : "text-gray-600"}>
        {label}
      </span>
      {isOnline && status.dataFlowStatus?.downloading && (
        <span className="text-amber-500 text-xs">Syncing...</span>
      )}
      {isOffline && hasSynced && (
        <span className="text-amber-600 text-xs">Local data available</span>
      )}
      {isOffline && !hasSynced && (
        <span className="text-red-500 text-xs">No cached data</span>
      )}
      {!isOnline && error && (
        <span
          className="text-red-500 text-xs max-w-48 truncate"
          title={error.message}
        >
          {error.message}
        </span>
      )}
    </div>
  );
}
