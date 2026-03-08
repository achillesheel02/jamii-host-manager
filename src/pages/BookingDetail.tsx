import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, usePowerSync } from "@powersync/react";
import { MessageBubble } from "@/components/MessageBubble";

export function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const db = usePowerSync();
  const [newMessage, setNewMessage] = useState("");

  const { data: bookings } = useQuery(
    "SELECT * FROM bookings WHERE id = ?",
    [id!],
  );
  const booking = bookings[0];

  const { data: messages } = useQuery(
    "SELECT * FROM messages WHERE booking_id = ? ORDER BY created_at ASC",
    [id!],
    {
      streams: [
        { name: "booking_messages", parameters: { booking_id: id! } },
      ],
    },
  );

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    await db.execute(
      "INSERT INTO messages (id, booking_id, sender, content, ai_generated, sent, synced, created_at) VALUES (uuid(), ?, 'host', ?, 0, 0, 0, ?)",
      [id!, newMessage.trim(), new Date().toISOString()],
    );
    setNewMessage("");
  };

  if (!booking) {
    return <p className="text-gray-500">Booking not found.</p>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          to={`/property/${booking.property_id}`}
          className="text-sm text-blue-600 hover:underline"
        >
          &larr; Back to property
        </Link>
        <h1 className="text-xl font-bold text-gray-900 mt-2">
          {booking.guest_name}
        </h1>
        <p className="text-sm text-gray-500">
          {booking.check_in} &rarr; {booking.check_out} &middot;{" "}
          <span className="capitalize">{booking.status}</span>
        </p>
      </div>

      {/* Messages */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 min-h-[300px] max-h-[500px] overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-gray-400 text-sm text-center mt-20">
            No messages yet. Start the conversation.
          </p>
        ) : (
          messages.map((m) => <MessageBubble key={m.id} message={m} />)
        )}
      </div>

      {/* Compose */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
