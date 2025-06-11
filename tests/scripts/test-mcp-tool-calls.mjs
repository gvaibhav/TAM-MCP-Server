#!/usr/bin/env node

/**
 * MCP Tool Call Verification Script
 * Tests individual tool calls through the MCP interface to verify JSON-RPC responses
 */

import { spawn } from 'child_process';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

// Test colors for better output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.error(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function logSection(message) {
  log(`\n${colors.bold}=== ${message} ===${colors.reset}`, colors.blue);
}

/**
 * Send a JSON-RPC request to the MCP server and get response
 */
async function sendMCPRequest(request) {
  return new Promise((resolve, reject) => {
    const serverProcess = spawn('node', ['dist/stdio-simple.js'], {
      cwd: '/home/gvaibhav/Documents/TAM-MCP-Server',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let responseData = '';
    let errorData = '';

    // Handle stdout (JSON-RPC responses)
    serverProcess.stdout.on('data', (data) => {
      responseData += data.toString();
    });

    // Handle stderr (debug logs - should not affect JSON-RPC)
    serverProcess.stderr.on('data', (data) => {
      errorData += data.toString();
    });

    // Handle process completion
    serverProcess.on('close', (code) => {
      try {
        // Parse JSON-RPC responses (multiple lines possible)
        const responses = responseData.trim().split('\n').filter(line => line.trim());
        const parsedResponses = responses.map(line => JSON.parse(line));
        resolve({ responses: parsedResponses, stderr: errorData, exitCode: code });
      } catch (error) {
        reject({ error: error.message, stdout: responseData, stderr: errorData, exitCode: code });
      }
    });

    serverProcess.on('error', (error) => {
      reject({ error: error.message, stderr: errorData });
    });

    // Send the request
    serverProcess.stdin.write(JSON.stringify(request) + '\n');
    serverProcess.stdin.end();
  });
}

/**
 * Test MCP tool calls
 */
async function testMCPToolCalls() {
  logSection("MCP Tool Call Verification");
  logInfo("Testing tool calls through JSON-RPC interface...");

  const testCases = [
    {
      name: "Initialize Connection",
      request: {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: {}
          },
          clientInfo: {
            name: "test-client",
            version: "1.0.0"
          }
        }
      }
    },
    {
      name: "List Tools",
      request: {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list",
        params: {}
      }
    },
    {
      name: "Industry Search Tool",
      request: {
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: {
          name: "industry_search",
          arguments: {
            query: "software",
            limit: 3
          }
        }
      }
    },
    {
      name: "TAM Calculator Tool",
      request: {
        jsonrpc: "2.0",
        id: 4,
        method: "tools/call",
        params: {
          name: "tam_calculator",
          arguments: {
            industryId: "tech-software",
            region: "US",
            includeScenarios: true
          }
        }
      }
    },
    {
      name: "SAM Calculator Tool (Previously Failing)",
      request: {
        jsonrpc: "2.0",
        id: 5,
        method: "tools/call",
        params: {
          name: "sam_calculator",
          arguments: {
            tamValue: 1000000000,
            targetMarketShare: 0.05,
            targetSegments: ["enterprise", "smb"],
            geographicConstraints: ["north-america"]
          }
        }
      }
    }
  ];

  const results = [];

  for (const testCase of testCases) {
    try {
      logInfo(`Testing: ${testCase.name}`);
      
      const result = await sendMCPRequest(testCase.request);
      
      if (result.responses && result.responses.length > 0) {
        const lastResponse = result.responses[result.responses.length - 1];
        
        // Check for valid JSON-RPC response structure
        if (lastResponse.jsonrpc === "2.0" && lastResponse.id === testCase.request.id) {
          if (lastResponse.error) {
            logError(`${testCase.name}: ${lastResponse.error.message}`);
            results.push({ name: testCase.name, success: false, error: lastResponse.error.message });
          } else {
            logSuccess(`${testCase.name}: Valid JSON-RPC response`);
            results.push({ name: testCase.name, success: true, response: lastResponse.result });
          }
        } else {
          logError(`${testCase.name}: Invalid JSON-RPC response format`);
          results.push({ name: testCase.name, success: false, error: "Invalid response format" });
        }
      } else {
        logError(`${testCase.name}: No response received`);
        results.push({ name: testCase.name, success: false, error: "No response" });
      }
      
    } catch (error) {
      logError(`${testCase.name}: ${error.error || error.message}`);
      results.push({ name: testCase.name, success: false, error: error.error || error.message });
    }
    
    // Brief pause between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Summary
  logSection("MCP Tool Call Test Results");
  const successfulTests = results.filter(r => r.success).length;
  const totalTests = results.length;
  
  log(`\nTotal Tests: ${totalTests}`);
  logSuccess(`Successful: ${successfulTests}`);
  if (totalTests - successfulTests > 0) {
    logError(`Failed: ${totalTests - successfulTests}`);
  }
  
  const successRate = ((successfulTests / totalTests) * 100).toFixed(1);
  if (successRate >= 90) {
    logSuccess(`Success Rate: ${successRate}%`);
    logSuccess("🎉 MCP Tool Call Integration VERIFIED!");
  } else {
    logError(`Success Rate: ${successRate}%`);
    logError("❌ MCP Tool Call Integration needs attention");
  }

  return { totalTests, successfulTests, successRate: parseFloat(successRate), results };
}

// Execute tests
if (import.meta.url === `file://${process.argv[1]}`) {
  testMCPToolCalls()
    .then((report) => {
      process.exit(report.successRate >= 90 ? 0 : 1);
    })
    .catch((error) => {
      logError(`Fatal error: ${error.message}`);
      process.exit(1);
    });
}

export { testMCPToolCalls };
