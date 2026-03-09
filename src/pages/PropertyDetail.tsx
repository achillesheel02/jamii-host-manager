import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, usePowerSync } from "@powersync/react";
import { BookingCard } from "@/components/BookingCard";
import { formatDate, formatCurrency } from "@/lib/format";

export function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const db = usePowerSync();

  // --- Booking form state ---
  const [showAddBooking, setShowAddBooking] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [totalPrice, setTotalPrice] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");

  // --- Task form state ---
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskType, setTaskType] = useState("cleaning");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskDue, setTaskDue] = useState("");

  // --- Edit mode state ---
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editAmenities, setEditAmenities] = useState("");

  // --- Queries ---
  const { data: properties } = useQuery(
    "SELECT * FROM properties WHERE id = ?",
    [id!],
  );
  const property = properties[0];

  const { data: bookings } = useQuery(
    "SELECT * FROM bookings WHERE property_id = ? ORDER BY check_in DESC",
    [id!],
  );

  const { data: tasks } = useQuery(
    "SELECT * FROM tasks WHERE property_id = ? ORDER BY CASE WHEN status = 'pending' THEN 0 ELSE 1 END, due_date",
    [id!],
  );

  const { data: pricing } = useQuery(
    "SELECT * FROM pricing_history WHERE property_id = ? ORDER BY date DESC LIMIT 7",
    [id!],
  );

  // --- Agent Insights (offline-resilient: reads from local SQLite) ---
  const { data: agentPricing } = useQuery(
    "SELECT * FROM pricing_history WHERE property_id = ? AND source = 'agent' ORDER BY date DESC LIMIT 1",
    [id!],
  );

  const { data: guestMemories } = useQuery(
    `SELECT am.guest_email, am.memory_type, am.content, am.confidence, b.guest_name
     FROM agent_memories am
     LEFT JOIN bookings b ON b.guest_email = am.guest_email AND b.property_id = am.property_id
     WHERE am.property_id = ?
     ORDER BY am.confidence DESC LIMIT 5`,
    [id!],
  );

  const { data: draftMessages } = useQuery(
    `SELECT m.content, m.created_at, b.guest_name
     FROM messages m
     JOIN bookings b ON b.id = m.booking_id
     WHERE b.property_id = ? AND m.ai_generated = 1 AND m.sent = 0
     ORDER BY m.created_at DESC LIMIT 3`,
    [id!],
  );

  const hasInsights =
    agentPricing.length > 0 || guestMemories.length > 0 || draftMessages.length > 0;

  // --- Actions ---
  const addBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !checkIn || !checkOut) return;

    await db.execute(
      `INSERT INTO bookings (id, property_id, guest_name, guest_email, guest_phone, check_in, check_out, status, total_price, notes, created_at)
       VALUES (uuid(), ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?, ?)`,
      [
        id!,
        guestName.trim(),
        guestEmail.trim(),
        guestPhone.trim(),
        checkIn,
        checkOut,
        totalPrice ? Number(totalPrice) : null,
        bookingNotes.trim(),
        new Date().toISOString(),
      ],
    );

    setGuestName("");
    setGuestEmail("");
    setGuestPhone("");
    setCheckIn("");
    setCheckOut("");
    setTotalPrice("");
    setBookingNotes("");
    setShowAddBooking(false);
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskDesc.trim()) return;

    await db.execute(
      `INSERT INTO tasks (id, property_id, type, description, status, due_date)
       VALUES (uuid(), ?, ?, ?, 'pending', ?)`,
      [id!, taskType, taskDesc.trim(), taskDue || null],
    );

    setTaskDesc("");
    setTaskDue("");
    setTaskType("cleaning");
    setShowAddTask(false);
  };

  const completeTask = async (taskId: string) => {
    await db.execute(
      "UPDATE tasks SET status = 'completed', completed_at = ? WHERE id = ?",
      [new Date().toISOString(), taskId],
    );
  };

  const startEditing = () => {
    if (!property) return;
    setEditName(property.name ?? "");
    setEditAddress(property.address ?? "");
    setEditDesc(property.description ?? "");
    setEditAmenities(parseAmenities(property.amenities).join(", "));
    setEditing(true);
  };

  const saveProperty = async () => {
    if (!editName.trim() || !editAddress.trim()) return;

    const amenitiesJson = JSON.stringify(
      editAmenities
        .split(",")
        .map((a: string) => a.trim())
        .filter(Boolean),
    );

    await db.execute(
      "UPDATE properties SET name = ?, address = ?, description = ?, amenities = ? WHERE id = ?",
      [editName.trim(), editAddress.trim(), editDesc.trim(), amenitiesJson, id!],
    );
    setEditing(false);
  };

  if (!property) {
    return <p className="text-gray-500">Property not found.</p>;
  }

  const amenities = parseAmenities(property.amenities);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link to="/" className="text-sm text-blue-600 hover:underline">
          &larr; Back
        </Link>

        {editing ? (
          <div className="mt-2 space-y-3">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="block w-full text-2xl font-bold text-gray-900 border-b-2 border-blue-500 focus:outline-none bg-transparent"
            />
            <input
              type="text"
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
              className="block w-full text-gray-500 border-b border-gray-300 focus:outline-none bg-transparent"
            />
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              rows={2}
              placeholder="Description..."
              className="block w-full text-gray-600 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Amenities (comma-separated)
              </label>
              <input
                type="text"
                value={editAmenities}
                onChange={(e) => setEditAmenities(e.target.value)}
                placeholder="WiFi, Kitchen, Pool, Parking..."
                className="block w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={saveProperty}
                className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="text-gray-600 px-4 py-1.5 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-2">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{property.name}</h1>
                <p className="text-gray-500">{property.address}</p>
              </div>
              <button
                onClick={startEditing}
                className="text-sm text-gray-400 hover:text-blue-600 transition-colors"
                title="Edit property"
              >
                Edit
              </button>
            </div>
            {property.description && (
              <p className="text-gray-600 mt-2">{property.description}</p>
            )}
            {amenities.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {amenities.map((a) => (
                  <span
                    key={a}
                    className="inline-block bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full"
                  >
                    {a}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pricing snapshot */}
      {pricing.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Recent Pricing</h2>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2 text-gray-500 font-medium">Date</th>
                  <th className="text-right px-4 py-2 text-gray-500 font-medium">Suggested</th>
                  <th className="text-right px-4 py-2 text-gray-500 font-medium">Actual</th>
                  <th className="text-right px-4 py-2 text-gray-500 font-medium">Competitor Avg</th>
                </tr>
              </thead>
              <tbody>
                {pricing.map((p) => (
                  <tr key={p.id} className="border-t border-gray-100">
                    <td className="px-4 py-2 text-gray-900">{formatDate(p.date)}</td>
                    <td className="px-4 py-2 text-right text-gray-600">
                      {formatCurrency(p.suggested_price)}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-900 font-medium">
                      {formatCurrency(p.actual_price)}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-500">
                      {formatCurrency(p.competitor_avg)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Agent Insights — persists offline */}
      {hasInsights && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Agent Insights</h2>
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
              Available offline
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Latest agent pricing suggestion */}
            {agentPricing.length > 0 && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-xs font-medium text-purple-600 uppercase">Last AI Suggestion</p>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  {formatCurrency(agentPricing[0].suggested_price)}
                  <span className="text-sm text-gray-500 font-normal">/night</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDate(agentPricing[0].date)}
                  {agentPricing[0].competitor_avg && (
                    <span> — Competitors: {formatCurrency(agentPricing[0].competitor_avg)}</span>
                  )}
                </p>
              </div>
            )}

            {/* Guest memories */}
            {guestMemories.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-xs font-medium text-blue-600 uppercase">Guest Memories</p>
                <ul className="mt-2 space-y-1.5">
                  {guestMemories.slice(0, 3).map((m, i) => (
                    <li key={i} className="text-xs text-gray-700">
                      <span className="font-medium">{m.guest_name || m.guest_email}</span>
                      <span className="text-gray-400 mx-1">—</span>
                      <span>{m.content}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Unsent AI drafts */}
            {draftMessages.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-xs font-medium text-amber-600 uppercase">Unsent Drafts</p>
                <ul className="mt-2 space-y-1.5">
                  {draftMessages.map((d, i) => (
                    <li key={i} className="text-xs text-gray-700">
                      <span className="font-medium">To {d.guest_name}</span>
                      <p className="text-gray-500 line-clamp-2 mt-0.5">{d.content}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Bookings */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Bookings</h2>
          <button
            onClick={() => setShowAddBooking(!showAddBooking)}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            {showAddBooking ? "Cancel" : "+ Add Booking"}
          </button>
        </div>

        {/* Add booking form */}
        {showAddBooking && (
          <form onSubmit={addBooking} className="bg-white rounded-lg border border-gray-200 p-4 mb-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Guest Name *</label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Check-in *</label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Check-out *</label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                <input
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Total Price (KES)</label>
                <input
                  type="number"
                  value={totalPrice}
                  onChange={(e) => setTotalPrice(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
              <input
                type="text"
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
                placeholder="Any special requests..."
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Add Booking
            </button>
          </form>
        )}

        {bookings.length === 0 ? (
          <p className="text-gray-500 text-sm">No bookings yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bookings.map((b) => (
              <BookingCard key={b.id} booking={b} />
            ))}
          </div>
        )}
      </section>

      {/* Tasks */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
          <button
            onClick={() => setShowAddTask(!showAddTask)}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            {showAddTask ? "Cancel" : "+ Add Task"}
          </button>
        </div>

        {/* Add task form */}
        {showAddTask && (
          <form onSubmit={addTask} className="bg-white rounded-lg border border-gray-200 p-4 mb-4 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                <select
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cleaning">Cleaning</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="turnover">Turnover</option>
                  <option value="supplies">Supplies</option>
                  <option value="inspection">Inspection</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Description *</label>
                <input
                  type="text"
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  required
                  placeholder="What needs to be done?"
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex items-end gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Due Date</label>
                <input
                  type="date"
                  value={taskDue}
                  onChange={(e) => setTaskDue(e.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Add Task
              </button>
            </div>
          </form>
        )}

        {tasks.length === 0 ? (
          <p className="text-gray-500 text-sm">No tasks.</p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((t) => (
              <li
                key={t.id}
                className={`bg-white rounded-lg border border-gray-200 p-3 flex items-center justify-between ${
                  t.status === "completed" ? "opacity-50" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  {t.status === "pending" ? (
                    <button
                      onClick={() => completeTask(t.id)}
                      className="w-5 h-5 rounded border-2 border-gray-300 hover:border-blue-500 transition-colors flex-shrink-0"
                      title="Mark complete"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded border-2 border-green-500 bg-green-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  <div>
                    <span className="text-xs font-medium text-gray-400 uppercase">
                      {t.type}
                    </span>
                    <p className={`text-sm ${t.status === "completed" ? "text-gray-400 line-through" : "text-gray-900"}`}>
                      {t.description}
                    </p>
                  </div>
                </div>
                {t.due_date && (
                  <span className="text-xs text-gray-500">{formatDate(t.due_date)}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/** Parse amenities from JSON string or comma-separated fallback */
function parseAmenities(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
  } catch {
    // Not JSON — try comma-separated
  }
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}
