#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

console.error('Starting TAM MCP Server (STDIO transport)...');

async function main() {
  const transport = new StdioServerTransport();
  const { server, cleanup } = await createServer();

  await server.connect(transport);

  // Cleanup on exit
  process.on("SIGINT", async () => {
    await cleanup();
    await server.close();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error("TAM MCP Server error:", error);
  process.exit(1);
});
