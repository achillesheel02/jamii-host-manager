import type { MessageRecord } from "@/lib/powersync/schema";

export function MessageBubble({ message }: { message: MessageRecord & { id: string } }) {
  const isHost = message.sender === "host" || message.sender === "agent";

  return (
    <div className={`flex ${isHost ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[75%] rounded-lg px-4 py-2.5 ${
          isHost
            ? "bg-blue-600 text-white"
            : "bg-white text-gray-900 border border-gray-200"
        }`}
      >
        <p className="text-sm">{message.content}</p>
        <div
          className={`flex items-center gap-2 mt-1 text-xs ${
            isHost ? "text-blue-200" : "text-gray-400"
          }`}
        >
          {message.ai_generated ? <span>AI</span> : null}
          <span>{message.created_at ? new Date(message.created_at).toLocaleTimeString() : ""}</span>
          {isHost && !message.synced && (
            <span className="text-yellow-300">Queued</span>
          )}
        </div>
      </div>
    </div>
  );
}
