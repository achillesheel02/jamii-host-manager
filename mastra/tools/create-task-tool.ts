import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? "",
);

export const createTaskTool = createTool({
  id: "create-task",
  description:
    "Creates a new task for a property (cleaning, maintenance, turnover, supplies, inspection). The task syncs to the host's device via PowerSync.",
  inputSchema: z.object({
    propertyId: z.string().describe("The property UUID this task belongs to"),
    type: z
      .enum(["cleaning", "maintenance", "turnover", "supplies", "inspection"])
      .describe("Task type"),
    description: z.string().describe("What needs to be done"),
    dueDate: z
      .string()
      .optional()
      .describe("Due date in YYYY-MM-DD format (optional)"),
    bookingId: z
      .string()
      .optional()
      .describe("Related booking UUID (optional)"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    taskId: z.string().optional(),
    message: z.string(),
  }),
  execute: async ({ propertyId, type, description, dueDate, bookingId }) => {
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        property_id: propertyId,
        type,
        description,
        status: "pending",
        due_date: dueDate ?? null,
        booking_id: bookingId ?? null,
      })
      .select("id")
      .single();

    if (error) {
      return {
        success: false,
        message: `Failed to create task: ${error.message}`,
      };
    }

    return {
      success: true,
      taskId: data.id,
      message: `Created ${type} task: "${description}"${dueDate ? ` due ${dueDate}` : ""}. It will appear in the host's task list shortly.`,
    };
  },
});
