import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { logger } from '../setup';

// Mock modules
vi.mock('express', () => {
  const mockExpressApp = {
    use: vi.fn(),
    post: vi.fn(),
    get: vi.fn(),
    listen: vi.fn().mockReturnValue({
      on: vi.fn(),
      close: vi.fn()
    })
  };
  
  const jsonMiddleware = vi.fn();
  const mockExpress = vi.fn().mockReturnValue(mockExpressApp);
  mockExpress.json = vi.fn().mockReturnValue(jsonMiddleware);
  
  return {
    default: mockExpress,
    json: mockExpress.json
  };
});

// Get the mocked express app after mocking
const mockApp = {
  use: vi.fn(),
  post: vi.fn(),
  get: vi.fn(),
  listen: vi.fn().mockReturnValue({
    on: vi.fn(),
    close: vi.fn()
  })
};

vi.mocked(import('express')).then((expressModule) => {
  expressModule.default.mockReturnValue(mockApp);
});

import express from 'express';

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
  let req;
  let res;
  let mockApp;

  // Reset all mocks before each test
  beforeEach(async () => {
    // Create mock request and response objects
    req = {
      headers: {},
      body: { id: 'request-id' },
      query: {}
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      headersSent: false
    };

    // Reset all mocks
    vi.clearAllMocks();
    
    // Get the mock express app for each test
    const { default: mockExpress } = await import('express');
    mockApp = mockExpress();
  });

  it('should create an express app', async () => {
    // Import the SSE server module
    await import('../../src/sse-new.js');
    
    // Get the mock express function from the module
    const { default: mockExpress } = await import('express');
    
    // Verify express was instantiated
    expect(mockExpress).toHaveBeenCalled();
    // Verify express.json middleware was configured
    expect(mockApp.use).toHaveBeenCalled();
  });

  it('should handle GET /sse for new client connection', async () => {
    const { createServer } = await import('../../src/server.js');
    
    // Simulate importing the SSE module to trigger setup
    await import('../../src/sse-new.js');
    
    // Get the GET handler for /sse endpoint
    const getHandler = mockApp.get.mock.calls.find(call => call[0] === '/sse')[1];
    
    // Simulate a GET request without session ID (new connection)
    await getHandler(req, res);
    
    // Verify server was created and connected
    expect(createServer).toHaveBeenCalled();
    expect(SSEServerTransport).toHaveBeenCalledWith('/message', res);
    
    const mockServer = createServer.mock.results[0].value.server;
    expect(mockServer.connect).toHaveBeenCalled();
    
    // Verify notification was sent
    const { notificationService } = createServer.mock.results[0].value;
    expect(notificationService.sendMessage).toHaveBeenCalledWith(
      'info',
      expect.stringContaining('TAM MCP Server connected via SSE')
    );
  });

  it('should handle GET /sse with existing sessionId (reconnection)', async () => {
    // Get the GET handler for /sse endpoint
    const getHandler = mockApp.get.mock.calls.find(call => call[0] === '/sse')[1];
    
    // Import the SSE module to access internal transports map
    const sseModule = await import('../../src/sse-new.js');
    
    // Mock a transport in the transports map
    const mockExistingTransport = {
      sessionId: 'existing-sse-session-id'
    };
    
    // Create a map and add mock transport
    const transports = new Map();
    transports.set('existing-sse-session-id', mockExistingTransport);
    sseModule.default = { transports };
    
    // Simulate a GET request with existing session ID
    req.query.sessionId = 'existing-sse-session-id';
    
    // Mock console.error to catch warning
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    await getHandler(req, res);
    
    // Verify warning about reconnection was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Client Reconnecting? This shouldn't happen")
    );
    
    consoleErrorSpy.mockRestore();
  });

  it('should handle POST /message with valid session ID', async () => {
    // Get the POST handler for /message endpoint
    const postHandler = mockApp.post.mock.calls.find(call => call[0] === '/message')[1];
    
    // Import the SSE module to access internal transports map
    const sseModule = await import('../../src/sse-new.js');
    
    // Create mock transport with handlePostMessage method
    const mockTransport = {
      sessionId: 'valid-session-id',
      handlePostMessage: vi.fn().mockResolvedValue(undefined)
    };
    
    // Create a map and add mock transport
    const transports = new Map();
    transports.set('valid-session-id', mockTransport);
    sseModule.default = { transports };
    
    // Simulate a POST request with valid session ID
    req.query.sessionId = 'valid-session-id';
    
    // Mock console.error
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    await postHandler(req, res);
    
    // Verify handlePostMessage was called
    expect(mockTransport.handlePostMessage).toHaveBeenCalledWith(req, res);
    
    // Verify log message
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "TAM MCP Client Message from", 
      "valid-session-id"
    );
    
    consoleErrorSpy.mockRestore();
  });

  it('should handle POST /message with invalid session ID', async () => {
    // Get the POST handler for /message endpoint
    const postHandler = mockApp.post.mock.calls.find(call => call[0] === '/message')[1];
    
    // Simulate a POST request with invalid session ID
    req.query.sessionId = 'invalid-session-id';
    
    // Mock console.error
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    await postHandler(req, res);
    
    // Verify log message for invalid session
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      `No transport found for sessionId invalid-session-id`
    );
    
    consoleErrorSpy.mockRestore();
  });

  it('should handle health check endpoint', async () => {
    // Get the GET handler for /health endpoint
    const healthHandler = mockApp.get.mock.calls.find(call => call[0] === '/health')[1];
    
    // Simulate a health check request
    const mockDate = new Date('2025-06-06T12:00:00Z');
    vi.spyOn(global, 'Date').mockImplementation(() => mockDate);
    
    await healthHandler(req, res);
    
    // Verify health check response
    expect(res.json).toHaveBeenCalledWith({
      status: 'healthy',
      service: 'tam-mcp-server-sse',
      version: '1.0.0',
      timestamp: mockDate.toISOString()
    });
  });

  it('should start the server on the configured port', async () => {
    // Import the SSE module
    await import('../../src/sse-new.js');
    
    // Verify server starts on the correct port
    expect(mockApp.listen).toHaveBeenCalledWith(expect.any(Number), expect.any(Function));
  });

  it('should handle server onclose callback', async () => {
    const { createServer } = await import('../../src/server.js');
    
    // Get the GET handler for /sse endpoint
    const getHandler = mockApp.get.mock.calls.find(call => call[0] === '/sse')[1];
    
    // Create a mock server with onclose property we can access
    const mockServer = {
      connect: vi.fn().mockResolvedValue(undefined),
      onclose: null
    };
    
    const mockCleanup = vi.fn().mockResolvedValue(undefined);
    
    // Override the createServer mock for this test
    createServer.mockResolvedValueOnce({
      server: mockServer,
      cleanup: mockCleanup,
      notificationService: {
        sendMessage: vi.fn().mockResolvedValue(undefined)
      }
    });
    
    // Simulate a GET request to create a transport
    await getHandler(req, res);
    
    // Mock console.error for disconnect log
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Verify onclose was set
    expect(mockServer.onclose).toBeDefined();
    
    // Simulate disconnect by calling onclose
    await mockServer.onclose();
    
    // Verify disconnect was logged and cleanup was called
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('TAM MCP Client Disconnected')
    );
    expect(mockCleanup).toHaveBeenCalled();
    
    consoleErrorSpy.mockRestore();
  });
});
