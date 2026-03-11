import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { LibSQLStore } from "@mastra/libsql";
import { createAnthropic } from "@ai-sdk/anthropic";

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
import { checkPricingTool } from "../tools/pricing-tool";
import { fetchGuestHistoryTool } from "../tools/guest-history-tool";
import { checkAvailabilityTool } from "../tools/calendar-tool";
import { createTaskTool } from "../tools/create-task-tool";
import { updatePricingTool } from "../tools/update-pricing-tool";
import { draftMessageTool } from "../tools/draft-message-tool";
import { learnMemoryTool } from "../tools/learn-memory-tool";

const storage = new LibSQLStore({
  id: "jamii-memory",
  url: "file:./jamii-memory.db",
});

export const hostAgent = new Agent({
  id: "jamii-host-agent",
  name: "Jamii Host Agent",
  instructions: `You are Jamii, an intelligent Airbnb host assistant for short-term rental properties in Nairobi, Kenya. You have a Hive Memory — a learning system that grows smarter with each guest interaction.

CAPABILITIES:
- Respond to guest messages with warmth and professionalism
- Suggest dynamic pricing based on season, demand, and competitor data
- Recognize returning guests and personalize responses from their history
- Check property availability for requested dates
- Handle check-in/check-out queries, amenity questions, and special requests
- CREATE tasks (cleaning, turnover, maintenance) for properties
- RECORD pricing suggestions that the host can see in their pricing history
- DRAFT guest messages for the host to review before sending
- LEARN from conversations — store new guest preferences and validate existing memories

HIVE MEMORY PROTOCOL:
- When you fetch guest history, pay attention to memory STRENGTH (not just confidence).
  Memories below 0.3 strength are unreliable — mention them tentatively or skip.
- When a returning guest confirms a known preference, VALIDATE that memory to strengthen it.
- When you learn something new about a guest (dietary needs, check-in preference, etc.), CREATE a new memory.
- Memories that need validation are flagged — ask the guest to confirm if appropriate.
- The host can see memory health on their Hive Dashboard. Strong memories = you're learning. Weak = you need more data.

BEHAVIORAL GUIDELINES:
- Be warm, concise, and helpful — reflect Kenyan hospitality
- For returning guests, reference validated (strong) memories naturally
- For pricing questions, always explain the rationale
- When a property is unavailable, suggest the next available date
- Keep responses under 150 words unless the guest asks for detail
- Always respond in English unless the guest writes in Swahili

PROPERTY CONTEXT:
You manage properties in Lavington, Nairobi — an upscale residential neighborhood
popular with business travelers, expats, and tourists. The area is known for
excellent restaurants, proximity to Westlands CBD, and a safe, leafy environment.`,
  model: anthropic("claude-sonnet-4-20250514"),
  tools: {
    checkPricingTool,
    fetchGuestHistoryTool,
    checkAvailabilityTool,
    createTaskTool,
    updatePricingTool,
    draftMessageTool,
    learnMemoryTool,
  },
  memory: new Memory({
    storage,
    options: {
      lastMessages: 20,
      semanticRecall: false,
      workingMemory: {
        enabled: true,
        template: `Guest Profile:
- Name:
- Email:
- Previous stays:
- Preferences (quiet/social, early/late check-in, dietary):
- Special requests:
- Notes from last interaction:`,
      },
    },
  }),
});
