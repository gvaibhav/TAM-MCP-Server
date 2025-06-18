#!/usr/bin/env node

/**
 * MCP Prompts Test Script
 * Test prompts/list and prompts/get functionality
 */

import { spawn } from 'child_process';

console.log("🚀 Testing MCP Prompts Interface...");

const serverProcess = spawn('node', ['dist/index.js'], {
  cwd: '/home/gvaibhav/Documents/TAM-MCP-Server',
  stdio: ['pipe', 'pipe', 'pipe']
});

let responseData = '';
let requestCount = 0;

// Collect responses
serverProcess.stdout.on('data', (data) => {
  responseData += data.toString();
});

// Log server errors
serverProcess.stderr.on('data', (data) => {
  console.log(`📋 Server log:`, data.toString().trim());
});

// Test sequence
async function runTests() {
  console.log("\n🔍 Test 1: List available prompts");
  
  const listPromptsRequest = {
    jsonrpc: "2.0",
    id: ++requestCount,
    method: "prompts/list",
    params: {}
  };
  
  serverProcess.stdin.write(JSON.stringify(listPromptsRequest) + '\n');
  
  // Wait for response
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log("\n🔍 Test 2: Get startup funding pitch prompt");
  
  const getPromptRequest = {
    jsonrpc: "2.0",
    id: ++requestCount,
    method: "prompts/get",
    params: {
      name: "startup_funding_pitch",
      arguments: {
        company_name: "TechCorp",
        industry_sector: "fintech",
        funding_stage: "series-a",
        target_amount: "10000000",
        geographic_focus: "North America"
      }
    }
  };
  
  serverProcess.stdin.write(JSON.stringify(getPromptRequest) + '\n');
  
  // Wait for response
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log("\n🔍 Test 3: Get crisis management prompt");
  
  const crisisPromptRequest = {
    jsonrpc: "2.0",
    id: ++requestCount,
    method: "prompts/get",
    params: {
      name: "crisis_management_analysis",
      arguments: {
        crisis_type: "supply-chain-disruption",
        affected_industry: "semiconductor",
        response_timeline: "immediate"
      }
    }
  };
  
  serverProcess.stdin.write(JSON.stringify(crisisPromptRequest) + '\n');
  
  // Wait for final response
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Parse and display responses
  const responses = responseData.trim().split('\n').filter(line => line.trim());
  
  console.log(`\n📊 Received ${responses.length} responses:\n`);
  
  responses.forEach((response, index) => {
    try {
      const parsed = JSON.parse(response);
      console.log(`📝 Response ${index + 1}:`);
      
      if (parsed.result && parsed.result.prompts) {
        console.log(`✅ Found ${parsed.result.prompts.length} prompts available`);
        console.log("🎯 Sample prompts:", parsed.result.prompts.slice(0, 3).map(p => p.name));
      } else if (parsed.result && parsed.result.messages) {
        console.log("✅ Prompt content generated successfully");
        console.log("📄 Prompt preview:", parsed.result.messages[0].content.text.substring(0, 200) + "...");
      } else {
        console.log("📋 Response:", JSON.stringify(parsed, null, 2));
      }
    } catch (error) {
      console.log(`❌ Parse error:`, error.message);
      console.log(`📄 Raw response:`, response);
    }
    console.log("");
  });
  
  serverProcess.kill();
  console.log("✅ MCP Prompts test completed!");
}

// Handle process exit
serverProcess.on('close', (code) => {
  if (code !== 0) {
    console.log(`❌ Server exited with code ${code}`);
  }
});

// Start tests
runTests().catch(console.error);
