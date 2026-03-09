import { useStatus } from "@powersync/react";

export function SyncStatus() {
  const status = useStatus();
  const downloadError = status.dataFlowStatus?.downloadError;
  const uploadError = status.dataFlowStatus?.uploadError;
  const error = downloadError || uploadError;

  const dotColor = status.connected
    ? "bg-green-500"
    : status.connecting
      ? "bg-yellow-500 animate-pulse"
      : "bg-red-500";

  const label = status.connected
    ? "Online"
    : status.connecting
      ? "Connecting..."
      : "Offline";

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={`w-2 h-2 rounded-full ${dotColor}`} />
      <span className="text-gray-600">{label}</span>
      {status.dataFlowStatus?.downloading && (
        <span className="text-blue-500 text-xs">Syncing...</span>
      )}
      {!status.connected && error && (
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
