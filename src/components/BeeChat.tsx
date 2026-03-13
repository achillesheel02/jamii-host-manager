import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery } from "@powersync/react";
import { useBeeChatContext } from "@/lib/BeeChatContext";
import { formatDate, formatCurrency, nightCount } from "@/lib/format";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const MASTRA_URL = import.meta.env.VITE_MASTRA_URL || "http://localhost:4111";
const IS_LOCAL_AGENT = MASTRA_URL.includes("localhost") || MASTRA_URL.includes("127.0.0.1");

/* ------------------------------------------------------------------ */
/*  Bee SVG — with animated wings                                      */
/* ------------------------------------------------------------------ */
function BeeSvg({ size = 56, animated = false }: { size?: number; animated?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={animated ? "bee-svg" : ""}
    >
      {/* Body */}
      <ellipse cx="32" cy="36" rx="14" ry="16" fill="#F59E0B" />
      {/* Stripes */}
      <rect x="18" y="30" width="28" height="4" rx="2" fill="#78350F" />
      <rect x="20" y="38" width="24" height="4" rx="2" fill="#78350F" />
      <rect x="22" y="46" width="20" height="3" rx="1.5" fill="#78350F" />
      {/* Head */}
      <circle cx="32" cy="20" r="8" fill="#78350F" />
      {/* Eyes */}
      <circle cx="28" cy="19" r="2.5" fill="white" />
      <circle cx="36" cy="19" r="2.5" fill="white" />
      <circle cx="28.5" cy="19.5" r="1" fill="#1E1B4B" />
      <circle cx="36.5" cy="19.5" r="1" fill="#1E1B4B" />
      {/* Antennae */}
      <line x1="28" y1="13" x2="22" y2="6" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="22" cy="5" r="2" fill="#F59E0B" />
      <line x1="36" y1="13" x2="42" y2="6" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="42" cy="5" r="2" fill="#F59E0B" />
      {/* Left Wing */}
      <ellipse
        cx="17" cy="28" rx="8" ry="5"
        fill="white" fillOpacity="0.75"
        className={animated ? "bee-wing-left" : ""}
        style={{ transformOrigin: "25px 30px" }}
      />
      {/* Right Wing */}
      <ellipse
        cx="47" cy="28" rx="8" ry="5"
        fill="white" fillOpacity="0.75"
        className={animated ? "bee-wing-right" : ""}
        style={{ transformOrigin: "39px 30px" }}
      />
      {/* Stinger */}
      <polygon points="32,52 29,56 35,56" fill="#78350F" />
      {/* Smile */}
      <path d="M29 23 Q32 26 35 23" stroke="white" strokeWidth="1" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  BeeChat — context-aware floating widget                            */
/*                                                                      */
/*  Reads from BeeChatContext to know which page/property/booking the    */
/*  host is viewing. Queries PowerSync local SQLite for relevant data    */
/*  and injects it as rich context into the AI agent prompt.             */
/* ------------------------------------------------------------------ */
export function BeeChat() {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Page context from the current route
  const { pageContext } = useBeeChatContext();

  // ── Global queries (always available) ────────────────────────────
  const { data: properties } = useQuery("SELECT id, name FROM properties ORDER BY name");

  // ── Context-aware queries from PowerSync local SQLite ────────────
  // These only fire when we have the right context, giving the agent
  // rich local data without needing server-side access to SQLite.

  // Property bookings — when on a property page or if a property is selected
  const activePropertyId = pageContext.propertyId || selectedProperty || "";
  const { data: propertyBookings } = useQuery(
    activePropertyId
      ? "SELECT id, guest_name, guest_email, check_in, check_out, status, total_price, guest_return_count FROM bookings WHERE property_id = ? ORDER BY check_in DESC LIMIT 10"
      : "SELECT 1 WHERE 0",
    activePropertyId ? [activePropertyId] : [],
  );

  // Guest memories — when on a booking page with a guest email
  const guestEmail = pageContext.guestEmail || "";
  const { data: guestMemories } = useQuery(
    guestEmail
      ? "SELECT memory_type, content, confidence, times_validated FROM agent_memories WHERE guest_email = ? ORDER BY confidence DESC LIMIT 8"
      : "SELECT 1 WHERE 0",
    guestEmail ? [guestEmail] : [],
  );

  // Recent messages — when on a booking page
  const bookingId = pageContext.bookingId || "";
  const { data: recentMessages } = useQuery(
    bookingId
      ? "SELECT sender, content, created_at FROM messages WHERE booking_id = ? ORDER BY created_at DESC LIMIT 5"
      : "SELECT 1 WHERE 0",
    bookingId ? [bookingId] : [],
  );

  // Pricing history — when on a property page
  const { data: pricingData } = useQuery(
    activePropertyId
      ? "SELECT date, suggested_price, actual_price, competitor_avg FROM pricing_history WHERE property_id = ? ORDER BY date DESC LIMIT 7"
      : "SELECT 1 WHERE 0",
    activePropertyId ? [activePropertyId] : [],
  );

  // Tasks — when on a property page
  const { data: propertyTasks } = useQuery(
    activePropertyId
      ? "SELECT type, description, status, due_date FROM tasks WHERE property_id = ? AND status != 'completed' ORDER BY due_date LIMIT 5"
      : "SELECT 1 WHERE 0",
    activePropertyId ? [activePropertyId] : [],
  );

  // Dashboard-level stats
  const { data: dashboardStats } = useQuery(
    pageContext.page === "dashboard"
      ? `SELECT
           (SELECT COUNT(*) FROM bookings WHERE status = 'confirmed' AND check_in >= date('now')) as upcoming,
           (SELECT COUNT(*) FROM bookings WHERE status = 'checked_in') as checked_in,
           (SELECT COUNT(*) FROM tasks WHERE status != 'completed') as open_tasks,
           (SELECT COUNT(*) FROM agent_memories) as memories`
      : "SELECT 1 WHERE 0",
  );

  // ── Auto-select property from route context ──────────────────────
  useEffect(() => {
    if (pageContext.propertyId && pageContext.propertyId !== selectedProperty) {
      setSelectedProperty(pageContext.propertyId);
    }
  }, [pageContext.propertyId]);

  // ── Build context-aware starter prompts ──────────────────────────
  const starterPrompts = useMemo(() => {
    const guest = pageContext.guestName;
    switch (pageContext.page) {
      case "booking":
        return [
          `Draft a welcome message for ${guest || "this guest"}`,
          `What do we know about ${guest || "this guest"}?`,
          "Create a check-in prep task",
          "Suggest pricing for the next stay",
        ];
      case "property":
        return [
          "Price this property for the weekend",
          "Show me upcoming bookings",
          "Any repeat guests coming up?",
          "Create a cleaning task for tomorrow",
        ];
      default:
        return [
          "Price my place this weekend",
          "Any repeat guests coming up?",
          "Draft a welcome message",
          "Summarise today's check-ins",
        ];
    }
  }, [pageContext.page, pageContext.guestName]);

  // ── Build rich context from local PowerSync data ─────────────────
  const buildLocalContext = (): string => {
    const parts: string[] = [];

    // Page context header
    if (pageContext.page === "booking" && pageContext.guestName) {
      parts.push(`[CURRENT VIEW: Booking for ${pageContext.guestName}]`);
      if (pageContext.checkIn && pageContext.checkOut) {
        const nights = nightCount(pageContext.checkIn, pageContext.checkOut);
        parts.push(`Check-in: ${formatDate(pageContext.checkIn)} | Check-out: ${formatDate(pageContext.checkOut)} (${nights} nights)`);
      }
    } else if (pageContext.page === "property" && pageContext.propertyName) {
      parts.push(`[CURRENT VIEW: Property — ${pageContext.propertyName}]`);
    } else if (pageContext.page === "dashboard") {
      parts.push("[CURRENT VIEW: Hive Dashboard — overview of all properties]");
    }

    // Property context
    if (activePropertyId) {
      const prop = properties.find((p) => p.id === activePropertyId);
      if (prop) {
        parts.push(`Property: ${prop.name} (ID: ${activePropertyId})`);
      }
    }

    // Dashboard stats from local SQLite
    if (dashboardStats.length > 0 && pageContext.page === "dashboard") {
      const s = dashboardStats[0];
      parts.push(`\n--- LIVE DATA (from local offline database) ---`);
      parts.push(`Upcoming bookings: ${s.upcoming} | Currently checked in: ${s.checked_in}`);
      parts.push(`Open tasks: ${s.open_tasks} | Guest memories stored: ${s.memories}`);
    }

    // Bookings from local SQLite
    if (propertyBookings.length > 0) {
      parts.push(`\n--- RECENT BOOKINGS (from local offline database) ---`);
      for (const b of propertyBookings) {
        const returnTag = b.guest_return_count > 0 ? ` [RETURN GUEST x${b.guest_return_count}]` : "";
        parts.push(`- ${b.guest_name} | ${formatDate(b.check_in)} to ${formatDate(b.check_out)} | ${b.status} | ${formatCurrency(b.total_price)}${returnTag}`);
      }
    }

    // Guest memories from local SQLite
    if (guestMemories.length > 0) {
      parts.push(`\n--- GUEST INTELLIGENCE (Hive Memory, from local offline database) ---`);
      for (const m of guestMemories) {
        const strength = m.confidence >= 0.8 ? "strong" : m.confidence >= 0.5 ? "moderate" : "weak";
        const validated = m.times_validated > 1 ? ` (validated ${m.times_validated}x)` : "";
        parts.push(`- [${m.memory_type}] ${m.content} — confidence: ${strength}${validated}`);
      }
    }

    // Recent messages from local SQLite
    if (recentMessages.length > 0) {
      parts.push(`\n--- RECENT MESSAGES (from local offline database) ---`);
      for (const msg of [...recentMessages].reverse()) {
        parts.push(`- [${msg.sender}] ${msg.content}`);
      }
    }

    // Pricing from local SQLite
    if (pricingData.length > 0) {
      parts.push(`\n--- PRICING HISTORY (from local offline database) ---`);
      for (const p of pricingData) {
        parts.push(`- ${formatDate(p.date)}: suggested ${formatCurrency(p.suggested_price)} | actual ${formatCurrency(p.actual_price)} | competitors avg ${formatCurrency(p.competitor_avg)}`);
      }
    }

    // Open tasks from local SQLite
    if (propertyTasks.length > 0) {
      parts.push(`\n--- OPEN TASKS (from local offline database) ---`);
      for (const t of propertyTasks) {
        parts.push(`- [${t.type}] ${t.description} | due: ${formatDate(t.due_date)} | ${t.status}`);
      }
    }

    return parts.length > 0 ? parts.join("\n") + "\n\n" : "";
  };

  // ── Open/close animation ─────────────────────────────────────────
  useEffect(() => {
    if (open) {
      setVisible(true);
      setTimeout(() => inputRef.current?.focus(), 350);
    } else {
      const timer = setTimeout(() => setVisible(false), 280);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // ── Send message with rich local context ─────────────────────────
  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    // Build context prefix from local PowerSync data
    const contextPrefix = buildLocalContext();

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
            content:
              i === allMessages.length - 1 && m.role === "user"
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
      const offlineMsg = !navigator.onLine
        ? "You're offline right now. BeeChat needs an internet connection to the AI agent, but all your property data, bookings, and tasks are available offline in the app."
        : IS_LOCAL_AGENT
          ? "BeeChat connects to the Mastra AI agent running locally. Run `npx mastra dev` to start it, or set VITE_MASTRA_URL for a deployed agent."
          : "Could not reach the Hive AI agent. Please try again in a moment.";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: offlineMsg },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ---- Chat Panel ---- */}
      {visible && (
        <div
          className={`fixed bottom-24 right-6 z-50 w-[360px] max-h-[520px] flex flex-col rounded-2xl shadow-2xl border border-amber-200 bg-white overflow-hidden ${
            open ? "bee-panel-enter" : "bee-panel-exit"
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-yellow-400 px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <BeeSvg size={28} />
              <div>
                <p className="text-sm font-bold text-amber-900">Jamii Hive Mind</p>
                <p className="text-[10px] text-amber-800/70">
                  {pageContext.page === "booking" && pageContext.guestName
                    ? `Guest: ${pageContext.guestName}`
                    : pageContext.page === "property" && pageContext.propertyName
                      ? pageContext.propertyName
                      : "AI-powered host intelligence"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-amber-900/60 hover:text-amber-900 transition-colors text-lg leading-none"
              aria-label="Close chat"
            >
              &times;
            </button>
          </div>

          {/* Property selector */}
          {properties.length > 0 && (
            <div className="px-3 py-2 border-b border-amber-100 bg-amber-50/50 shrink-0">
              <select
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
                className="w-full text-xs border border-amber-200 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-amber-400 text-gray-700"
              >
                <option value="">All properties</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-3 py-3 space-y-2 min-h-0"
            style={{ maxHeight: "340px" }}
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-8 space-y-4">
                <BeeSvg size={48} />
                <p className="text-xs text-gray-400 text-center max-w-[200px]">
                  {pageContext.page === "booking"
                    ? `Ask me about ${pageContext.guestName || "this guest"}`
                    : pageContext.page === "property"
                      ? `Ask me about ${pageContext.propertyName || "this property"}`
                      : "Ask me about pricing, guests, bookings, or tasks"}
                </p>
                <div className="grid grid-cols-1 gap-1.5 w-full px-2">
                  {starterPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      className="text-left text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 hover:bg-amber-100 hover:border-amber-300 transition-colors"
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
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                      m.role === "user"
                        ? "bg-amber-500 text-white"
                        : "bg-gray-100 text-gray-800 border border-gray-200"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-400 flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" />
                  <span
                    className="inline-block w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.15s" }}
                  />
                  <span
                    className="inline-block w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.3s" }}
                  />
                  <span className="ml-1">Thinking...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="px-3 py-2 border-t border-amber-100 bg-white shrink-0">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Ask the Hive..."
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400"
                disabled={loading}
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className="bg-amber-500 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-amber-600 transition-colors disabled:opacity-40"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Floating Bee Button ---- */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="bee-trigger fixed bottom-6 right-6 z-50 flex items-center justify-center cursor-pointer bg-transparent border-none p-0"
        aria-label={open ? "Close Hive chat" : "Open Hive chat"}
      >
        <div className={`bee-body transition-transform duration-300 ${open ? "scale-0 opacity-0" : "scale-100 opacity-100"}`}>
          <BeeSvg size={56} animated={!open} />
        </div>
        <div className={`bee-close absolute transition-all duration-300 ${open ? "scale-100 opacity-100 rotate-0" : "scale-0 opacity-0 rotate-90"}`}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <line x1="12" y1="12" x2="28" y2="28" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
            <line x1="28" y1="12" x2="12" y2="28" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
      </button>

      {/* ---- All animations ---- */}
      <style>{`
        /* Bee float */
        .bee-trigger {
          animation: bee-hover 3s ease-in-out infinite;
          filter: drop-shadow(0 4px 12px rgba(245, 158, 11, 0.35));
          transition: filter 0.3s ease, transform 0.2s ease;
        }
        .bee-trigger:hover {
          animation-play-state: paused;
          filter: drop-shadow(0 6px 20px rgba(245, 158, 11, 0.6));
          transform: scale(1.15);
        }
        .bee-trigger:active {
          transform: scale(0.92);
        }

        @keyframes bee-hover {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        /* Wing flap */
        .bee-wing-left {
          animation: flap-left 0.12s ease-in-out infinite alternate;
        }
        .bee-wing-right {
          animation: flap-right 0.12s ease-in-out infinite alternate;
        }

        @keyframes flap-left {
          0%   { transform: rotate(-15deg) scaleY(1); }
          100% { transform: rotate(-35deg) scaleY(0.7); }
        }
        @keyframes flap-right {
          0%   { transform: rotate(15deg) scaleY(1); }
          100% { transform: rotate(35deg) scaleY(0.7); }
        }

        /* Panel enter */
        .bee-panel-enter {
          animation: panel-slide-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes panel-slide-in {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* Panel exit */
        .bee-panel-exit {
          animation: panel-slide-out 0.25s cubic-bezier(0.55, 0, 1, 0.45) forwards;
        }
        @keyframes panel-slide-out {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(16px) scale(0.97);
          }
        }
      `}</style>
    </>
  );
}
