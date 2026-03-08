import { Link } from "react-router-dom";
import type { BookingRecord } from "@/lib/powersync/schema";

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-blue-100 text-blue-800",
  checked_in: "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

export function BookingCard({ booking }: { booking: BookingRecord & { id: string } }) {
  const statusClass = (booking.status ? STATUS_COLORS[booking.status] : null) ?? "bg-gray-100 text-gray-800";

  return (
    <Link
      to={`/booking/${booking.id}`}
      className="block bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium text-gray-900">{booking.guest_name}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {booking.check_in} &rarr; {booking.check_out}
          </p>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusClass}`}>
          {booking.status}
        </span>
      </div>
      {booking.total_price && (
        <p className="text-sm text-gray-600 mt-2">
          KES {Number(booking.total_price).toLocaleString()}
        </p>
      )}
    </Link>
  );
}
