import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? "",
);

/**
 * Learn Memory — the Hive's ability to grow.
 *
 * Creates a new memory or validates an existing one.
 * New memories start with lambda=1.0 (high decay).
 * Each validation reduces lambda by 0.7x (slower decay).
 * This mirrors CIF's retrieval protocol: successful recall strengthens memory.
 */
export const learnMemoryTool = createTool({
  id: "learn-memory",
  description:
    "Store a new guest insight or validate an existing memory. New memories start weak (high decay) and strengthen through validation. Use this when you learn something new about a guest from conversation, or when a returning guest confirms a known preference.",
  inputSchema: z.object({
    action: z.enum(["create", "validate"]).describe("'create' for new memory, 'validate' to strengthen existing"),
    // For create
    propertyId: z.string().optional().describe("Property UUID (required for create)"),
    guestEmail: z.string().optional().describe("Guest email (required for create)"),
    memoryType: z.enum(["preference", "feedback", "requirement", "interest", "complaint"]).optional(),
    content: z.string().optional().describe("The memory content (required for create)"),
    confidence: z.number().min(0).max(1).optional().describe("Initial confidence 0-1 (default 0.6)"),
    // For validate
    memoryId: z.string().optional().describe("Memory ID to validate (required for validate)"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    memoryId: z.string().optional(),
    newStrength: z.number().optional(),
  }),
  execute: async ({ action, propertyId, guestEmail, memoryType, content, confidence, memoryId }) => {
    if (action === "create") {
      if (!propertyId || !guestEmail || !content) {
        return { success: false, message: "propertyId, guestEmail, and content are required for create" };
      }

      const { data, error } = await supabase
        .from("agent_memories")
        .insert({
          property_id: propertyId,
          guest_email: guestEmail,
          memory_type: memoryType ?? "preference",
          content,
          confidence: confidence ?? 0.6,
          decay_lambda: 1.0, // starts high — needs validation to strengthen
          times_validated: 1,
          last_validated: new Date().toISOString(),
          source: "agent",
        })
        .select("id")
        .single();

      if (error) {
        return { success: false, message: `Failed to create memory: ${error.message}` };
      }

      return {
        success: true,
        message: `Learned: "${content}" (confidence ${Math.round((confidence ?? 0.6) * 100)}%). Memory will strengthen if validated on next stay.`,
        memoryId: data.id,
        newStrength: confidence ?? 0.6,
      };
    }

    if (action === "validate") {
      if (!memoryId) {
        return { success: false, message: "memoryId is required for validate" };
      }

      // Fetch current memory
      const { data: memory, error: fetchError } = await supabase
        .from("agent_memories")
        .select("decay_lambda, times_validated, confidence")
        .eq("id", memoryId)
        .single();

      if (fetchError || !memory) {
        return { success: false, message: `Memory not found: ${fetchError?.message ?? "unknown"}` };
      }

      const newLambda = Math.max(0.1, Number(memory.decay_lambda ?? 1.0) * 0.7);
      const newValidated = Number(memory.times_validated ?? 1) + 1;
      const newConfidence = Math.min(1.0, Number(memory.confidence ?? 0.5) + 0.05);

      const { error: updateError } = await supabase
        .from("agent_memories")
        .update({
          decay_lambda: newLambda,
          times_validated: newValidated,
          confidence: newConfidence,
          last_validated: new Date().toISOString(),
        })
        .eq("id", memoryId);

      if (updateError) {
        return { success: false, message: `Failed to validate: ${updateError.message}` };
      }

      return {
        success: true,
        message: `Memory validated (${newValidated}x). Decay reduced to ${Math.round(newLambda * 100)}%. This memory is now stronger.`,
        memoryId,
        newStrength: Math.round(newConfidence * Math.exp(-newLambda * 0.1) * 100) / 100,
      };
    }

    return { success: false, message: "Invalid action" };
  },
});
