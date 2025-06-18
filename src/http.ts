#!/usr/bin/env node

import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { InMemoryEventStore } from "@modelcontextprotocol/sdk/examples/shared/inMemoryEventStore.js";
import express, { Request, Response } from "express";
import { createServer } from "./server.js";
import { randomUUID } from "node:crypto";

console.error("Starting TAM MCP Server (Streamable HTTP transport)...");

const app = express();

const transports: Map<string, StreamableHTTPServerTransport> = new Map<
  string,
  StreamableHTTPServerTransport
>();

app.post("/mcp", async (req: Request, res: Response) => {
  console.error("Received TAM MCP POST request");
  try {
    // Check for existing session ID
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports.has(sessionId)) {
      // Reuse existing transport
      transport = transports.get(sessionId)!;
    } else if (!sessionId) {
      const { server, cleanup, notificationService } = await createServer();

      // New initialization request
      const eventStore = new InMemoryEventStore();
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        eventStore, // Enable resumability
        onsessioninitialized: async (sessionId: string) => {
          // Store the transport by session ID when session is initialized
          console.error(`TAM MCP Session initialized with ID: ${sessionId}`);
          transports.set(sessionId, transport);

          // Send welcome notification
          await notificationService.sendMessage(
            "info",
            `TAM MCP Server connected via HTTP (Session: ${sessionId})`,
          );
        },
      });

      // Set up onclose handler to clean up transport when closed
      server.onclose = async () => {
        const sid = transport.sessionId;
        if (sid && transports.has(sid)) {
          console.error(
            `TAM MCP Transport closed for session ${sid}, removing from transports map`,
          );
          transports.delete(sid);
          await cleanup();
        }
      };

      // Connect the transport to the MCP server BEFORE handling the request
      await server.connect(transport as any);

      await transport.handleRequest(req, res);
      return; // Already handled
    } else {
      // Invalid request - no session ID or not initialization request
      res.status(400).json({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Bad Request: No valid session ID provided",
        },
        id: req?.body?.id,
      });
      return;
    }

    // Handle the request with existing transport
    await transport.handleRequest(req, res);
  } catch (error) {
    console.error("Error handling TAM MCP request:", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error",
        },
        id: req?.body?.id,
      });
      return;
    }
  }
});

// Handle GET requests for SSE streams
app.get("/mcp", async (req: Request, res: Response) => {
  console.error("Received TAM MCP GET request");
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (!sessionId || !transports.has(sessionId)) {
    res.status(400).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Bad Request: No valid session ID provided",
      },
      id: req?.body?.id,
    });
    return;
  }

  // Check for Last-Event-ID header for resumability
  const lastEventId = req.headers["last-event-id"] as string | undefined;
  if (lastEventId) {
    console.error(
      `TAM MCP Client reconnecting with Last-Event-ID: ${lastEventId}`,
    );
  } else {
    console.error(
      `TAM MCP Establishing new SSE stream for session ${sessionId}`,
    );
  }

  const transport = transports.get(sessionId);
  await transport!.handleRequest(req, res);
});

// Handle DELETE requests for session termination
app.delete("/mcp", async (req: Request, res: Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (!sessionId || !transports.has(sessionId)) {
    res.status(400).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Bad Request: No valid session ID provided",
      },
      id: req?.body?.id,
    });
    return;
  }

  console.error(
    `TAM MCP Received session termination request for session ${sessionId}`,
  );

  try {
    const transport = transports.get(sessionId);
    await transport!.handleRequest(req, res);
  } catch (error) {
    console.error("Error handling session termination:", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Error handling session termination",
        },
        id: req?.body?.id,
      });
      return;
    }
  }
});

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({
    status: "healthy",
    service: "tam-mcp-server-http",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    activeSessions: transports.size,
  });
});

// Start the server
const PORT = process.env.PORT ?? 3002;
app.listen(PORT, () => {
  console.error(`TAM MCP Server (Streamable HTTP) listening on port ${PORT}`);
  console.error(`Health check: http://localhost:${PORT}/health`);
  console.error(`MCP endpoint: http://localhost:${PORT}/mcp`);
});

// Handle server shutdown
process.on("SIGINT", async () => {
  console.error("Shutting down TAM MCP Server (Streamable HTTP)...");

  // Close all active transports to properly clean up resources
  for (const sessionId of transports.keys()) {
    try {
      console.error(`Closing transport for session ${sessionId}`);
      await transports.get(sessionId)!.close();
      transports.delete(sessionId);
    } catch (error) {
      console.error(`Error closing transport for session ${sessionId}:`, error);
    }
  }

  console.error("TAM MCP Server shutdown complete");
  process.exit(0);
});
