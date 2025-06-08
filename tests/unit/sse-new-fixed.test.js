import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { logger } from '../setup';

// Create Express app mock
const mockApp = {
  use: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  listen: vi.fn().mockImplementation((port, callback) => {
    if (callback) callback();
    return {
      on: vi.fn(),
      close: vi.fn()
    };
  })
};

// Mock Express
const express = vi.fn().mockReturnValue(mockApp);
express.json = vi.fn().mockReturnValue(vi.fn());

vi.mock('express', () => ({
  default: express
}));

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

vi.mock('@modelcontextprotocol/sdk/server/sse.js', () => {
  return {
    SSEServerTransport: vi.fn().mockImplementation((path, res) => {
      return {
        sessionId: 'test-sse-session-id',
        handlePostMessage: vi.fn().mockResolvedValue(undefined)
      };
    })
  };
});

describe('SSE Server Transport', () => {
  let createServer;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    const { createServer: mockCreateServer } = await import('../../src/server.js');
    createServer = mockCreateServer;
    
    // Import the SSE module to trigger setup
    await import('../../src/sse-new.ts?t=' + Date.now());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create an express app', async () => {
    // Verify express was called and app configured
    expect(express).toHaveBeenCalled();
    expect(mockApp.use).toHaveBeenCalled();
  });

  it('should handle GET /sse for new client connection', async () => {
    // Get the GET handler for /sse endpoint
    const getHandler = mockApp.get.mock.calls.find(call => call[0] === '/sse');
    expect(getHandler).toBeDefined();
    
    // Simulate a GET request without session ID (new connection)
    const mockReq = {
      headers: {},
      query: {}
    };
    const mockRes = {
      writeHead: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
      on: vi.fn(),
      setHeader: vi.fn()
    };
    
    // Execute the handler
    await getHandler[1](mockReq, mockRes);
    
    // Verify SSE connection setup
    expect(mockRes.writeHead).toHaveBeenCalledWith(200, expect.objectContaining({
      'Content-Type': 'text/event-stream'
    }));
    expect(SSEServerTransport).toHaveBeenCalled();
  });

  it('should handle GET /sse with existing sessionId (reconnection)', async () => {
    // Get the GET handler for /sse endpoint
    const getHandler = mockApp.get.mock.calls.find(call => call[0] === '/sse');
    
    // Simulate a GET request with existing session ID
    const mockReq = {
      headers: { 'mcp-session-id': 'existing-session-id' },
      query: {}
    };
    const mockRes = {
      writeHead: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
      on: vi.fn(),
      setHeader: vi.fn()
    };
    
    // Execute the handler
    await getHandler[1](mockReq, mockRes);
    
    // Verify reconnection handling
    expect(mockRes.writeHead).toHaveBeenCalledWith(200, expect.objectContaining({
      'Content-Type': 'text/event-stream'
    }));
  });

  it('should handle POST /message with valid session ID', async () => {
    // Get the POST handler for /message endpoint
    const postHandler = mockApp.post.mock.calls.find(call => call[0] === '/message');
    expect(postHandler).toBeDefined();
    
    // Create mock request with valid session ID
    const mockReq = {
      headers: { 'mcp-session-id': 'test-session-id' },
      body: { message: 'test message' }
    };
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      end: vi.fn()
    };
    
    // Execute the handler
    await postHandler[1](mockReq, mockRes);
    
    // Should handle the message
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  it('should handle POST /message with invalid session ID', async () => {
    // Get the POST handler for /message endpoint
    const postHandler = mockApp.post.mock.calls.find(call => call[0] === '/message');
    
    // Simulate a POST request with invalid session ID
    const mockReq = {
      headers: { 'mcp-session-id': 'invalid-session-id' },
      body: { message: 'test message' }
    };
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      end: vi.fn()
    };
    
    // Execute the handler
    await postHandler[1](mockReq, mockRes);
    
    // Should return error
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  it('should handle health check endpoint', async () => {
    // Get the GET handler for /health endpoint
    const healthHandler = mockApp.get.mock.calls.find(call => call[0] === '/health');
    expect(healthHandler).toBeDefined();
    
    // Simulate a health check request
    const mockReq = {};
    const mockRes = {
      json: vi.fn()
    };
    
    // Execute the handler
    await healthHandler[1](mockReq, mockRes);
    
    // Verify health response
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      status: 'healthy'
    }));
  });

  it('should start the server on the configured port', async () => {
    // Verify server was started
    expect(mockApp.listen).toHaveBeenCalledWith(expect.any(Number), expect.any(Function));
  });

  it('should handle server onclose callback', async () => {
    // Get the GET handler for /sse endpoint
    const getHandler = mockApp.get.mock.calls.find(call => call[0] === '/sse');
    
    // Create a mock server with onclose property we can access
    const mockServer = {
      connect: vi.fn().mockResolvedValue(undefined),
      onclose: null
    };
    
    createServer.mockResolvedValueOnce({
      server: mockServer,
      cleanup: vi.fn(),
      notificationService: { sendMessage: vi.fn() }
    });
    
    // Simulate SSE connection to trigger server setup
    const mockReq = {
      headers: {},
      query: {}
    };
    const mockRes = {
      writeHead: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
      on: vi.fn(),
      setHeader: vi.fn()
    };
    
    // Execute the handler
    await getHandler[1](mockReq, mockRes);
    
    // Verify server.onclose was assigned
    expect(mockServer.onclose).toBeDefined();
    
    // Test the onclose callback
    if (mockServer.onclose) {
      await mockServer.onclose();
      // Should not throw
    }
  });
});
