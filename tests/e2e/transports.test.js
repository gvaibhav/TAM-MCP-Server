#!/usr/bin/env node

/**
 * End-to-end tests for TAM MCP Server transports
 * Tests SSE and HTTP Streamable transports with real connections
 */

import { describe, it, expect } from 'vitest';
import http from 'http';

describe('End-to-End Transport Tests', () => {
  it('should be implemented', () => {
    // TODO: Implement transport layer e2e tests
    expect(true).toBe(true);
  });
});

const SSE_PORT = 3001;
const HTTP_PORT = 3002;

export async function testSSETransportConnection() {
  console.log('🧪 Testing SSE Transport Connection...');
  
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('SSE connection test timeout'));
    }, 10000);
    
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
      if (sseRes.statusCode !== 200) {
        clearTimeout(timeout);
        reject(new Error(`SSE connection failed with status ${sseRes.statusCode}`));
        return;
      }
      
      console.log('✅ SSE connection established');
      
      let sessionId = null;
      let welcomeNotificationReceived = false;
      
      sseRes.on('data', (chunk) => {
        const data = chunk.toString();
        
        // Look for session ID
        if (data.includes('/message?sessionId=') && !sessionId) {
          const match = data.match(/sessionId=([a-f0-9-]+)/);
          if (match) {
            sessionId = match[1];
            console.log(`✅ Session ID received: ${sessionId}`);
          }
        }
        
        // Look for welcome notification
        if (data.includes('notifications/message') && data.includes('TAM MCP Server connected')) {
          welcomeNotificationReceived = true;
          console.log('✅ Welcome notification received');
        }
        
        // If we have both session ID and welcome notification, test passed
        if (sessionId && welcomeNotificationReceived) {
          clearTimeout(timeout);
          sseReq.destroy();
          resolve({ sessionId, welcomeNotificationReceived });
        }
      });
    });

    sseReq.on('error', (error) => {
      clearTimeout(timeout);
      reject(new Error(`SSE connection error: ${error.message}`));
    });

    sseReq.end();
  });
}

export async function testHTTPTransportHealth() {
  console.log('🧪 Testing HTTP Transport Health...');
  
  return new Promise((resolve, reject) => {
    const healthOptions = {
      hostname: 'localhost',
      port: HTTP_PORT,
      path: '/health',
      method: 'GET'
    };

    const healthReq = http.request(healthOptions, (healthRes) => {
      if (healthRes.statusCode !== 200) {
        reject(new Error(`HTTP health check failed with status ${healthRes.statusCode}`));
        return;
      }
      
      let responseData = '';
      healthRes.on('data', (chunk) => {
        responseData += chunk;
      });
      
      healthRes.on('end', () => {
        try {
          const healthData = JSON.parse(responseData);
          
          if (healthData.status !== 'healthy') {
            reject(new Error(`Server not healthy: ${healthData.status}`));
            return;
          }
          
          console.log('✅ HTTP transport healthy');
          console.log(`✅ Service: ${healthData.service}`);
          console.log(`✅ Version: ${healthData.version}`);
          console.log(`✅ Active sessions: ${healthData.activeSessions}`);
          
          resolve(healthData);
        } catch (error) {
          reject(new Error(`Failed to parse health response: ${error.message}`));
        }
      });
    });

    healthReq.on('error', (error) => {
      reject(new Error(`HTTP health request error: ${error.message}`));
    });

    healthReq.end();
  });
}

export async function testSSETransportHealth() {
  console.log('🧪 Testing SSE Transport Health...');
  
  return new Promise((resolve, reject) => {
    const healthOptions = {
      hostname: 'localhost',
      port: SSE_PORT,
      path: '/health',
      method: 'GET'
    };

    const healthReq = http.request(healthOptions, (healthRes) => {
      if (healthRes.statusCode !== 200) {
        reject(new Error(`SSE health check failed with status ${healthRes.statusCode}`));
        return;
      }
      
      let responseData = '';
      healthRes.on('data', (chunk) => {
        responseData += chunk;
      });
      
      healthRes.on('end', () => {
        try {
          const healthData = JSON.parse(responseData);
          
          if (healthData.status !== 'healthy') {
            reject(new Error(`Server not healthy: ${healthData.status}`));
            return;
          }
          
          console.log('✅ SSE transport healthy');
          console.log(`✅ Service: ${healthData.service}`);
          console.log(`✅ Version: ${healthData.version}`);
          
          resolve(healthData);
        } catch (error) {
          reject(new Error(`Failed to parse health response: ${error.message}`));
        }
      });
    });

    healthReq.on('error', (error) => {
      reject(new Error(`SSE health request error: ${error.message}`));
    });

    healthReq.end();
  });
}

export async function testNotificationDelivery() {
  console.log('🧪 Testing Notification Delivery...');
  
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Notification delivery test timeout'));
    }, 15000);
    
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
      let notificationCount = 0;
      let sessionId = null;
      
      sseRes.on('data', (chunk) => {
        const data = chunk.toString();
        
        // Extract session ID
        if (data.includes('/message?sessionId=') && !sessionId) {
          const match = data.match(/sessionId=([a-f0-9-]+)/);
          if (match) {
            sessionId = match[1];
          }
        }
        
        // Count notifications
        if (data.includes('notifications/')) {
          notificationCount++;
          console.log(`✅ Notification ${notificationCount} received`);
          
          // Test passed if we received at least one notification
          if (notificationCount >= 1) {
            clearTimeout(timeout);
            sseReq.destroy();
            resolve({ notificationCount, sessionId });
          }
        }
      });
    });

    sseReq.on('error', (error) => {
      clearTimeout(timeout);
      reject(new Error(`Notification test error: ${error.message}`));
    });

    sseReq.end();
  });
}

async function runAllE2ETests() {
  console.log('🚀 Starting TAM MCP Server E2E Tests...\n');
  
  try {
    // Test transport health first
    await testSSETransportHealth();
    await testHTTPTransportHealth();
    
    // Test actual connections
    await testSSETransportConnection();
    await testNotificationDelivery();
    
    console.log('\n🎉 All E2E tests passed! Transport protocols are working correctly.');
    return true;
  } catch (error) {
    console.error('❌ E2E tests failed:', error.message);
    console.error('💡 Make sure both servers are running:');
    console.error('   npm run start:sse  # Port 3001');
    console.error('   npm run start:http # Port 3002');
    return false;
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllE2ETests()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
}
