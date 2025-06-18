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
  
  try {
    const jsonResponse = JSON.parse(response);
    if (jsonResponse.id === 1 && jsonResponse.result) {
      console.log('\n=== TESTING: API AVAILABILITY WARNINGS ===\n');
      
      // Filter tools that have warnings or are unavailable
      const toolsWithWarnings = jsonResponse.result.tools.filter(tool => 
        tool.description.includes('❌') || tool.description.includes('⚠️')
      );
      
      console.log(`Total tools: ${jsonResponse.result.tools.length}`);
      console.log(`Tools with warnings/unavailable: ${toolsWithWarnings.length}\n`);
      
      if (toolsWithWarnings.length > 0) {
        console.log('🚨 TOOLS WITH WARNINGS OR UNAVAILABLE:');
        toolsWithWarnings.forEach((tool, index) => {
          console.log(`\n${index + 1}. ${tool.name}`);
          // Extract just the warning/unavailable part
          const warningMatch = tool.description.match(/(❌|⚠️).*$/);
          if (warningMatch) {
            console.log(`   ${warningMatch[0]}`);
          }
        });
      } else {
        console.log('✅ No warnings found - all required APIs are available');
      }
      
      responseReceived = true;
      serverProcess.kill();
    }
  } catch (e) {
    // Not JSON, probably initialization log - let's look for API availability logs
    if (response.includes('API Availability Check') || response.includes('APIs available')) {
      console.log('📊 SERVER STARTUP LOGS:');
      console.log(response);
    }
  }
});

serverProcess.stderr.on('data', (data) => {
  const errorOutput = data.toString();
  // Look for API availability info in stderr
  if (errorOutput.includes('API Availability Check') || errorOutput.includes('APIs available') || errorOutput.includes('❌') || errorOutput.includes('⚠️')) {
    console.log('📊 API AVAILABILITY STATUS:');
    console.log(errorOutput);
  }
});

// Wait for server to initialize, then send request
setTimeout(() => {
  console.log('🚀 Sending ListTools request...\n');
  serverProcess.stdin.write(JSON.stringify(listToolsRequest) + '\n');
}, 1500);

// Cleanup after 10 seconds
setTimeout(() => {
  if (!responseReceived) {
    console.log('⏰ Timeout - killing server process');
    serverProcess.kill();
  }
}, 10000);

serverProcess.on('close', (code) => {
  console.log(`\n✅ Test completed - Server process exited`);
  process.exit(0);
});
