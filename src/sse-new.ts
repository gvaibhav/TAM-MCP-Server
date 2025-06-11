#!/usr/bin/env node

import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import { createServer } from "./server.js";

console.error('Starting TAM MCP Server (SSE transport)...');

const app = express();
app.use(express.json());

const transports: Map<string, SSEServerTransport> = new Map<string, SSEServerTransport>();

app.get("/sse", async (req, res) => {
  let transport: SSEServerTransport;
  const { server, cleanup, notificationService } = await createServer();

  if (req?.query?.sessionId) {
    const sessionId = (req?.query?.sessionId as string);
    transport = transports.get(sessionId) as SSEServerTransport;
    console.error("Client Reconnecting? This shouldn't happen; when client has a sessionId, GET /sse should not be called again.", transport.sessionId);
  } else {
    // Create and store transport for new session
    transport = new SSEServerTransport("/message", res);
    transports.set(transport.sessionId, transport);

    // Connect server to transport
    await server.connect(transport);
    console.error("TAM MCP Client Connected: ", transport.sessionId);

    // Send welcome notification
    await notificationService.sendMessage('info', `TAM MCP Server connected via SSE (Session: ${transport.sessionId})`);

    // Handle close of connection
    server.onclose = async () => {
      console.error("TAM MCP Client Disconnected: ", transport.sessionId);
      transports.delete(transport.sessionId);
      await cleanup();
    };
  }
});

app.post("/message", async (req, res) => {
  const sessionId = (req?.query?.sessionId as string);
  const transport = transports.get(sessionId);
  if (transport) {
    console.error("TAM MCP Client Message from", sessionId);
    await transport.handlePostMessage(req, res);
  } else {
    console.error(`No transport found for sessionId ${sessionId}`)
  }
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'tam-mcp-server-sse',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.error(`TAM MCP Server (SSE) running on port ${PORT}`);
  console.error(`Health check: http://localhost:${PORT}/health`);
  console.error(`SSE endpoint: http://localhost:${PORT}/sse`);
});
