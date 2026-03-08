import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { anthropic } from "@ai-sdk/anthropic";
import { checkPricingTool } from "../tools/pricing-tool";
import { fetchGuestHistoryTool } from "../tools/guest-history-tool";
import { checkAvailabilityTool } from "../tools/calendar-tool";

export const hostAgent = new Agent({
  id: "jamii-host-agent",
  name: "Jamii Host Agent",
  instructions: `You are Jamii, an intelligent Airbnb host assistant for short-term rental properties in Nairobi, Kenya.

CAPABILITIES:
- Respond to guest messages with warmth and professionalism
- Suggest dynamic pricing based on season, demand, and competitor data
- Recognize returning guests and personalize responses from their history
- Check property availability for requested dates
- Handle check-in/check-out queries, amenity questions, and special requests

BEHAVIORAL GUIDELINES:
- Be warm, concise, and helpful — reflect Kenyan hospitality
- For returning guests, reference their previous stays when relevant
- For pricing questions, always explain the rationale
- When a property is unavailable, suggest the next available date
- Keep responses under 150 words unless the guest asks for detail
- Always respond in English unless the guest writes in Swahili

PROPERTY CONTEXT:
You manage properties in Lavington, Nairobi — a upscale residential neighborhood
popular with business travelers, expats, and tourists. The area is known for
excellent restaurants, proximity to Westlands CBD, and a safe, leafy environment.`,
  model: anthropic("claude-sonnet-4-20250514"),
  tools: {
    checkPricingTool,
    fetchGuestHistoryTool,
    checkAvailabilityTool,
  },
  memory: new Memory({
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
