#!/usr/bin/env node

/**
 * HTTP Streaming MCP Test Script
 * Tests the HTTP streaming MCP interface with all tools using API keys
 */

import fetch from 'node-fetch';

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

const SERVER_URL = 'http://localhost:3000';
let sessionId = null;

/**
 * Send MCP JSON-RPC request via HTTP
 */
async function sendMCPRequest(method, params = {}, id = Date.now()) {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream',
  };
  
  if (sessionId) {
    headers['mcp-session-id'] = sessionId;
  }

  const request = {
    jsonrpc: '2.0',
    id,
    method,
    params
  };

  try {
    const response = await fetch(`${SERVER_URL}/mcp`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Extract session ID from response headers
    if (!sessionId && response.headers.get('mcp-session-id')) {
      sessionId = response.headers.get('mcp-session-id');
      logInfo(`Session ID received: ${sessionId}`);
    }

    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('text/event-stream')) {
      // Handle SSE response
      const text = await response.text();
      logInfo('Received SSE response');
      
      // Parse SSE data
      const lines = text.trim().split('\n');
      let eventData = '';
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          eventData += line.substring(6);
        }
      }
      
      if (eventData) {
        try {
          return JSON.parse(eventData);
        } catch (e) {
          logInfo(`Raw SSE data: ${eventData}`);
          return { success: true, data: eventData };
        }
      }
      
      return { success: true, sse: true };
    } else {
      // Handle JSON response
      const result = await response.json();
      return result;
    }
  } catch (error) {
    throw new Error(`Request failed: ${error.message}`);
  }
}

/**
 * Test HTTP streaming MCP functionality
 */
async function testHTTPStreamingMCP() {
  logSection("HTTP Streaming MCP Test");
  logInfo(`Testing HTTP MCP interface at ${SERVER_URL}...`);

  const results = [];

  try {
    // Test 1: Initialize connection
    logInfo("Testing: Initialize Connection");
    const initResponse = await sendMCPRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: { tools: {} },
      clientInfo: { name: 'http-test-client', version: '1.0.0' }
    });

    if (initResponse.result) {
      logSuccess("Initialize Connection: Success");
      results.push({ name: 'Initialize Connection', success: true });
    } else {
      logError("Initialize Connection: Failed");
      results.push({ name: 'Initialize Connection', success: false, error: 'No result in response' });
    }

    // Test 2: List Tools
    logInfo("Testing: List Tools");
    const toolsResponse = await sendMCPRequest('tools/list');

    if (toolsResponse.result && toolsResponse.result.tools) {
      logSuccess(`List Tools: Success (${toolsResponse.result.tools.length} tools found)`);
      results.push({ name: 'List Tools', success: true, data: { toolCount: toolsResponse.result.tools.length } });
      
      // Log available tools
      toolsResponse.result.tools.forEach(tool => {
        logInfo(`  - ${tool.name}: ${tool.description}`);
      });
    } else {
      logError("List Tools: Failed");
      results.push({ name: 'List Tools', success: false, error: 'No tools in response' });
    }

    // Test 3: List Resources
    logInfo("Testing: List Resources");
    const resourcesResponse = await sendMCPRequest('resources/list');

    if (resourcesResponse.result) {
      logSuccess(`List Resources: Success (${resourcesResponse.result.resources?.length || 0} resources found)`);
      results.push({ name: 'List Resources', success: true, data: { resourceCount: resourcesResponse.result.resources?.length || 0 } });
    } else {
      logError("List Resources: Failed");
      results.push({ name: 'List Resources', success: false, error: 'No result in response' });
    }

    // Test 4: Tool calls with API keys
    const toolTests = [
      {
        name: "Industry Search",
        method: "tools/call",
        params: {
          name: "industry_search",
          arguments: {
            query: "fintech",
            limit: 3,
            includeSubIndustries: true
          }
        }
      },
      {
        name: "Industry Data with Real APIs",
        method: "tools/call",
        params: {
          name: "industry_data",
          arguments: {
            industryId: "tech-software",
            includeMetrics: true,
            region: "US"
          }
        }
      },
      {
        name: "Market Size Analysis",
        method: "tools/call",
        params: {
          name: "market_size",
          arguments: {
            industryId: "tech-software",
            region: "US",
            currency: "USD",
            year: 2024
          }
        }
      },
      {
        name: "TAM Calculator",
        method: "tools/call",
        params: {
          name: "tam_calculator",
          arguments: {
            industryId: "tech-software",
            region: "US",
            population: 5000000,
            penetrationRate: 0.15,
            averageSpending: 2000,
            includeScenarios: true
          }
        }
      },
      {
        name: "SAM Calculator (Fixed)",
        method: "tools/call",
        params: {
          name: "sam_calculator",
          arguments: {
            tamValue: 2000000000,
            targetMarketShare: 0.08,
            targetSegments: ["enterprise", "smb", "startup"],
            geographicConstraints: ["north-america", "europe"],
            competitiveFactors: ["high-competition", "network-effects"],
            timeframe: "3-5 years"
          }
        }
      },
      {
        name: "Market Segments Analysis",
        method: "tools/call",
        params: {
          name: "market_segments",
          arguments: {
            industryId: "tech-software",
            segmentationType: "demographic",
            region: "US",
            minSegmentSize: 100000000
          }
        }
      },
      {
        name: "Market Forecasting",
        method: "tools/call",
        params: {
          name: "market_forecasting",
          arguments: {
            industryId: "tech-software",
            years: 5,
            region: "US",
            includeScenarios: true,
            factors: ["AI adoption", "cloud migration", "digital transformation"]
          }
        }
      },
      {
        name: "Market Comparison",
        method: "tools/call",
        params: {
          name: "market_comparison",
          arguments: {
            industryIds: ["tech-software", "tech-ai", "fintech"],
            region: "US"
          }
        }
      },
      {
        name: "Data Validation",
        method: "tools/call",
        params: {
          name: "data_validation",
          arguments: {
            dataType: "market-size",
            data: {
              value: 1500000000000,
              year: 2024,
              source: "industry-report",
              confidenceScore: 0.85
            },
            strictMode: true
          }
        }
      },
      {
        name: "Market Opportunities (Fixed)",
        method: "tools/call",
        params: {
          name: "market_opportunities",
          arguments: {
            industryId: "tech-software",
            region: "US",
            minMarketSize: 500000000,
            maxCompetition: "medium",
            timeframe: "2-5 years"
          }
        }
      },
      {
        name: "Generic Data Query - World Bank",
        method: "tools/call",
        params: {
          name: "generic_data_query",
          arguments: {
            dataSourceName: "WorldBankService",
            dataSourceMethod: "fetchMarketSize",
            dataSourceParams: ["US", "NY.GDP.MKTP.CD"]
          }
        }
      }
    ];

    // Execute tool tests
    for (const test of toolTests) {
      try {
        logInfo(`Testing: ${test.name}`);
        
        const response = await sendMCPRequest(test.method, test.params);
        
        if (response.result && response.result.content) {
          logSuccess(`${test.name}: Success`);
          results.push({ name: test.name, success: true });
          
          // Log brief result info
          if (response.result.content[0]?.text) {
            const resultText = response.result.content[0].text;
            try {
              const parsedResult = JSON.parse(resultText);
              if (parsedResult.query) {
                logInfo(`  Query: ${parsedResult.query}`);
              }
              if (parsedResult.totalResults) {
                logInfo(`  Results: ${parsedResult.totalResults}`);
              }
              if (parsedResult.totalAddressableMarket) {
                logInfo(`  TAM: $${(parsedResult.totalAddressableMarket / 1000000000).toFixed(2)}B`);
              }
              if (parsedResult.serviceableAddressableMarket) {
                logInfo(`  SAM: $${(parsedResult.serviceableAddressableMarket / 1000000000).toFixed(2)}B`);
              }
            } catch (e) {
              // Non-JSON response, just log first 100 chars
              logInfo(`  Result: ${resultText.substring(0, 100)}...`);
            }
          }
        } else if (response.error) {
          logError(`${test.name}: ${response.error.message}`);
          results.push({ name: test.name, success: false, error: response.error.message });
        } else {
          logError(`${test.name}: No result content`);
          results.push({ name: test.name, success: false, error: 'No result content' });
        }
        
        // Brief pause between tests
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        logError(`${test.name}: ${error.message}`);
        results.push({ name: test.name, success: false, error: error.message });
      }
    }

  } catch (error) {
    logError(`Fatal error: ${error.message}`);
    return { success: false, error: error.message };
  }

  // Summary
  logSection("HTTP Streaming MCP Test Results");
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
    logSuccess("🎉 HTTP Streaming MCP VERIFIED!");
  } else {
    logError(`Success Rate: ${successRate}%`);
    logError("❌ HTTP Streaming MCP needs attention");
  }

  return { 
    totalTests, 
    successfulTests, 
    successRate: parseFloat(successRate), 
    results,
    sessionId 
  };
}

// Execute tests
if (import.meta.url === `file://${process.argv[1]}`) {
  testHTTPStreamingMCP()
    .then((report) => {
      if (report.success !== false) {
        process.exit(report.successRate >= 90 ? 0 : 1);
      } else {
        process.exit(1);
      }
    })
    .catch((error) => {
      logError(`Fatal error: ${error.message}`);
      process.exit(1);
    });
}

export { testHTTPStreamingMCP };
