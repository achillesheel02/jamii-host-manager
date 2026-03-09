import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? "",
);

export const draftMessageTool = createTool({
  id: "draft-message",
  description:
    "Drafts a guest message on behalf of the host. The message is saved as unsent (ai_generated=true, sent=false) so the host can review and send it. Syncs to the host's device via PowerSync.",
  inputSchema: z.object({
    bookingId: z.string().describe("The booking UUID to attach the message to"),
    content: z.string().describe("The message content to draft"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    messageId: z.string().optional(),
    message: z.string(),
  }),
  execute: async ({ bookingId, content }) => {
    const { data, error } = await supabase
      .from("messages")
      .insert({
        booking_id: bookingId,
        sender: "host",
        content,
        ai_generated: true,
        sent: false,
        synced: true,
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      return {
        success: false,
        message: `Failed to draft message: ${error.message}`,
      };
    }

    return {
      success: true,
      messageId: data.id,
      message: `Drafted a message for the host to review: "${content.slice(0, 80)}${content.length > 80 ? "..." : ""}". The host can review and send it from the booking detail page.`,
    };
  },
});
