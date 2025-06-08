#!/usr/bin/env node
// filepath: /home/gvaibhav/Documents/TAM-MCP-Server/test-simple-notification.js

/**
 * Simple test to verify notifications are working with SSE transport
 */

import http from 'http';
import { randomUUID } from 'crypto';

const SSE_PORT = 3001;

// MCP initialization request
const initRequest = {
  jsonrpc: "2.0",
  id: randomUUID(),
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: {
      roots: {
        listChanged: true
      },
      sampling: {}
    },
    clientInfo: {
      name: "test-client",
      version: "1.0.0"
    }
  }
};

// Tool call request
const toolRequest = {
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

console.log('🧪 Testing SSE Transport with Notifications...');

// Connect to SSE endpoint
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
  
  let sessionId = null;
  let messageBuffer = '';
  let initializationComplete = false;
  
  sseRes.on('data', (chunk) => {
    messageBuffer += chunk.toString();
    
    // Parse SSE messages
    const lines = messageBuffer.split('\n');
    messageBuffer = lines.pop() || ''; // Keep incomplete line
    
    for (const line of lines) {
      if (line.startsWith('event: endpoint')) {
        // Next line should contain the endpoint URL with session ID
        continue;
      }
      
      if (line.startsWith('data: ')) {
        const dataLine = line.substring(6);
        
        // Check if it's a session endpoint
        if (dataLine.startsWith('/message?sessionId=')) {
          sessionId = dataLine.split('sessionId=')[1];
          console.log(`🔑 Session ID extracted: ${sessionId}`);
          
          // Send initialization request
          setTimeout(() => {
            sendMessage(initRequest, sessionId);
          }, 100);
          continue;
        }
        
        // Try to parse JSON message
        try {
          const data = JSON.parse(dataLine);
          console.log('📋 SSE Message:', JSON.stringify(data, null, 2));
          
          // Check for initialization response
          if (data.result && data.result.protocolVersion && !initializationComplete) {
            console.log('✅ Initialization complete');
            initializationComplete = true;
            
            // Send tool request after initialization
            setTimeout(() => {
              console.log('\n📤 Sending tool request...');
              sendMessage(toolRequest, sessionId);
            }, 500);
          }
          
          // Check for notifications
          if (data.method && data.method.startsWith('notifications/')) {
            console.log(`🔔 NOTIFICATION DETECTED: ${data.method}`);
            console.log(`📄 Notification params:`, JSON.stringify(data.params, null, 2));
          }
          
          // Check for tool response
          if (data.result && data.result.content) {
            console.log('🛠️ Tool response received');
            console.log('✅ Test completed successfully!');
            process.exit(0);
          }
          
        } catch (e) {
          console.log('📝 Raw message:', dataLine);
        }
      }
    }
  });

  // Send message via POST to /message endpoint
  function sendMessage(message, sessionId) {
    const messageOptions = {
      hostname: 'localhost',
      port: SSE_PORT,
      path: `/message?sessionId=${sessionId}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const messageReq = http.request(messageOptions, (messageRes) => {
      console.log(`📡 Message Response Status: ${messageRes.statusCode}`);
    });

    messageReq.on('error', (error) => {
      console.error('❌ Message error:', error.message);
    });

    messageReq.write(JSON.stringify(message));
    messageReq.end();
  }
  
  // Timeout after 10 seconds
  setTimeout(() => {
    console.log('⏰ Test timeout');
    process.exit(0);
  }, 10000);
});

sseReq.on('error', (error) => {
  console.error('❌ SSE Connection error:', error.message);
  process.exit(1);
});

sseReq.end();
