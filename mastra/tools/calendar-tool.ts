import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? "",
);

export const checkAvailabilityTool = createTool({
  id: "check-availability",
  description:
    "Checks if a property is available for given dates by looking at existing bookings",
  inputSchema: z.object({
    propertyId: z.string().describe("The property UUID"),
    checkIn: z.string().describe("Desired check-in date YYYY-MM-DD"),
    checkOut: z.string().describe("Desired check-out date YYYY-MM-DD"),
  }),
  outputSchema: z.object({
    available: z.boolean(),
    conflictingBookings: z.number(),
    nextAvailableDate: z.string().optional(),
  }),
  execute: async ({ propertyId, checkIn, checkOut }) => {
    const { data: conflicts } = await supabase
      .from("bookings")
      .select("*")
      .eq("property_id", propertyId)
      .in("status", ["confirmed", "checked_in"])
      .lt("check_in", checkOut)
      .gt("check_out", checkIn);

    const conflictList = conflicts ?? [];
    let nextAvailable: string | undefined;

    if (conflictList.length > 0) {
      const latestCheckout = conflictList.reduce<string>((latest, b) => {
        const co = String(b.check_out ?? "");
        return co > latest ? co : latest;
      }, "");
      nextAvailable = latestCheckout;
    }

    return {
      available: conflictList.length === 0,
      conflictingBookings: conflictList.length,
      nextAvailableDate: nextAvailable,
    };
  },
});
