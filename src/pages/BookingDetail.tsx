import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, usePowerSync } from "@powersync/react";
import { MessageBubble } from "@/components/MessageBubble";
import { formatDate, formatCurrency, nightCount } from "@/lib/format";
import { useBeeChatContext } from "@/lib/BeeChatContext";

const STATUSES = [
  { value: "confirmed", label: "Confirmed" },
  { value: "checked_in", label: "Checked In" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const db = usePowerSync();
  const { setPageContext } = useBeeChatContext();
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

  // Set BeeChat context so the agent knows which booking/guest we're viewing
  useEffect(() => {
    if (booking) {
      setPageContext({
        page: "booking",
        propertyId: booking.property_id,
        bookingId: id,
        guestName: booking.guest_name,
        guestEmail: booking.guest_email,
        checkIn: booking.check_in,
        checkOut: booking.check_out,
      });
    }
  }, [id, booking?.guest_name, setPageContext]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    await db.execute(
      "INSERT INTO messages (id, booking_id, sender, content, ai_generated, sent, synced, created_at) VALUES (uuid(), ?, 'host', ?, 0, 0, 0, ?)",
      [id!, newMessage.trim(), new Date().toISOString()],
    );
    setNewMessage("");
  };

  const updateStatus = async (status: string) => {
    await db.execute(
      "UPDATE bookings SET status = ? WHERE id = ?",
      [status, id!],
    );
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
          className="text-sm text-amber-600 hover:underline"
        >
          &larr; Back to property
        </Link>
        <h1 className="text-xl font-bold text-gray-900 mt-2">
          {booking.guest_name}
        </h1>
        <p className="text-sm text-gray-500">
          {formatDate(booking.check_in)} &rarr; {formatDate(booking.check_out)}
          {booking.check_in && booking.check_out && (
            <span className="text-gray-400 ml-1">
              ({nightCount(booking.check_in, booking.check_out)} nights)
            </span>
          )}
        </p>
      </div>

      {/* Guest info + status */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            {booking.guest_email && (
              <p className="text-sm text-gray-600">{booking.guest_email}</p>
            )}
            {booking.guest_phone && (
              <p className="text-sm text-gray-600">{booking.guest_phone}</p>
            )}
            {booking.total_price && (
              <p className="text-sm font-medium text-gray-900">
                {formatCurrency(booking.total_price)}
              </p>
            )}
          </div>
          <div className="flex gap-1.5 flex-wrap justify-end">
            {STATUSES.map((s) => (
              <button
                key={s.value}
                onClick={() => updateStatus(s.value)}
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                  booking.status === s.value
                    ? "bg-amber-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        {booking.notes && (
          <p className="text-sm text-gray-500 border-t border-gray-100 pt-2">
            {booking.notes}
          </p>
        )}
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
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
        <button
          onClick={sendMessage}
          className="bg-amber-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
