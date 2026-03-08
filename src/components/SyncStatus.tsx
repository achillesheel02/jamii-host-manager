import { useStatus } from "@powersync/react";

export function SyncStatus() {
  const status = useStatus();

  return (
    <div className="flex items-center gap-2 text-sm">
      <span
        className={`w-2 h-2 rounded-full ${
          status.connected ? "bg-green-500" : "bg-red-500"
        }`}
      />
      <span className="text-gray-600">
        {status.connected ? "Online" : "Offline"}
      </span>
      {status.dataFlowStatus?.downloading && (
        <span className="text-blue-500 text-xs">Syncing...</span>
      )}
    </div>
  );
}
