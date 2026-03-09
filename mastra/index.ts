import { Mastra } from "@mastra/core";
import { LibSQLStore } from "@mastra/libsql";
import { hostAgent } from "./agents/host-agent";

export const mastra = new Mastra({
  agents: { hostAgent },
  storage: new LibSQLStore({ id: "jamii-storage", url: "file:./jamii-memory.db" }),
});
