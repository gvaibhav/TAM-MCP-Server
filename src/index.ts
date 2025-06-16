#!/usr/bin/env node

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
        console.error(`Unknown transport method: ${scriptName}`);
        console.error("Available transport methods:");
        console.error("- stdio (default)");
        console.error("- sse");
        console.error("- http/streamableHttp");
        process.exit(1);
    }
  } catch (error) {
    console.error("Error starting TAM MCP Server:", error);
    process.exit(1);
  }
}

run();
