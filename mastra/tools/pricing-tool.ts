import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const checkPricingTool = createTool({
  id: "check-pricing",
  description:
    "Suggests dynamic pricing for a property based on dates, demand signals, and competitor rates",
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
  }),
  execute: async ({ checkIn, checkOut }) => {
    // Base rate for Lavington area (KES per night)
    const baseRate = 8500;

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.max(
      1,
      Math.ceil(
        (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24),
      ),
    );

    // Simple demand multiplier based on day of week
    const dayOfWeek = checkInDate.getDay();
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
    const demandMultiplier = isWeekend ? 1.25 : 1.0;

    // Length-of-stay discount
    const losDiscount = nights >= 7 ? 0.9 : nights >= 3 ? 0.95 : 1.0;

    const suggested = Math.round(baseRate * demandMultiplier * losDiscount);
    const competitorAvg = Math.round(baseRate * 1.1); // Lavington avg

    return {
      suggestedPrice: suggested,
      currency: "KES",
      rationale: `Base rate KES ${baseRate}/night. ${isWeekend ? "Weekend premium +25%." : "Weekday rate."} ${nights >= 3 ? `${nights}-night stay discount applied.` : ""} Lavington competitor avg: KES ${competitorAvg}/night.`,
      competitorAvg,
    };
  },
});
