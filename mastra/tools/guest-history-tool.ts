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
    "Retrieves previous stay history and agent memories for a guest by email",
  inputSchema: z.object({
    guestEmail: z.string().email().describe("Guest email address"),
  }),
  outputSchema: z.object({
    isReturning: z.boolean(),
    previousStays: z.number(),
    memories: z.array(
      z.object({
        type: z.string(),
        content: z.string(),
        confidence: z.number(),
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
      .select("memory_type, content, confidence")
      .eq("guest_email", guestEmail)
      .order("created_at", { ascending: false });

    return {
      isReturning: (bookings?.length ?? 0) > 0,
      previousStays: bookings?.length ?? 0,
      memories: (memories ?? []).map((m) => ({
        type: String(m.memory_type ?? ""),
        content: String(m.content ?? ""),
        confidence: Number(m.confidence ?? 0.5),
      })),
    };
  },
});
