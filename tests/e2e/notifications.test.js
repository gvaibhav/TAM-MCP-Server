#!/usr/bin/env node

/**
 * End-to-end tests for TAM MCP Server notifications
 * Tests notification delivery and functionality across transport protocols
 */

import { describe, it, expect } from 'vitest';
import http from 'http';
import { randomUUID } from 'crypto';

describe('End-to-End Notifications Tests', () => {
  it('should be implemented', () => {
    // TODO: Implement notification system e2e tests
    expect(true).toBe(true);
  });
});

const SSE_PORT = 3001;

// MCP initialization request
const initRequest = {
  jsonrpc: "2.0",
  id: randomUUID(),
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: {
      roots: { listChanged: true },
      sampling: {}
    },
    clientInfo: {
      name: "test-client",
      version: "1.0.0"
    }
  }
};

// Tool call request to trigger notifications
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

export async function testNotificationTypes() {
  console.log('🧪 Testing Notification Types via SSE...');
  
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Notification types test timeout'));
    }, 20000);
    
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

    let sessionId = null;
    let initializationComplete = false;
    let messageBuffer = '';
    
    const receivedNotifications = {
      'notifications/message': 0,
      'notifications/market_analysis': 0,
      'notifications/error': 0,
      'notifications/progress': 0
    };

    const sseReq = http.request(sseOptions, (sseRes) => {
      sseRes.on('data', (chunk) => {
        messageBuffer += chunk.toString();
        
        // Parse SSE messages
        const lines = messageBuffer.split('\n');
        messageBuffer = lines.pop() || '';
        
        for (const line of lines) {
          // Extract session ID
          if (line.startsWith('data: /message?sessionId=')) {
            sessionId = line.split('sessionId=')[1];
            console.log(`🔑 Session ID: ${sessionId}`);
            
            // Send initialization request
            setTimeout(() => sendMessage(initRequest, sessionId), 100);
            continue;
          }
          
          // Parse JSON messages
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              
              // Check for initialization response
              if (data.result && data.result.protocolVersion && !initializationComplete) {
                console.log('✅ MCP initialization complete');
                initializationComplete = true;
                
                // Send tool request to trigger notifications
                setTimeout(() => {
                  console.log('📤 Sending tool request to trigger notifications...');
                  sendMessage(toolRequest, sessionId);
                }, 500);
              }
              
              // Count notification types
              if (data.method && data.method.startsWith('notifications/')) {
                const notificationType = data.method;
                if (notificationType in receivedNotifications) {
                  receivedNotifications[notificationType]++;
                  console.log(`🔔 ${notificationType} (${receivedNotifications[notificationType]})`);
                  
                  // Log notification details
                  if (data.params) {
                    console.log(`   📄 ${JSON.stringify(data.params).substring(0, 100)}...`);
                  }
                }
              }
              
              // Check if we've received enough notifications to consider test successful
              const totalNotifications = Object.values(receivedNotifications).reduce((a, b) => a + b, 0);
              if (totalNotifications >= 3) {
                clearTimeout(timeout);
                sseReq.destroy();
                resolve(receivedNotifications);
              }
              
            } catch (e) {
              // Ignore parse errors for non-JSON messages
            }
          }
        }
      });
    });

    function sendMessage(message, sessionId) {
      const messageOptions = {
        hostname: 'localhost',
        port: SSE_PORT,
        path: `/message?sessionId=${sessionId}`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      };

      const messageReq = http.request(messageOptions, () => {});
      messageReq.on('error', () => {});
      messageReq.write(JSON.stringify(message));
      messageReq.end();
    }

    sseReq.on('error', (error) => {
      clearTimeout(timeout);
      reject(new Error(`Notification types test error: ${error.message}`));
    });

    sseReq.end();
  });
}

export async function testNotificationTiming() {
  console.log('🧪 Testing Notification Timing...');
  
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Notification timing test timeout'));
    }, 15000);
    
    const startTime = Date.now();
    const notificationTimestamps = [];
    
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
      sseRes.on('data', (chunk) => {
        const data = chunk.toString();
        
        // Record timestamp when notification is received
        if (data.includes('notifications/')) {
          const timestamp = Date.now() - startTime;
          notificationTimestamps.push(timestamp);
          console.log(`⏱️ Notification received at +${timestamp}ms`);
          
          // After receiving a few notifications, analyze timing
          if (notificationTimestamps.length >= 2) {
            clearTimeout(timeout);
            sseReq.destroy();
            
            const timingAnalysis = {
              firstNotification: notificationTimestamps[0],
              totalNotifications: notificationTimestamps.length,
              averageInterval: notificationTimestamps.length > 1 
                ? (notificationTimestamps[notificationTimestamps.length - 1] - notificationTimestamps[0]) / (notificationTimestamps.length - 1)
                : 0
            };
            
            console.log('✅ Notification timing analysis:');
            console.log(`   First notification: ${timingAnalysis.firstNotification}ms`);
            console.log(`   Total notifications: ${timingAnalysis.totalNotifications}`);
            console.log(`   Average interval: ${Math.round(timingAnalysis.averageInterval)}ms`);
            
            resolve(timingAnalysis);
          }
        }
      });
    });

    sseReq.on('error', (error) => {
      clearTimeout(timeout);
      reject(new Error(`Notification timing test error: ${error.message}`));
    });

    sseReq.end();
  });
}

export async function testNotificationContent() {
  console.log('🧪 Testing Notification Content Structure...');
  
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Notification content test timeout'));
    }, 10000);
    
    const notificationContents = [];
    
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
      let messageBuffer = '';
      
      sseRes.on('data', (chunk) => {
        messageBuffer += chunk.toString();
        const lines = messageBuffer.split('\n');
        messageBuffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              
              if (data.method && data.method.startsWith('notifications/')) {
                notificationContents.push(data);
                console.log(`📋 Captured notification: ${data.method}`);
                
                // Validate notification structure
                const requiredFields = ['method', 'params', 'jsonrpc'];
                const hasAllFields = requiredFields.every(field => field in data);
                
                if (!hasAllFields) {
                  clearTimeout(timeout);
                  reject(new Error(`Notification missing required fields: ${JSON.stringify(data)}`));
                  return;
                }
                
                // After capturing a few notifications, validate them
                if (notificationContents.length >= 2) {
                  clearTimeout(timeout);
                  sseReq.destroy();
                  
                  console.log('✅ Notification content validation:');
                  notificationContents.forEach((notification, index) => {
                    console.log(`   ${index + 1}. ${notification.method} - Valid structure ✅`);
                  });
                  
                  resolve(notificationContents);
                }
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      });
    });

    sseReq.on('error', (error) => {
      clearTimeout(timeout);
      reject(new Error(`Notification content test error: ${error.message}`));
    });

    sseReq.end();
  });
}

async function runAllNotificationTests() {
  console.log('🚀 Starting TAM MCP Server Notification E2E Tests...\n');
  
  try {
    await testNotificationTypes();
    await testNotificationTiming(); 
    await testNotificationContent();
    
    console.log('\n🎉 All notification E2E tests passed! Notifications are working correctly.');
    return true;
  } catch (error) {
    console.error('❌ Notification E2E tests failed:', error.message);
    console.error('💡 Make sure SSE server is running: npm run start:sse');
    return false;
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllNotificationTests()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
}
