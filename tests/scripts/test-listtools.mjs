#!/usr/bin/env node

import { readFileSync } from 'fs';
import { spawn } from 'child_process';

// Start the server process
const serverProcess = spawn('node', ['dist/index.js'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  cwd: process.cwd()
});

let responseReceived = false;

// Send ListTools request
const listToolsRequest = {
  jsonrpc: "2.0",
  id: 1,
  method: "tools/list"
};

// Handle server output
serverProcess.stdout.on('data', (data) => {
  const response = data.toString();
  console.log('Server response:', response);
  
  try {
    const jsonResponse = JSON.parse(response);
    if (jsonResponse.id === 1 && jsonResponse.result) {
      console.log('\n=== TOOLS WITH AVAILABILITY STATUS ===\n');
      
      jsonResponse.result.tools.forEach((tool, index) => {
        console.log(`${index + 1}. ${tool.name}`);
        console.log(`   Description: ${tool.description}`);
        console.log('');
      });
      
      responseReceived = true;
      serverProcess.kill();
    }
  } catch (e) {
    // Not JSON, probably initialization log
  }
});

serverProcess.stderr.on('data', (data) => {
  console.error('Server error:', data.toString());
});

// Wait for server to initialize, then send request
setTimeout(() => {
  console.log('Sending ListTools request...\n');
  serverProcess.stdin.write(JSON.stringify(listToolsRequest) + '\n');
}, 1000);

// Cleanup after 10 seconds
setTimeout(() => {
  if (!responseReceived) {
    console.log('Timeout - killing server process');
    serverProcess.kill();
  }
}, 10000);

serverProcess.on('close', (code) => {
  console.log(`\nServer process exited with code ${code}`);
  process.exit(0);
});
