#!/usr/bin/env node

import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import { createServer } from "./server.js";
import { logger } from "./utils/index.js";

logger.info("Starting TAM MCP Server (SSE transport)...");

const app = express();
app.use(express.json());

const transports: Map<string, SSEServerTransport> = new Map<
  string,
  SSEServerTransport
>();

app.get("/sse", async (req, res) => {
  let transport: SSEServerTransport;
  const { server, cleanup, notificationService } = await createServer();

  if (req?.query?.sessionId) {
    const sessionId = req?.query?.sessionId as string;
    transport = transports.get(sessionId) as SSEServerTransport;
    logger.warn(
      "Client Reconnecting? This shouldn't happen; when client has a sessionId, GET /sse should not be called again.",
      { sessionId: transport.sessionId },
    );
  } else {
    // Create and store transport for new session
    transport = new SSEServerTransport("/message", res);
    transports.set(transport.sessionId, transport);

    // Connect server to transport
    await server.connect(transport);
    logger.info("TAM MCP Client Connected", { sessionId: transport.sessionId });

    // Send welcome notification
    await notificationService.sendMessage(
      "info",
      `TAM MCP Server connected via SSE (Session: ${transport.sessionId})`,
    );

    // Handle close of connection
    server.onclose = async () => {
      logger.info("TAM MCP Client Disconnected", {
        sessionId: transport.sessionId,
      });
      transports.delete(transport.sessionId);
      await cleanup();
    };
  }
});

app.post("/message", async (req, res) => {
  const sessionId = req?.query?.sessionId as string;
  const transport = transports.get(sessionId);
  if (transport) {
    logger.debug("TAM MCP Client Message received", { sessionId });
    await transport.handlePostMessage(req, res);
  } else {
    logger.error(`No transport found for sessionId ${sessionId}`);
  }
});

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({
    status: "healthy",
    service: "tam-mcp-server-sse",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => {
  logger.info(`TAM MCP Server (SSE) running on port ${PORT}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
  logger.info(`SSE endpoint: http://localhost:${PORT}/sse`);
});
