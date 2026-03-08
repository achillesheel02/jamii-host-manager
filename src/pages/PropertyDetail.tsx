import { useParams, Link } from "react-router-dom";
import { useQuery } from "@powersync/react";
import { BookingCard } from "@/components/BookingCard";

export function PropertyDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: properties } = useQuery(
    "SELECT * FROM properties WHERE id = ?",
    [id!],
  );
  const property = properties[0];

  const { data: bookings } = useQuery(
    "SELECT * FROM bookings WHERE property_id = ? ORDER BY check_in DESC",
    [id!],
    {
      streams: [
        { name: "property_bookings", parameters: { property_id: id! } },
      ],
    },
  );

  const { data: tasks } = useQuery(
    "SELECT * FROM tasks WHERE property_id = ? AND status = 'pending' ORDER BY due_date",
    [id!],
    {
      streams: [
        { name: "property_tasks", parameters: { property_id: id! } },
      ],
    },
  );

  if (!property) {
    return <p className="text-gray-500">Property not found.</p>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link to="/" className="text-sm text-blue-600 hover:underline">
          &larr; Back
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">{property.name}</h1>
        <p className="text-gray-500">{property.address}</p>
        {property.description && (
          <p className="text-gray-600 mt-2">{property.description}</p>
        )}
      </div>

      {/* Bookings */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Bookings</h2>
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

      {/* Pending Tasks */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Pending Tasks
        </h2>
        {tasks.length === 0 ? (
          <p className="text-gray-500 text-sm">No pending tasks.</p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((t) => (
              <li
                key={t.id}
                className="bg-white rounded-lg border border-gray-200 p-3 flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-medium text-gray-400 uppercase">
                    {t.type}
                  </span>
                  <p className="text-sm text-gray-900">{t.description}</p>
                </div>
                {t.due_date && (
                  <span className="text-xs text-gray-500">{t.due_date}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
