import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? "",
);

export const fetchGuestHistoryTool = createTool({
  id: "fetch-guest-history",
  description:
    "Retrieves previous stay history and Hive memories for a guest. Returns memories with confidence strength (accounting for decay) so you know which memories to trust.",
  inputSchema: z.object({
    guestEmail: z.string().email().describe("Guest email address"),
  }),
  outputSchema: z.object({
    isReturning: z.boolean(),
    previousStays: z.number(),
    memories: z.array(
      z.object({
        id: z.string(),
        type: z.string(),
        content: z.string(),
        confidence: z.number(),
        strength: z.number().describe("Effective memory strength after decay (0-1). Below 0.3 = unreliable."),
        timesValidated: z.number(),
        needsValidation: z.boolean(),
        source: z.string(),
      }),
    ),
  }),
  execute: async ({ guestEmail }) => {
    const { data: bookings } = await supabase
      .from("bookings")
      .select("*")
      .eq("guest_email", guestEmail)
      .eq("status", "completed")
      .order("check_out", { ascending: false });

    const { data: memories } = await supabase
      .from("agent_memories")
      .select("id, memory_type, content, confidence, decay_lambda, times_validated, last_validated, source")
      .eq("guest_email", guestEmail)
      .order("confidence", { ascending: false });

    return {
      isReturning: (bookings?.length ?? 0) > 0,
      previousStays: bookings?.length ?? 0,
      memories: (memories ?? []).map((m) => {
        const confidence = Number(m.confidence ?? 0.5);
        const lambda = Number(m.decay_lambda ?? 1.0);
        const timesValidated = Number(m.times_validated ?? 1);
        // Effective strength = confidence * decay factor
        const daysSinceValidation = m.last_validated
          ? (Date.now() - new Date(m.last_validated).getTime()) / 86400000
          : 30;
        const strength = Math.round(confidence * Math.exp(-lambda * daysSinceValidation / 90) * 100) / 100;
        return {
          id: String(m.id ?? ""),
          type: String(m.memory_type ?? ""),
          content: String(m.content ?? ""),
          confidence,
          strength,
          timesValidated,
          needsValidation: lambda >= 1.0 && timesValidated <= 1,
          source: String(m.source ?? "agent"),
        };
      }),
    };
  },
});
