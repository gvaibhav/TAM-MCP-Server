// tests/unit/sse-new.test.ts - Tests for SSE server transport
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createServer } from '../../src/server.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';

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
vi.mock('@modelcontextprotocol/sdk/server/sse.js', () => ({
  SSEServerTransport: vi.fn().mockImplementation(() => ({
    sessionId: 'mock-sse-session-id',
    handlePostMessage: vi.fn().mockResolvedValue(undefined)
  }))
}));

describe('SSE Transport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Get reference to the mocked app
    mockApp = (express as any).__mockApp;
  });

  it('should create an SSE transport', async () => {
    // Import the SSE module to trigger route setup
    await import('../../src/sse-new.ts');
    
    // Verify express was called to create app
    expect(express).toHaveBeenCalled();
    
    // Verify express middleware initialization
    expect(mockApp.use).toHaveBeenCalled();
    expect((express as any).json).toHaveBeenCalled();
  });
  
  it('should handle GET /sse for new client connection', async () => {
    // Import the SSE module to trigger route setup
    await import('../../src/sse-new.ts');
    
    const mockReq = {
      query: {},
      body: { id: 'test-request-id' }
    };
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    
    // Simulate endpoint handler for GET /sse
    const getCalls = mockApp.get.mock.calls;
    expect(getCalls.length).toBeGreaterThan(0);
    const handler = getCalls.find(call => call[0] === '/sse');
    expect(handler).toBeDefined();
    
    // Execute the handler if found
    if (handler && handler[1]) {
      await handler[1](mockReq, mockRes);
    }
    
    // Verify server was created and transport was initialized
    expect(createServer).toHaveBeenCalled();
    expect(SSEServerTransport).toHaveBeenCalled();
  });
  
  it('should handle POST /message with valid session ID', async () => {
    // Import the SSE module to trigger route setup
    await import('../../src/sse-new.ts');
    
    const mockReq = {
      query: {
        sessionId: 'mock-sse-session-id'
      },
      body: { id: 'test-request-id' }
    };
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    
    // Simulate endpoint handler for POST /message
    const postCalls = mockApp.post.mock.calls;
    expect(postCalls.length).toBeGreaterThan(0);
    const handler = postCalls.find(call => call[0] === '/message');
    expect(handler).toBeDefined();
    
    // Execute the handler if found (no transport exists so should log error)
    if (handler && handler[1]) {
      await handler[1](mockReq, mockRes);
    }
    
    // No transport exists for the session, so message should log "No transport found"
    expect(SSEServerTransport).toHaveBeenCalled();
  });
});
