import { Link } from "react-router-dom";
import { useQuery } from "@powersync/react";
import { BookingCard } from "@/components/BookingCard";

export function Dashboard() {
  const { data: properties } = useQuery("SELECT * FROM properties ORDER BY name");
  const { data: upcomingBookings } = useQuery(
    "SELECT * FROM bookings WHERE check_in >= date('now') AND status = 'confirmed' ORDER BY check_in LIMIT 10",
  );

  return (
    <div className="space-y-8">
      {/* Properties */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Properties</h2>
        {properties.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
            No properties yet. Data will appear after syncing with Supabase.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {properties.map((p) => (
              <Link
                key={p.id}
                to={`/property/${p.id}`}
                className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow"
              >
                <h3 className="font-medium text-gray-900">{p.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{p.address}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Upcoming bookings */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Upcoming Bookings
        </h2>
        {upcomingBookings.length === 0 ? (
          <p className="text-gray-500 text-sm">No upcoming bookings.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingBookings.map((b) => (
              <BookingCard key={b.id} booking={b} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
