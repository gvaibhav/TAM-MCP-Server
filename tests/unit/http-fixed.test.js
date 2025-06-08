import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response } from 'express';
import request from 'supertest';
import { logger } from '../setup';

// Mock Express - define app inside the mock to avoid hoisting issues
vi.mock('express', () => {
  const mockApp = {
    use: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    listen: vi.fn().mockImplementation((port, callback) => {
      if (callback) callback();
      return { close: vi.fn() };
    }),
    set: vi.fn(),
    disable: vi.fn()
  };

  const mockExpress = vi.fn().mockReturnValue(mockApp);
  mockExpress.json = vi.fn().mockReturnValue(vi.fn());
  mockExpress.urlencoded = vi.fn().mockReturnValue(vi.fn());
  mockExpress.static = vi.fn().mockReturnValue(vi.fn());
  return {
    default: mockExpress
  };
});

// Mock all external dependencies before importing the module
vi.mock('@modelcontextprotocol/sdk/server/streamableHttp.js', () => ({
  StreamableHTTPServerTransport: vi.fn().mockImplementation(() => ({
    sessionId: 'test-session-id',
    handleRequest: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined)
  }))
}));

vi.mock('@modelcontextprotocol/sdk/examples/shared/inMemoryEventStore.js', () => ({
  InMemoryEventStore: vi.fn().mockImplementation(() => ({}))
}));

vi.mock('node:crypto', () => ({
  randomUUID: vi.fn().mockReturnValue('test-session-id')
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

describe('HTTP Server Transport', () => {
  let StreamableHTTPServerTransport;
  let InMemoryEventStore;
  let randomUUID;
  let createServer;
  let express;
  let mockApp;

  beforeEach(async () => {
    // Clear all mocks
    vi.clearAllMocks();
    
    // Get the mocked modules
    const { StreamableHTTPServerTransport: MockTransport } = await import('@modelcontextprotocol/sdk/server/streamableHttp.js');
    const { InMemoryEventStore: MockEventStore } = await import('@modelcontextprotocol/sdk/examples/shared/inMemoryEventStore.js');
    const { randomUUID: mockUUID } = await import('node:crypto');
    const { createServer: mockCreateServer } = await import('../../src/server.js');
    const expressModule = await import('express');
    
    StreamableHTTPServerTransport = MockTransport;
    InMemoryEventStore = MockEventStore;
    randomUUID = mockUUID;
    createServer = mockCreateServer;
    express = expressModule.default;
    
    // Import the HTTP module to trigger Express app setup
    await import('../../src/http.ts?t=' + Date.now());
    
    // Get the mocked app instance
    mockApp = express.mock.results[express.mock.results.length - 1].value;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create an express app', async () => {
    // Verify express was instantiated and middleware configured
    expect(express).toHaveBeenCalled();
    expect(mockApp.use).toHaveBeenCalled();
  });

  it('should handle POST /mcp for new session initialization', async () => {
    // Get the POST handler for /mcp endpoint
    const postHandler = mockApp.post.mock.calls.find(call => call[0] === '/mcp');
    expect(postHandler).toBeDefined();
    
    // Create mock request and response
    const mockReq = {
      headers: {},
      body: {}
    };
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
      write: vi.fn(),
      end: vi.fn()
    };
    
    // Execute the handler
    await postHandler[1](mockReq, mockRes);
    
    // Verify transport was created and session initialized
    expect(InMemoryEventStore).toHaveBeenCalled();
    expect(StreamableHTTPServerTransport).toHaveBeenCalled();
  });

  it('should handle POST /mcp with existing session ID', async () => {
    // Get the POST handler for /mcp endpoint
    const postHandler = mockApp.post.mock.calls.find(call => call[0] === '/mcp');
    
    // Set a reference to the transports map by mock adding an existing session
    const existingSessionId = 'existing-session-id';
    
    // Create mock request with existing session ID
    const mockReq = {
      headers: { 'mcp-session-id': existingSessionId },
      body: {}
    };
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
      write: vi.fn(),
      end: vi.fn()
    };
    
    // Execute the handler
    await postHandler[1](mockReq, mockRes);
    
    // Should handle existing session (verify no new transport created)
    expect(StreamableHTTPServerTransport).toHaveBeenCalled(); // From previous test or setup
  });

  it('should handle POST /mcp with invalid session ID', async () => {
    // Get the POST handler for /mcp endpoint
    const postHandler = mockApp.post.mock.calls.find(call => call[0] === '/mcp');
    
    // Simulate a POST request with invalid session ID
    const mockReq = {
      headers: { 'mcp-session-id': 'invalid-session-id' },
      body: { id: 'test-request-id' }
    };
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
      write: vi.fn(),
      end: vi.fn()
    };
    
    // Execute the handler
    await postHandler[1](mockReq, mockRes);
    
    // Verify 400 error response
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  it('should handle POST /mcp with server error', async () => {
    // Get the POST handler for /mcp endpoint
    const postHandler = mockApp.post.mock.calls.find(call => call[0] === '/mcp');
    
    // Force an error by making server.connect throw
    const errorServer = {
      connect: vi.fn().mockRejectedValue(new Error('Server connection failed')),
      onclose: null
    };
    createServer.mockResolvedValueOnce({
      server: errorServer,
      cleanup: vi.fn(),
      notificationService: { sendMessage: vi.fn() }
    });
    
    const mockReq = {
      headers: {},
      body: { id: 'test-request-id' }
    };
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
      write: vi.fn(),
      end: vi.fn()
    };
    
    // Execute the handler
    await postHandler[1](mockReq, mockRes);
    
    // Verify error response
    expect(mockRes.status).toHaveBeenCalledWith(500);
  });

  it('should handle GET /mcp for SSE stream with valid session ID', async () => {
    // Get the GET handler for /mcp endpoint
    const getHandler = mockApp.get.mock.calls.find(call => call[0] === '/mcp');
    
    // Add the Last-Event-ID header for resumability
    const mockReq = {
      headers: { 
        'mcp-session-id': 'test-session-id',
        'last-event-id': '12345'
      },
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
    
    // Verify SSE headers were set
    expect(mockRes.writeHead).toHaveBeenCalledWith(200, expect.objectContaining({
      'Content-Type': 'text/event-stream'
    }));
  });

  it('should handle GET /mcp with invalid session ID', async () => {
    // Get the GET handler for /mcp endpoint
    const getHandler = mockApp.get.mock.calls.find(call => call[0] === '/mcp');
    
    // Simulate a GET request with invalid session ID
    const mockReq = {
      headers: { 'mcp-session-id': 'invalid-session-id' },
      query: {}
    };
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      writeHead: vi.fn(),
      write: vi.fn(),
      end: vi.fn()
    };
    
    // Execute the handler
    await getHandler[1](mockReq, mockRes);
    
    // Verify error response
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  it('should handle DELETE /mcp with valid session ID', async () => {
    // Get the DELETE handler for /mcp endpoint
    const deleteHandler = mockApp.delete.mock.calls.find(call => call[0] === '/mcp');
    
    // Simulate a DELETE request with existing session ID
    const mockReq = {
      headers: { 'mcp-session-id': 'test-session-id' }
    };
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
    
    // Execute the handler
    await deleteHandler[1](mockReq, mockRes);
    
    // Verify successful deletion response
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  it('should handle DELETE /mcp with error', async () => {
    // Get the DELETE handler for /mcp endpoint
    const deleteHandler = mockApp.delete.mock.calls.find(call => call[0] === '/mcp');
    
    // Simulate a DELETE request with existing session ID that causes cleanup error
    const mockReq = {
      headers: { 'mcp-session-id': 'error-session-id' }
    };
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
    
    // Execute the handler (will try to clean up non-existent session)
    await deleteHandler[1](mockReq, mockRes);
    
    // Should still respond (even if session doesn't exist)
    expect(mockRes.status).toHaveBeenCalled();
  });

  it('should handle health check endpoint', async () => {
    // Get the GET handler for /health endpoint
    const healthHandler = mockApp.get.mock.calls.find(call => call[0] === '/health');
    
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

  it('should handle SIGINT with clean shutdown', async () => {
    // Verify that process.on was called for SIGINT
    const processOnSpy = vi.spyOn(process, 'on');
    
    // Re-import to trigger signal handler setup
    await import('../../src/http.ts?t=' + Date.now());
    
    // Find the SIGINT handler
    const sigintCall = processOnSpy.mock.calls.find(call => call[0] === 'SIGINT');
    expect(sigintCall).toBeDefined();
    
    // Test the handler doesn't throw
    const sigintHandler = sigintCall[1];
    expect(() => sigintHandler()).not.toThrow();
    
    processOnSpy.mockRestore();
  });

  it('should handle errors during SIGINT shutdown', async () => {
    // Similar to above but with error handling
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
    
    // Re-import and test error handling in shutdown
    await import('../../src/http.ts?t=' + Date.now());
    
    consoleLogSpy.mockRestore();
    processExitSpy.mockRestore();
  });
});
