import { useState } from "react";
import { useQuery } from "@powersync/react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const MASTRA_URL = import.meta.env.VITE_MASTRA_URL || "http://localhost:4111";

const STARTER_PROMPTS = [
  "What should I price my place for this weekend?",
  "Any repeat guests with upcoming bookings?",
  "Is my unit available March 20-25?",
  "Draft a welcome message for my next guest",
];

export function AgentChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState("");

  const { data: properties } = useQuery("SELECT id, name FROM properties ORDER BY name");

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    // Prepend property context if selected
    let contextPrefix = "";
    if (selectedProperty) {
      const prop = properties.find((p) => p.id === selectedProperty);
      if (prop) {
        contextPrefix = `[Property: ${prop.name} (ID: ${selectedProperty})]\n\n`;
      }
    }

    const userMessage: ChatMessage = { role: "user", content };
    const allMessages = [...messages, userMessage];
    setMessages(allMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${MASTRA_URL}/api/agents/jamii-host-agent/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: allMessages.map((m, i) => ({
            role: m.role,
            content: i === allMessages.length - 1 && m.role === "user"
              ? contextPrefix + m.content
              : m.content,
          })),
        }),
      });

      if (!res.ok) throw new Error(`Agent returned ${res.status}`);
      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.text },
      ]);
    } catch (err) {
      console.error("Agent error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Could not reach the AI agent. Make sure `npx mastra dev` is running.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Jamii AI Agent</h1>
          <p className="text-sm text-gray-500">
            Ask about pricing, guest history, availability, or draft a guest response.
          </p>
        </div>
        {properties.length > 0 && (
          <select
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All properties</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Chat area */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 min-h-[400px] max-h-[600px] overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 space-y-6">
            <div className="text-center space-y-2">
              <p className="text-2xl text-gray-400">Jamii</p>
              <p className="text-sm text-gray-400">
                Your AI host assistant — pricing, guests, and availability
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 max-w-md">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-left text-sm text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-2 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} mb-3`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm ${
                  m.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-900 border border-gray-200"
                }`}
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start mb-3">
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-400">
              Thinking...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask Jamii anything..."
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={loading}
        />
        <button
          onClick={() => sendMessage()}
          disabled={loading}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
