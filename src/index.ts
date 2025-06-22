#!/usr/bin/env node

import { logger } from "./utils/index.js";

// Parse command line arguments first
const args = process.argv.slice(2);
const scriptName = args[0] || "stdio";

async function run() {
  try {
    // Dynamically import only the requested module to prevent all modules from initializing
    switch (scriptName) {
      case "stdio":
        // Import and run the default STDIO server
        await import("./stdio-simple.js");
        break;
      case "sse":
        // Import and run the SSE server
        await import("./sse-new.js");
        break;
      case "http":
      case "streamableHttp":
        // Import and run the streamable HTTP server
        await import("./http.js");
        break;
      default:
        logger.error(`Unknown transport method: ${scriptName}`);
        logger.error("Available transport methods:");
        logger.error("- stdio (default)");
        logger.error("- sse");
        logger.error("- http/streamableHttp");
        process.exit(1);
    }
  } catch (error) {
    logger.error("Error starting TAM MCP Server:", error);
    process.exit(1);
  }
}

void run();
