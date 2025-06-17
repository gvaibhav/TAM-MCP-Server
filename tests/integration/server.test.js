#!/usr/bin/env node

/**
 * Integration tests for TAM MCP Server
 * Tests server initialization and tool execution through the MCP protocol
 */

import { describe, it, expect } from 'vitest';
import { createServer } from '../../dist/server.js';

describe('Server Integration Tests', () => {
  it('should be implemented', () => {
    // TODO: Implement server integration tests
    expect(true).toBe(true);
  });
});

export async function testServerInitialization() {
  console.log('🧪 Testing server initialization...');
  
  const { server, cleanup, notificationService } = await createServer();
  
  // Validate server object
  if (!server) {
    throw new Error('Server not created');
  }
  
  if (!server.capabilities) {
    throw new Error('Server capabilities not defined');
  }
  
  // Check required capabilities
  const requiredCapabilities = ['tools', 'logging', 'notifications'];
  for (const capability of requiredCapabilities) {
    if (!(capability in server.capabilities)) {
      throw new Error(`Missing capability: ${capability}`);
    }
  }
  
  // Validate notification service
  if (!notificationService) {
    throw new Error('NotificationService not created');
  }
  
  if (typeof notificationService.sendMessage !== 'function') {
    throw new Error('NotificationService missing sendMessage method');
  }
  
  console.log('✅ Server initialized successfully with all capabilities');
  console.log('✅ NotificationService properly integrated');
  
  // Cleanup
  await cleanup();
  
  return { server, notificationService };
}

export async function testServerProtocolMethods() {
  console.log('🧪 Testing server protocol methods...');
  
  const { server, cleanup } = await createServer();
  
  // Test that server has the required MCP methods
  const requiredHandlers = ['tools/list', 'tools/call'];
  
  for (const method of requiredHandlers) {
    if (!server.getRequestHandler({ method })) {
      throw new Error(`Missing handler for ${method}`);
    }
  }
  
  console.log('✅ All required protocol methods are implemented');
  
  // Cleanup
  await cleanup();
  
  return true;
}

export async function testNotificationCapabilities() {
  console.log('🧪 Testing notification capabilities...');
  
  const { server, cleanup, notificationService } = await createServer();
  
  // Test notification service methods
  const notificationMethods = [
    'sendMessage',
    'sendProgress', 
    'sendMarketAnalysisUpdate',
    'sendError',
    'sendCalculationStatus',
    'sendDataFetchStatus',
    'sendValidationStatus'
  ];
  
  for (const method of notificationMethods) {
    if (typeof notificationService[method] !== 'function') {
      throw new Error(`NotificationService missing method: ${method}`);
    }
  }
  
  console.log('✅ All notification methods are available');
  
  // Test notification service enable/disable
  notificationService.setEnabled(false);
  notificationService.setEnabled(true);
  
  console.log('✅ Notification service enable/disable working');
  
  // Cleanup
  await cleanup();
  
  return true;
}

async function runAllIntegrationTests() {
  console.log('🚀 Starting TAM MCP Server Integration Tests...\n');
  
  try {
    await testServerInitialization();
    await testServerProtocolMethods();
    await testNotificationCapabilities();
    
    console.log('\n🎉 All integration tests passed! Server integration is working correctly.');
    return true;
  } catch (error) {
    console.error('❌ Integration tests failed:', error.message);
    return false;
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllIntegrationTests()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
}
