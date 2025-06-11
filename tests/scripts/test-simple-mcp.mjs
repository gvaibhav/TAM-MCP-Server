#!/usr/bin/env node

/**
 * Simple MCP Tool Test
 * Test a single tool call to verify JSON-RPC interface
 */

import { spawn } from 'child_process';

console.error("🔧 Testing MCP Tool Call Interface...");

const serverProcess = spawn('node', ['dist/stdio-simple.js'], {
  cwd: '/home/gvaibhav/Documents/TAM-MCP-Server',
  stdio: ['pipe', 'pipe', 'pipe']
});

let responseData = '';
let responseCount = 0;

// Collect responses
serverProcess.stdout.on('data', (data) => {
  responseData += data.toString();
  console.error(`📥 Response ${++responseCount}:`, data.toString().trim());
});

// Log errors (should be empty due to our STDIO fix)
serverProcess.stderr.on('data', (data) => {
  console.error(`🔍 Server log:`, data.toString().trim());
});

// Handle completion
serverProcess.on('close', (code) => {
  console.error(`\n✅ Server process completed with code: ${code}`);
  
  // Try to parse responses
  try {
    const responses = responseData.trim().split('\n').filter(line => line.trim());
    console.error(`📊 Total responses received: ${responses.length}`);
    
    responses.forEach((response, index) => {
      try {
        const parsed = JSON.parse(response);
        console.error(`✅ Response ${index + 1}: Valid JSON-RPC`, {
          id: parsed.id,
          method: parsed.method,
          hasResult: !!parsed.result,
          hasError: !!parsed.error
        });
      } catch (parseError) {
        console.error(`❌ Response ${index + 1}: Invalid JSON`, parseError.message);
      }
    });
    
  } catch (error) {
    console.error(`❌ Error processing responses:`, error.message);
  }
  
  process.exit(0);
});

// Send initialize request
const initRequest = {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: { tools: {} },
    clientInfo: { name: "test-client", version: "1.0.0" }
  }
};

console.error("📤 Sending initialize request...");
serverProcess.stdin.write(JSON.stringify(initRequest) + '\n');

// Send tool list request
setTimeout(() => {
  const toolsRequest = {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list",
    params: {}
  };
  
  console.error("📤 Sending tools/list request...");
  serverProcess.stdin.write(JSON.stringify(toolsRequest) + '\n');
}, 100);

// Send a simple tool call
setTimeout(() => {
  const toolCallRequest = {
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "industry_search",
      arguments: {
        query: "software",
        limit: 2
      }
    }
  };
  
  console.error("📤 Sending industry_search tool call...");
  serverProcess.stdin.write(JSON.stringify(toolCallRequest) + '\n');
}, 200);

// End the process
setTimeout(() => {
  console.error("🔚 Ending input stream...");
  serverProcess.stdin.end();
}, 500);
