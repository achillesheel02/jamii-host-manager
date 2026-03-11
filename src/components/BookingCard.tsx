import { Link } from "react-router-dom";
import type { BookingRecord } from "@/lib/powersync/schema";
import { formatDate, formatCurrency, nightCount } from "@/lib/format";

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-amber-100 text-amber-800",
  checked_in: "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmed",
  checked_in: "Checked In",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function BookingCard({ booking }: { booking: BookingRecord & { id: string } }) {
  const statusClass = (booking.status ? STATUS_COLORS[booking.status] : null) ?? "bg-gray-100 text-gray-800";
  const statusLabel = (booking.status ? STATUS_LABELS[booking.status] : null) ?? booking.status;
  const nights = booking.check_in && booking.check_out
    ? nightCount(booking.check_in, booking.check_out)
    : null;

  return (
    <Link
      to={`/booking/${booking.id}`}
      className="block bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium text-gray-900">{booking.guest_name}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {formatDate(booking.check_in)} &rarr; {formatDate(booking.check_out)}
            {nights && (
              <span className="text-gray-400 ml-1">
                ({nights} {nights === 1 ? "night" : "nights"})
              </span>
            )}
          </p>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusClass}`}>
          {statusLabel}
        </span>
      </div>
      {booking.total_price && (
        <p className="text-sm text-gray-600 mt-2">
          {formatCurrency(booking.total_price)}
        </p>
      )}
    </Link>
  );
}
