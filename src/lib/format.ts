/**
 * Shared formatting utilities for Jamii Host Manager.
 * Locale-aware date/currency formatting for the Kenyan market.
 */

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const DATE_SHORT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
});

const CURRENCY_FORMAT = new Intl.NumberFormat("en-KE", {
  maximumFractionDigits: 0,
});

/** "8 Mar 2026" */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date + (typeof date === "string" && !date.includes("T") ? "T00:00:00" : "")) : date;
  if (isNaN(d.getTime())) return String(date);
  return DATE_FORMAT.format(d);
}

/** "8 Mar" — no year, for compact displays */
export function formatDateShort(date: string | Date | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date + (!date.includes("T") ? "T00:00:00" : "")) : date;
  if (isNaN(d.getTime())) return String(date);
  return DATE_SHORT.format(d);
}

/** "KES 8,500" */
export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount == null || amount === "") return "-";
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (isNaN(n)) return "-";
  return `KES ${CURRENCY_FORMAT.format(n)}`;
}

/** "3 nights" from check-in/check-out dates */
export function nightCount(checkIn: string, checkOut: string): number {
  const a = new Date(checkIn + "T00:00:00");
  const b = new Date(checkOut + "T00:00:00");
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
}
