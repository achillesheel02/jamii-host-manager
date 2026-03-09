import { Link } from "react-router-dom";
import { useQuery } from "@powersync/react";
import { BookingCard } from "@/components/BookingCard";
import { formatCurrency } from "@/lib/format";

export function Dashboard() {
  const { data: properties } = useQuery("SELECT * FROM properties ORDER BY name");
  const { data: upcomingBookings } = useQuery(
    "SELECT * FROM bookings WHERE check_in >= date('now') AND status IN ('confirmed', 'checked_in') ORDER BY check_in LIMIT 10",
  );
  const { data: pendingTasks } = useQuery(
    "SELECT COUNT(*) as count FROM tasks WHERE status = 'pending'",
  );
  const { data: revenueData } = useQuery(
    `SELECT
       SUM(CASE WHEN check_in >= date('now', 'start of month') THEN total_price ELSE 0 END) as this_month,
       SUM(CASE WHEN check_in >= date('now', 'start of month', '-1 month') AND check_in < date('now', 'start of month') THEN total_price ELSE 0 END) as last_month
     FROM bookings WHERE status IN ('confirmed', 'checked_in', 'completed')`,
  );
  const { data: activeBookings } = useQuery(
    "SELECT COUNT(*) as count FROM bookings WHERE status IN ('confirmed', 'checked_in')",
  );

  const taskCount = Number((pendingTasks[0] as Record<string, unknown>)?.count ?? 0);
  const activeCount = Number((activeBookings[0] as Record<string, unknown>)?.count ?? 0);
  const thisMonth = Number((revenueData[0] as Record<string, unknown>)?.this_month ?? 0);
  const lastMonth = Number((revenueData[0] as Record<string, unknown>)?.last_month ?? 0);

  return (
    <div className="space-y-8">
      {/* Quick stats */}
      {properties.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-2xl font-bold text-gray-900">{properties.length}</p>
            <p className="text-sm text-gray-500">Properties</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
            <p className="text-sm text-gray-500">Active Bookings</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-2xl font-bold text-gray-900">{taskCount}</p>
            <p className="text-sm text-gray-500">Pending Tasks</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-2xl font-bold text-gray-900">
              {thisMonth > 0 ? formatCurrency(thisMonth) : "-"}
            </p>
            <p className="text-sm text-gray-500">
              Revenue this month
              {lastMonth > 0 && thisMonth > 0 && (
                <span className={thisMonth >= lastMonth ? "text-green-600 ml-1" : "text-red-500 ml-1"}>
                  {thisMonth >= lastMonth ? "+" : ""}
                  {Math.round(((thisMonth - lastMonth) / lastMonth) * 100)}%
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Properties */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Properties</h2>
          <Link
            to="/add-property"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            + Add Property
          </Link>
        </div>
        {properties.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Welcome to Jamii
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Add your first property to start managing bookings, tasks, and
              guest communications — even offline.
            </p>
            <Link
              to="/add-property"
              className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Add Your First Property
            </Link>
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
                {p.description && (
                  <p className="text-xs text-gray-400 mt-2 line-clamp-2">{p.description}</p>
                )}
                <AmenityTags raw={p.amenities} />
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

function AmenityTags({ raw }: { raw: string | null | undefined }) {
  if (!raw) return null;
  let tags: string[] = [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) tags = parsed.filter(Boolean);
  } catch {
    tags = raw.split(",").map((s) => s.trim()).filter(Boolean);
  }
  if (tags.length === 0) return null;
  const shown = tags.slice(0, 4);
  const more = tags.length - shown.length;
  return (
    <div className="flex flex-wrap gap-1 mt-3">
      {shown.map((a) => (
        <span key={a} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
          {a}
        </span>
      ))}
      {more > 0 && (
        <span className="text-gray-400 text-xs px-1 py-0.5">+{more}</span>
      )}
    </div>
  );
}
