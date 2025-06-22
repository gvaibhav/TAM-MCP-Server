#!/usr/bin/env node

// Load environment variables FIRST, before any other imports
import * as dotenv from "dotenv";
dotenv.config();

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";
import { logger } from "./utils/index.js";

logger.info("Starting TAM MCP Server (STDIO transport)...");

async function main() {
  const transport = new StdioServerTransport();
  const { server, cleanup, sendWelcomeNotification } = await createServer();

  await server.connect(transport);

  // Send welcome notification after connection is established
  setTimeout(async () => {
    await sendWelcomeNotification();
  }, 1000); // Wait 1 second for connection to be fully established

  // Cleanup on exit
  process.on("SIGINT", async () => {
    await cleanup();
    await server.close();
    process.exit(0);
  });
}

main().catch((error) => {
  logger.error("TAM MCP Server error:", error);
  process.exit(1);
});
