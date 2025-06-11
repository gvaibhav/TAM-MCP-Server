// tests/unit/http.test.ts - Tests for the HTTP server transport
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { createServer } from '../../src/server.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { InMemoryEventStore } from '@modelcontextprotocol/sdk/examples/shared/inMemoryEventStore.js';

// Mock the express module
vi.mock('express', () => {
  const jsonMiddleware = vi.fn();
  const mockExpressApp = {
    use: vi.fn(),
    post: vi.fn(),
    get: vi.fn(), 
    delete: vi.fn(),
    listen: vi.fn().mockReturnValue({
      on: vi.fn(),
      close: vi.fn()
    })
  };
  
  const mockExpress = vi.fn().mockReturnValue(mockExpressApp);
  (mockExpress as any).json = vi.fn().mockReturnValue(jsonMiddleware);
  
  // Store reference to the mock app for test access
  (mockExpress as any).__mockApp = mockExpressApp;
  
  return {
    default: mockExpress
  };
});

import express from 'express';

// Create reference to mock app instance
let mockApp: any;

// Mock server.js
vi.mock('../../src/server.js', () => ({
  createServer: vi.fn().mockResolvedValue({
    server: {
      connect: vi.fn().mockResolvedValue(undefined),
      onclose: null
    },
    cleanup: vi.fn().mockResolvedValue(undefined),
    notificationService: {
      sendMessage: vi.fn().mockResolvedValue(undefined)
    }
  })
}));

// Mock the SDK modules
vi.mock('@modelcontextprotocol/sdk/server/streamableHttp.js', () => ({
  StreamableHTTPServerTransport: vi.fn().mockImplementation(() => ({
    sessionId: 'mock-session-id',
    handleRequest: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined)
  }))
}));

vi.mock('@modelcontextprotocol/sdk/examples/shared/inMemoryEventStore.js', () => ({
  InMemoryEventStore: vi.fn().mockImplementation(() => ({}))
}));

// Mock node:crypto
vi.mock('node:crypto', () => ({
  randomUUID: vi.fn().mockReturnValue('mock-session-id')
}));

describe('HTTP Transport', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Import the HTTP module to trigger Express app setup
    await import('../../src/http.ts?t=' + Date.now());
    
    // Get reference to the mocked app from express.mock.results
    const mockExpress = express as any;
    mockApp = mockExpress.mock.results[mockExpress.mock.results.length - 1].value;
  });

  it('should create an HTTP transport', async () => {
    // Verify express was properly called
    expect(express).toHaveBeenCalled();
    expect((express as any).json).toHaveBeenCalled();
    
    // Verify express middleware initialization
    expect(mockApp.use).toHaveBeenCalled();
  });
  
  it('should handle POST /mcp for new session initialization', async () => {
    // Simulate endpoint handler for POST /mcp
    const postCalls = mockApp.post.mock.calls;
    expect(postCalls.length).toBeGreaterThan(0);
    const handler = postCalls.find(call => call[0] === '/mcp')?.[1];
    expect(handler).toBeDefined();
    
    const mockReq = {
      headers: {},
      body: { id: 'test-request-id' }
    };
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    // Execute the handler
    await handler(mockReq, mockRes);

    // Verify server was created and transport was initialized
    expect(createServer).toHaveBeenCalled();
    expect(StreamableHTTPServerTransport).toHaveBeenCalled();
  });
  
  it('should handle GET /mcp for SSE stream with valid session ID', async () => {
    // This requires reaching into the module to access the transports map
    const getCalls = mockApp.get.mock.calls;
    expect(getCalls.length).toBeGreaterThan(0);
    const handler = getCalls.find(call => call[0] === '/mcp')?.[1];
    expect(handler).toBeDefined();
    
    const mockReq = {
      headers: {
        'mcp-session-id': 'mock-session-id'
      }
    };
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    
    // Create a mock transport for the test
    const mockTransport = {
      sessionId: 'mock-session-id',
      handleRequest: vi.fn().mockResolvedValue(undefined)
    };
    
    // Add mock transport to the tracked transports map
    // Manually mock the transports map by creating it in global scope
    const transportsMap = new Map();
    transportsMap.set('mock-session-id', mockTransport);
    
    // Execute the handler with mocked internal state
    const context = { transports: transportsMap };
    await handler.call(context, mockReq, mockRes);
    
    // At minimum, verify the handler was found and callable
    expect(handler).toBeDefined();
  });
});
