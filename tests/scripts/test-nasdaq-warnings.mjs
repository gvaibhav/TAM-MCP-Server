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
      console.log('\n=== TESTING: NASDAQ-SPECIFIC TOOLS ===\n');
      
      // Look for nasdaq-related tools specifically
      const nasdaqTools = jsonResponse.result.tools.filter(tool => 
        tool.name.toLowerCase().includes('nasdaq')
      );
      
      console.log(`Total tools: ${jsonResponse.result.tools.length}`);
      console.log(`Nasdaq-related tools found: ${nasdaqTools.length}\n`);
      
      if (nasdaqTools.length > 0) {
        console.log('📊 NASDAQ TOOLS STATUS:');
        nasdaqTools.forEach((tool, index) => {
          console.log(`\n${index + 1}. ${tool.name}`);
          console.log(`   Status: ${tool.description.includes('❌') ? '❌ UNAVAILABLE' : tool.description.includes('⚠️') ? '⚠️ WARNING' : '✅ AVAILABLE'}`);
          
          // Show warning/error message if present
          const warningMatch = tool.description.match(/(❌|⚠️).*$/);
          if (warningMatch) {
            console.log(`   Message: ${warningMatch[0]}`);
          }
        });
      } else {
        console.log('ℹ️ No Nasdaq-specific tools found in the tool list');
        
        // Let's also check tools that mention "financial" or "dataset"
        const relatedTools = jsonResponse.result.tools.filter(tool => 
          tool.name.toLowerCase().includes('financial') || 
          tool.name.toLowerCase().includes('dataset') ||
          tool.description.toLowerCase().includes('nasdaq')
        );
        
        if (relatedTools.length > 0) {
          console.log('\n📋 RELATED FINANCIAL/DATASET TOOLS:');
          relatedTools.forEach((tool, index) => {
            console.log(`${index + 1}. ${tool.name}`);
            const warningMatch = tool.description.match(/(❌|⚠️).*$/);
            if (warningMatch) {
              console.log(`   ${warningMatch[0]}`);
            }
          });
        }
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
  if (errorOutput.includes('Nasdaq') || errorOutput.includes('NASDAQ')) {
    console.log('📊 NASDAQ API STATUS:');
    console.log(errorOutput);
  }
});

// Wait for server to initialize, then send request
setTimeout(() => {
  console.log('🔍 Looking for Nasdaq tools and their availability status...\n');
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
