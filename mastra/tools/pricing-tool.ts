import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? "",
);

export const checkPricingTool = createTool({
  id: "check-pricing",
  description:
    "Suggests dynamic pricing for a property based on dates, demand signals, competitor rates, and historical pricing data from Supabase",
  inputSchema: z.object({
    propertyId: z.string().describe("The property UUID"),
    checkIn: z.string().describe("Check-in date YYYY-MM-DD"),
    checkOut: z.string().describe("Check-out date YYYY-MM-DD"),
  }),
  outputSchema: z.object({
    suggestedPrice: z.number(),
    currency: z.string(),
    rationale: z.string(),
    competitorAvg: z.number().optional(),
    occupancyRate: z.number().optional(),
    recentAvgPrice: z.number().optional(),
  }),
  execute: async ({ propertyId, checkIn, checkOut }) => {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.max(
      1,
      Math.ceil(
        (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24),
      ),
    );

    // Fetch recent pricing history for this property
    const { data: pricingHistory } = await supabase
      .from("pricing_history")
      .select("suggested_price, actual_price, competitor_avg")
      .eq("property_id", propertyId)
      .order("date", { ascending: false })
      .limit(14);

    // Fetch bookings for the next 30 days to compute occupancy
    const today = new Date().toISOString().slice(0, 10);
    const thirtyDays = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    const { data: nearBookings } = await supabase
      .from("bookings")
      .select("check_in, check_out")
      .eq("property_id", propertyId)
      .in("status", ["confirmed", "checked_in"])
      .lt("check_in", thirtyDays)
      .gt("check_out", today);

    // Compute average actual/suggested price from history
    const prices = (pricingHistory ?? [])
      .map((p) => Number(p.actual_price ?? p.suggested_price ?? 0))
      .filter((n) => n > 0);
    const recentAvg = prices.length > 0
      ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
      : 8500; // Lavington fallback

    // Compute competitor average from history
    const compPrices = (pricingHistory ?? [])
      .map((p) => Number(p.competitor_avg ?? 0))
      .filter((n) => n > 0);
    const competitorAvg = compPrices.length > 0
      ? Math.round(compPrices.reduce((a, b) => a + b, 0) / compPrices.length)
      : undefined;

    // Compute occupancy rate (booked nights / 30)
    let bookedNights = 0;
    for (const b of nearBookings ?? []) {
      const bIn = new Date(Math.max(new Date(b.check_in).getTime(), Date.now()));
      const bOut = new Date(Math.min(new Date(b.check_out).getTime(), new Date(thirtyDays).getTime()));
      bookedNights += Math.max(0, Math.ceil((bOut.getTime() - bIn.getTime()) / 86400000));
    }
    const occupancyRate = Math.round((bookedNights / 30) * 100);

    // Dynamic pricing logic
    const baseRate = recentAvg;
    const dayOfWeek = checkInDate.getDay();
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

    // Demand multiplier based on occupancy
    let demandMultiplier = 1.0;
    if (occupancyRate > 80) demandMultiplier = 1.2;
    else if (occupancyRate > 60) demandMultiplier = 1.1;
    else if (occupancyRate < 30) demandMultiplier = 0.9;

    // Weekend premium
    const weekendMultiplier = isWeekend ? 1.15 : 1.0;

    // Length-of-stay discount
    const losDiscount = nights >= 7 ? 0.9 : nights >= 3 ? 0.95 : 1.0;

    const suggested = Math.round(baseRate * demandMultiplier * weekendMultiplier * losDiscount);

    // Build rationale
    const parts: string[] = [];
    parts.push(`Based on recent avg rate of KES ${recentAvg.toLocaleString()}/night.`);
    if (isWeekend) parts.push("Weekend premium +15%.");
    if (occupancyRate > 60) parts.push(`High demand — ${occupancyRate}% occupancy next 30 days.`);
    if (occupancyRate < 30) parts.push(`Low demand — ${occupancyRate}% occupancy. Discounted 10%.`);
    if (nights >= 3) parts.push(`${nights}-night stay discount applied.`);
    if (competitorAvg) parts.push(`Lavington competitor avg: KES ${competitorAvg.toLocaleString()}/night.`);

    return {
      suggestedPrice: suggested,
      currency: "KES",
      rationale: parts.join(" "),
      competitorAvg,
      occupancyRate,
      recentAvgPrice: recentAvg,
    };
  },
});
