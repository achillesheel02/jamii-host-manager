import { Mastra } from "@mastra/core";
import { hostAgent } from "./agents/host-agent";

export const mastra = new Mastra({
  agents: { hostAgent },
});
