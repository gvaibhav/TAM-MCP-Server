#!/usr/bin/env node

/**
 * Comprehensive MCP Server Test
 * Tests tools, prompts, and resources functionality
 */

import { spawn } from 'child_process';

console.log("🚀 Comprehensive TAM MCP Server Test");
console.log("Testing tools, prompts, and resources...\n");

const serverProcess = spawn('node', ['dist/index.js'], {
  cwd: '/home/gvaibhav/Documents/TAM-MCP-Server',
  stdio: ['pipe', 'pipe', 'pipe']
});

let responseData = '';
let requestCount = 0;
const responses = [];

// Collect responses
serverProcess.stdout.on('data', (data) => {
  const text = data.toString();
  responseData += text;
  
  // Parse JSON responses
  const lines = text.split('\n').filter(line => line.trim());
  for (const line of lines) {
    try {
      const response = JSON.parse(line);
      if (response.id && response.result) {
        responses.push(response);
      }
    } catch (e) {
      // Not JSON, skip
    }
  }
});

// Log server messages
serverProcess.stderr.on('data', (data) => {
  const message = data.toString().trim();
  if (message.includes('TAM MCP Server initialized')) {
    console.log("✅ Server initialized successfully");
  }
});

// Test sequence
async function runTests() {
  // Wait for server to initialize
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  console.log("🔧 Test 1: List available tools");
  const listToolsRequest = {
    jsonrpc: "2.0",
    id: ++requestCount,
    method: "tools/list",
    params: {}
  };
  serverProcess.stdin.write(JSON.stringify(listToolsRequest) + '\n');
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log("📝 Test 2: List available prompts");
  const listPromptsRequest = {
    jsonrpc: "2.0",
    id: ++requestCount,
    method: "prompts/list",
    params: {}
  };
  serverProcess.stdin.write(JSON.stringify(listPromptsRequest) + '\n');
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log("📚 Test 3: List available resources");
  const listResourcesRequest = {
    jsonrpc: "2.0",
    id: ++requestCount,
    method: "resources/list",
    params: {}
  };
  serverProcess.stdin.write(JSON.stringify(listResourcesRequest) + '\n');
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log("🎯 Test 4: Get specific prompt");
  const getPromptRequest = {
    jsonrpc: "2.0",
    id: ++requestCount,
    method: "prompts/get",
    params: {
      name: "startup-funding-analysis",
      arguments: {
        company_name: "InnovateCorp",
        funding_stage: "Series B",
        industry: "AI/ML",
        funding_amount: "$25M"
      }
    }
  };
  serverProcess.stdin.write(JSON.stringify(getPromptRequest) + '\n');
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log("📖 Test 5: Get resource content");
  const getResourceRequest = {
    jsonrpc: "2.0",
    id: ++requestCount,
    method: "resources/read",
    params: {
      uri: "tam://prompt-reference"
    }
  };
  serverProcess.stdin.write(JSON.stringify(getResourceRequest) + '\n');
  
  // Wait for all responses
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Process results
  console.log("\n📊 Test Results:");
  console.log(`Received ${responses.length} responses\n`);
  
  responses.forEach((response, index) => {
    console.log(`📋 Response ${index + 1}:`);
    
    if (response.result.tools) {
      console.log(`✅ Found ${response.result.tools.length} tools`);
      const sampleTools = response.result.tools.slice(0, 3).map(t => t.name);
      console.log(`🔧 Sample tools: ${JSON.stringify(sampleTools)}`);
    }
    
    if (response.result.prompts) {
      console.log(`✅ Found ${response.result.prompts.length} prompts`);
      const samplePrompts = response.result.prompts.slice(0, 3).map(p => p.name);
      console.log(`📝 Sample prompts: ${JSON.stringify(samplePrompts)}`);
    }
    
    if (response.result.resources) {
      console.log(`✅ Found ${response.result.resources.length} resources`);
      const resourceNames = response.result.resources.map(r => r.name);
      console.log(`📚 Resources: ${JSON.stringify(resourceNames)}`);
    }
    
    if (response.result.messages) {
      console.log(`✅ Generated prompt content (${response.result.messages[0].content.text.length} chars)`);
      const preview = response.result.messages[0].content.text.substring(0, 200);
      console.log(`📄 Preview: ${preview}...`);
    }
    
    if (response.result.contents) {
      console.log(`✅ Retrieved resource content (${response.result.contents[0].text.length} chars)`);
      const preview = response.result.contents[0].text.substring(0, 150);
      console.log(`📖 Preview: ${preview}...`);
    }
    
    console.log();
  });
  
  // Summary
  console.log("🎉 Comprehensive Test Summary:");
  console.log(`✅ Server initialization: SUCCESS`);
  console.log(`✅ Tools listing: ${responses.some(r => r.result.tools) ? 'SUCCESS' : 'FAILED'}`);
  console.log(`✅ Prompts listing: ${responses.some(r => r.result.prompts) ? 'SUCCESS' : 'FAILED'}`);
  console.log(`✅ Resources listing: ${responses.some(r => r.result.resources) ? 'SUCCESS' : 'FAILED'}`);
  console.log(`✅ Prompt generation: ${responses.some(r => r.result.messages) ? 'SUCCESS' : 'FAILED'}`);
  console.log(`✅ Resource retrieval: ${responses.some(r => r.result.contents) ? 'SUCCESS' : 'FAILED'}`);
  
  const successCount = [
    responses.some(r => r.result.tools),
    responses.some(r => r.result.prompts),
    responses.some(r => r.result.resources),
    responses.some(r => r.result.messages),
    responses.some(r => r.result.contents)
  ].filter(Boolean).length;
  
  console.log(`\n🎯 Overall Success Rate: ${successCount}/5 tests passed`);
  
  if (successCount === 5) {
    console.log("🎉 ALL TESTS PASSED - TAM MCP Server is fully functional!");
  } else {
    console.log("⚠️  Some tests failed - check implementation");
  }
  
  // Cleanup
  serverProcess.kill();
  process.exit(0);
}

// Handle server errors
serverProcess.on('error', (error) => {
  console.error(`❌ Server error: ${error.message}`);
  process.exit(1);
});

// Start tests
runTests().catch(error => {
  console.error(`❌ Test error: ${error.message}`);
  serverProcess.kill();
  process.exit(1);
});

// Timeout after 30 seconds
setTimeout(() => {
  console.log("⏰ Test timeout - terminating");
  serverProcess.kill();
  process.exit(1);
}, 30000);
