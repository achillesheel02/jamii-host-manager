import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? "",
);

export const updatePricingTool = createTool({
  id: "update-pricing",
  description:
    "Records an AI-generated pricing suggestion for a property on a specific date. The suggestion syncs to the host's device via PowerSync so they can see it even offline.",
  inputSchema: z.object({
    propertyId: z.string().describe("The property UUID"),
    date: z.string().describe("Date for the pricing suggestion (YYYY-MM-DD)"),
    suggestedPrice: z
      .number()
      .describe("Suggested nightly rate in KES"),
    competitorAvg: z
      .number()
      .optional()
      .describe("Average competitor rate in KES (if known)"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
  }),
  execute: async ({ propertyId, date, suggestedPrice, competitorAvg }) => {
    const { error } = await supabase.from("pricing_history").insert({
      property_id: propertyId,
      date,
      suggested_price: suggestedPrice,
      actual_price: null,
      source: "agent",
      competitor_avg: competitorAvg ?? null,
    });

    if (error) {
      return {
        success: false,
        message: `Failed to record pricing: ${error.message}`,
      };
    }

    return {
      success: true,
      message: `Recorded pricing suggestion of KES ${suggestedPrice.toLocaleString()} for ${date}. The host will see this in their pricing history.`,
    };
  },
});
