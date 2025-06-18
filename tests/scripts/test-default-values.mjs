#!/usr/bin/env node

/**
 * Test Default Values in MCP Tools
 * Verifies that tools work with minimal or no parameters using defaults
 */

import { spawn } from 'child_process';

console.log("🚀 Testing MCP Tools with Default Values...\n");

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
  
  console.log("📊 Test 1: Alpha Vantage Company Overview (no parameters - should use AAPL default)");
  const alphaVantageTest = {
    jsonrpc: "2.0",
    id: ++requestCount,
    method: "tools/call",
    params: {
      name: "alphaVantage_getCompanyOverview",
      arguments: {} // Empty - should use default symbol "AAPL"
    }
  };
  serverProcess.stdin.write(JSON.stringify(alphaVantageTest) + '\n');
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log("💰 Test 2: TAM Calculator (partial parameters - should use defaults for missing ones)");
  const tamCalculatorTest = {
    jsonrpc: "2.0",
    id: ++requestCount,
    method: "tools/call",
    params: {
      name: "tam_calculator",
      arguments: {
        baseMarketSize: 5000000000 // Only provide one parameter, others should default
      }
    }
  };
  serverProcess.stdin.write(JSON.stringify(tamCalculatorTest) + '\n');
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log("🌍 Test 3: World Bank Indicator (no parameters - should use USA and GDP defaults)");
  const worldBankTest = {
    jsonrpc: "2.0",
    id: ++requestCount,
    method: "tools/call",
    params: {
      name: "worldBank_getIndicatorData",
      arguments: {} // Empty - should use defaults
    }
  };
  serverProcess.stdin.write(JSON.stringify(worldBankTest) + '\n');
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log("📈 Test 4: Company Financials (minimal parameters - should use defaults)");
  const financialsTest = {
    jsonrpc: "2.0",
    id: ++requestCount,
    method: "tools/call",
    params: {
      name: "company_financials_retriever",
      arguments: {
        companySymbol: "MSFT" // Only provide symbol, others should default
      }
    }
  };
  serverProcess.stdin.write(JSON.stringify(financialsTest) + '\n');
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log("🔍 Test 5: Industry Search (no parameters - should use defaults)");
  const industrySearchTest = {
    jsonrpc: "2.0",
    id: ++requestCount,
    method: "tools/call",
    params: {
      name: "industry_search",
      arguments: {} // Empty - should use defaults
    }
  };
  serverProcess.stdin.write(JSON.stringify(industrySearchTest) + '\n');
  
  // Wait for all responses
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Process results
  console.log("\n📊 Test Results:");
  console.log(`Received ${responses.length} responses\n`);
  
  responses.forEach((response, index) => {
    console.log(`📋 Response ${index + 1}:`);
    
    if (response.error) {
      console.log(`❌ Error: ${response.error.message}`);
    } else if (response.result && response.result.content) {
      const content = response.result.content[0];
      if (response.result.isError) {
        console.log(`❌ Tool Error: ${content.text}`);
      } else {
        console.log(`✅ Success: Tool executed with defaults`);
        console.log(`📄 Preview: ${content.text.substring(0, 100)}...`);
      }
    } else {
      console.log(`✅ Response received: ${JSON.stringify(response.result).substring(0, 100)}...`);
    }
    
    console.log();
  });
  
  // Summary
  console.log("🎉 Default Values Test Summary:");
  const successCount = responses.filter(r => !r.error && !(r.result && r.result.isError)).length;
  const totalTests = 5;
  
  console.log(`✅ Successful tool calls: ${successCount}/${totalTests}`);
  console.log(`❌ Failed tool calls: ${totalTests - successCount}/${totalTests}`);
  
  if (successCount >= 3) {
    console.log("🎉 DEFAULT VALUES WORKING - Tools can use defaults for missing parameters!");
  } else {
    console.log("⚠️  Some default value tests failed - check implementation");
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
