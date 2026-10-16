#!/usr/bin/env node
// Verify client-visible status guidance and real documentation reads over HTTP.
// This check does not call providers or validate market data.
import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const statusUris = [
  "tam://data-source-status",
  "tam://mcp-status",
  "tam://api-key-setup",
];
const endpoint = new URL(process.argv[2] ?? "http://127.0.0.1:3000/mcp");
const client = new Client({ name: "tam-status-verification", version: "1.0.0" });
const transport = new StreamableHTTPClientTransport(endpoint);

try {
  await client.connect(transport, { timeout: 15000 });
  const instructions = client.getInstructions();
  assert.ok(instructions, "initialize must supply client instructions");
  const { resources } = await client.listResources();
  const { tools } = await client.listTools();
  assert.ok(tools.length > 0, "tools/list must expose tool definitions");

  for (const uri of statusUris) {
    assert.ok(instructions.includes(uri), `initialize must reference ${uri}`);
    assert.ok(resources.some(resource => resource.uri === uri), `${uri} must be discoverable`);
    const { contents } = await client.readResource({ uri });
    assert.ok(contents.some(content => content.uri === uri &&
      content.mimeType === "text/markdown" && typeof content.text === "string" &&
      content.text.trim().length > 0), `${uri} must return actual documentation`);
  }
  assert.ok(tools.every(tool => tool.description?.includes(statusUris[0])),
    "tool descriptions must point clients to provider verification status");

  console.log(JSON.stringify({
    result: "passed",
    scope: "MCP status discovery and resource readability; no provider calls",
    server: client.getServerVersion(),
    tools: tools.length,
    resources: resources.length,
    statusResources: statusUris,
  }, null, 2));
} catch (error) {
  console.error("MCP status discovery failed:", error.message);
  process.exitCode = 1;
} finally {
  try {
    if (transport.sessionId) await transport.terminateSession();
  } catch (error) {
    console.error("MCP test session cleanup failed:", error.message);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}
