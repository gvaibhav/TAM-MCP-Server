#!/usr/bin/env node
// filepath: /home/gvaibhav/Documents/TAM-MCP-Server/test-notifications.js

/**
 * Test script for TAM MCP Server notifications functionality
 * Tests both SSE and HTTP Streamable transports with notification support
 */

import http from 'http';
import { randomUUID } from 'crypto';

// Test configurations
const HTTP_PORT = 3002;
const SSE_PORT = 3001;

// Sample test request for market size calculation
const testRequest = {
  jsonrpc: "2.0",
  id: randomUUID(),
  method: "tools/call",
  params: {
    name: "market_size",
    arguments: {
      industry: "Software as a Service (SaaS)",
      region: "North America",
      year: "2024"
    }
  }
};

/**
 * Test HTTP Streamable transport with notifications
 */
async function testHTTPTransport() {
  console.log('\n🧪 Testing HTTP Streamable Transport with Notifications...');
  
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(testRequest);
    
    const options = {
      hostname: 'localhost',
      port: HTTP_PORT,
      path: '/mcp',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      console.log(`📡 HTTP Response Status: ${res.statusCode}`);
      console.log(`📡 HTTP Response Headers:`, res.headers);
      
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
        console.log('📥 HTTP Data chunk received:', chunk.toString());
      });
      
      res.on('end', () => {
        console.log('✅ HTTP Response completed');
        try {
          // Parse potential JSON responses
          const lines = responseData.trim().split('\n');
          lines.forEach((line, index) => {
            if (line.trim()) {
              try {
                const parsed = JSON.parse(line);
                console.log(`📋 HTTP Message ${index + 1}:`, JSON.stringify(parsed, null, 2));
                
                // Check for notifications
                if (parsed.method && parsed.method.startsWith('notifications/')) {
                  console.log(`🔔 Notification detected: ${parsed.method}`);
                  console.log(`📄 Notification params:`, JSON.stringify(parsed.params, null, 2));
                }
              } catch (e) {
                console.log(`📝 HTTP Raw message ${index + 1}:`, line);
              }
            }
          });
          resolve();
        } catch (error) {
          console.log('📝 HTTP Raw response:', responseData);
          resolve();
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ HTTP Request error:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Test SSE transport with notifications
 */
async function testSSETransport() {
  console.log('\n🧪 Testing SSE Transport with Notifications...');
  
  return new Promise((resolve, reject) => {
    // First, establish SSE connection
    const sseOptions = {
      hostname: 'localhost',
      port: SSE_PORT,
      path: '/sse',
      method: 'GET',
      headers: {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache'
      }
    };

    const sseReq = http.request(sseOptions, (sseRes) => {
      console.log(`📡 SSE Connection Status: ${sseRes.statusCode}`);
      console.log(`📡 SSE Response Headers:`, sseRes.headers);
      
      let sessionId = null;
      let messageBuffer = '';
      
      sseRes.on('data', (chunk) => {
        messageBuffer += chunk.toString();
        console.log('📥 SSE Data chunk:', chunk.toString());
        
        // Parse SSE messages
        const lines = messageBuffer.split('\n');
        messageBuffer = lines.pop() || ''; // Keep incomplete line
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              console.log('📋 SSE Message:', JSON.stringify(data, null, 2));
              
              // Extract session ID from initialization
              if (data.result && data.result.protocolVersion) {
                // This is the initialization response, we can now send requests
                setTimeout(() => {
                  sendSSEMessage();
                }, 1000);
              }
              
              // Check for notifications
              if (data.method && data.method.startsWith('notifications/')) {
                console.log(`🔔 SSE Notification detected: ${data.method}`);
                console.log(`📄 SSE Notification params:`, JSON.stringify(data.params, null, 2));
              }
            } catch (e) {
              console.log('📝 SSE Raw message:', line);
            }
          }
        }
      });

      // Send a test request via SSE after connection is established
      function sendSSEMessage() {
        console.log('\n📤 Sending test request via SSE...');
        
        const messageOptions = {
          hostname: 'localhost',
          port: SSE_PORT,
          path: '/message',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        };

        const messageReq = http.request(messageOptions, (messageRes) => {
          console.log(`📡 SSE Message Response Status: ${messageRes.statusCode}`);
          
          let responseData = '';
          messageRes.on('data', (chunk) => {
            responseData += chunk;
          });
          
          messageRes.on('end', () => {
            console.log('✅ SSE Message sent successfully');
            // Give some time for notifications to come through
            setTimeout(() => {
              resolve();
            }, 3000);
          });
        });

        messageReq.on('error', (error) => {
          console.error('❌ SSE Message error:', error.message);
          reject(error);
        });

        messageReq.write(JSON.stringify(testRequest));
        messageReq.end();
      }
      
      setTimeout(() => {
        console.log('⏰ SSE test timeout, resolving...');
        resolve();
      }, 10000);
    });

    sseReq.on('error', (error) => {
      console.error('❌ SSE Connection error:', error.message);
      reject(error);
    });

    sseReq.end();
  });
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🚀 Starting TAM MCP Server Notifications Tests...');
  console.log('📋 Test Request:', JSON.stringify(testRequest, null, 2));
  
  try {
    // Test HTTP transport
    await testHTTPTransport();
    
    // Wait a bit between tests
    console.log('\n⏸️ Waiting between tests...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test SSE transport
    await testSSETransport();
    
    console.log('\n✅ All notification tests completed!');
    console.log('\n📊 Summary:');
    console.log('   - HTTP Streamable transport: Tested');
    console.log('   - SSE transport: Tested');
    console.log('   - Notifications: Should be visible in output above');
    console.log('\n💡 Look for 🔔 notification messages in the output');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests
runTests();
