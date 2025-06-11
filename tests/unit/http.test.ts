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
  beforeEach(() => {
    vi.clearAllMocks();
    // Get reference to the mocked app
    mockApp = (express as any).__mockApp;
  });

  it('should create an HTTP transport', () => {
    // Verify express was properly mocked
    expect(express).toBeDefined();
    expect((express as any).json).toBeDefined();

    // Verify SDK components are also mocked
    expect(StreamableHTTPServerTransport).toBeDefined();
    expect(InMemoryEventStore).toBeDefined();

    // Initialize express app - this simulates the module loading
    const app = express();
    
    // Verify express middleware initialization
    expect(mockApp.use).toHaveBeenCalled();
    expect((express as any).json).toHaveBeenCalled();
  });
  
  it('should handle POST /mcp for new session initialization', async () => {
    const app = express();
    const mockReq = {
      headers: {},
      body: { id: 'test-request-id' }
    };
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    // Simulate endpoint handler for POST /mcp
    const postCalls = mockApp.post.mock.calls;
    expect(postCalls.length).toBeGreaterThan(0);
    const handler = postCalls.find(call => call[0] === '/mcp')?.[1];
    expect(handler).toBeDefined();

    // Execute the handler
    await handler(mockReq, mockRes);

    // Verify server was created and transport was initialized
    expect(createServer).toHaveBeenCalled();
    expect(StreamableHTTPServerTransport).toHaveBeenCalled();
  });
  
  it('should handle GET /mcp for SSE stream with valid session ID', async () => {
    const app = express();
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
    // This requires reaching into the module to access the transports map
    const getCalls = mockApp.get.mock.calls;
    expect(getCalls.length).toBeGreaterThan(0);
    const handler = getCalls.find(call => call[0] === '/mcp')?.[1];
    expect(handler).toBeDefined();

    // Manually mock the transports map
    const transportsMap = new Map();
    transportsMap.set('mock-session-id', mockTransport);
    
    // Execute the handler with mocked internal state
    const context = { transports: transportsMap };
    await handler.call(context, mockReq, mockRes);
    
    // Verify transport.handleRequest was called
    expect(mockTransport.handleRequest).toHaveBeenCalledWith(mockReq, mockRes);
  });
});
