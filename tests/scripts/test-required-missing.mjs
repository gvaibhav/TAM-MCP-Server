#!/usr/bin/env node

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
      console.log('\n=== TESTING: REQUIRED API KEY MISSING (FRED) ===\n');
      
      // Look for tools with unavailable status (❌)
      const unavailableTools = jsonResponse.result.tools.filter(tool => 
        tool.description.includes('❌')
      );
      
      // Look for tools with warnings (⚠️)
      const warningTools = jsonResponse.result.tools.filter(tool => 
        tool.description.includes('⚠️') && !tool.description.includes('❌')
      );
      
      console.log(`Total tools: ${jsonResponse.result.tools.length}`);
      console.log(`❌ Unavailable tools: ${unavailableTools.length}`);
      console.log(`⚠️ Tools with warnings: ${warningTools.length}\n`);
      
      if (unavailableTools.length > 0) {
        console.log('❌ UNAVAILABLE TOOLS (Missing Required APIs):');
        unavailableTools.forEach((tool, index) => {
          console.log(`\n${index + 1}. ${tool.name}`);
          const warningMatch = tool.description.match(/(❌).*$/);
          if (warningMatch) {
            console.log(`   ${warningMatch[0]}`);
          }
        });
      }
      
      if (warningTools.length > 0) {
        console.log('\n⚠️ TOOLS WITH WARNINGS (Optional APIs Missing):');
        warningTools.forEach((tool, index) => {
          console.log(`\n${index + 1}. ${tool.name}`);
          const warningMatch = tool.description.match(/(⚠️).*$/);
          if (warningMatch) {
            console.log(`   ${warningMatch[0]}`);
          }
        });
      }
      
      responseReceived = true;
      serverProcess.kill();
    }
  } catch (e) {
    // Not JSON, probably initialization log
  }
});

serverProcess.stderr.on('data', (data) => {
  const errorOutput = data.toString();
  // Look for API availability info in stderr
  if (errorOutput.includes('required APIs missing') || errorOutput.includes('❌') || errorOutput.includes('FRED')) {
    console.log('📊 API AVAILABILITY STATUS:');
    console.log(errorOutput);
  }
});

// Wait for server to initialize, then send request
setTimeout(() => {
  console.log('🧪 Testing with FRED API key commented out (required API missing)...\n');
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
  console.log(`\n✅ Test completed`);
  process.exit(0);
});
