// Unit tests for Transport modules (HTTP, SSE, STDIO)
import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { InMemoryEventStore } from '@modelcontextprotocol/sdk/examples/shared/inMemoryEventStore.js';
import * as crypto from 'node:crypto';

// Mock required modules
vi.mock('express', () => {
  const mockExpress = vi.fn(() => ({
    use: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    listen: vi.fn().mockImplementation((port, callback) => {
      if (callback) callback();
      return { close: vi.fn() };
    })
  }));
  mockExpress.json = vi.fn(() => (req, res, next) => next());
  return { default: mockExpress };
});

vi.mock('@modelcontextprotocol/sdk/server/streamableHttp.js', () => {
  return {
    StreamableHTTPServerTransport: vi.fn().mockImplementation(({ sessionIdGenerator, eventStore, onsessioninitialized }) => ({
      sessionId: 'test-session-id',
      eventStore,
      handleRequest: vi.fn().mockResolvedValue({}),
      close: vi.fn().mockResolvedValue(undefined),
      isInitialized: true
    }))
  };
});

vi.mock('@modelcontextprotocol/sdk/server/sse.js', () => {
  return {
    SSEServerTransport: vi.fn().mockImplementation((messagePath, res) => ({
      sessionId: 'test-session-id',
      handlePostMessage: vi.fn().mockResolvedValue({}),
      close: vi.fn().mockResolvedValue(undefined)
    }))
  };
});

vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => {
  return {
    StdioServerTransport: vi.fn().mockImplementation(() => ({
      sessionId: 'test-session-id',
      close: vi.fn().mockResolvedValue(undefined)
    }))
  };
});

vi.mock('../../src/server.js', () => {
  return {
    createServer: vi.fn().mockImplementation(() => ({
      server: {
        connect: vi.fn().mockResolvedValue(undefined),
        close: vi.fn().mockResolvedValue(undefined),
        notification: vi.fn().mockResolvedValue(undefined),
        onclose: null
      },
      cleanup: vi.fn().mockResolvedValue(undefined),
      notificationService: {
        sendMessage: vi.fn().mockResolvedValue(undefined)
      }
    }))
  };
});

vi.mock('node:crypto', () => {
  return {
    randomUUID: vi.fn().mockReturnValue('test-uuid')
  };
});

describe('HTTP Transport', () => {
  const originalConsoleError = console.error;
  
  beforeEach(() => {
    vi.resetAllMocks();
    // Mock console.error to avoid cluttering test output
    console.error = vi.fn();
  });
  
  afterEach(() => {
    // Restore console.error
    console.error = originalConsoleError;
  });

  it('should create HTTP transport and handle POST requests', async () => {
    // Import the HTTP module
    const httpModule = await import('../../src/http.js');
    
    // Access the express app from the module
    const app = express();
    
    // Simulate a POST request
    const req = {
      headers: {},
      body: { jsonrpc: '2.0', method: 'test', params: {} }
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      end: vi.fn()
    };
    
    // Call the POST handler manually (since we can't directly access it)
    const postHandler = app.post.mock.calls.find(call => call[0] === '/mcp')?.[1];
    expect(postHandler).toBeDefined();
    
    if (postHandler) {
      await postHandler(req, res);
      expect(StreamableHTTPServerTransport).toHaveBeenCalled();
    }
  });
  
  it('should reuse existing transport for the same session', async () => {
    // Import the HTTP module
    const httpModule = await import('../../src/http.js');
    
    // Access the express app from the module
    const app = express();
    
    // Simulate a POST request with existing session ID
    const req = {
      headers: { 'mcp-session-id': 'test-session-id' },
      body: { jsonrpc: '2.0', method: 'test', params: {} }
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      end: vi.fn()
    };
    
    // Call the POST handler manually
    const postHandler = app.post.mock.calls.find(call => call[0] === '/mcp')?.[1];
    
    if (postHandler) {
      // First call to create the transport
      await postHandler(req, res);
      
      // Reset mocks to check reuse
      vi.clearAllMocks();
      
      // Second call should reuse
      await postHandler(req, res);
      
      // StreamableHTTPServerTransport should not be called again
      expect(StreamableHTTPServerTransport).not.toHaveBeenCalled();
    }
  });
});

describe('SSE Transport', () => {
  const originalConsoleError = console.error;
  
  beforeEach(() => {
    vi.resetAllMocks();
    // Mock console.error to avoid cluttering test output
    console.error = vi.fn();
  });
  
  afterEach(() => {
    // Restore console.error
    console.error = originalConsoleError;
  });

  it('should create SSE transport and handle GET requests', async () => {
    // Import the SSE module
    const sseModule = await import('../../src/sse-new.js');
    
    // Access the express app from the module
    const app = express();
    
    // Simulate a GET request
    const req = { query: {} };
    const res = {
      setHeader: vi.fn(),
      writeHead: vi.fn(),
      write: vi.fn(),
      flush: vi.fn(),
      on: vi.fn()
    };
    
    // Call the GET handler manually
    const getHandler = app.get.mock.calls.find(call => call[0] === '/sse')?.[1];
    expect(getHandler).toBeDefined();
    
    if (getHandler) {
      await getHandler(req, res);
      expect(SSEServerTransport).toHaveBeenCalled();
    }
  });
  
  it('should handle POST messages correctly', async () => {
    // Import the SSE module
    const sseModule = await import('../../src/sse-new.js');
    
    // Access the express app from the module
    const app = express();
    
    // Create a mock transport first via GET
    const getHandler = app.get.mock.calls.find(call => call[0] === '/sse')?.[1];
    if (getHandler) {
      await getHandler({ query: {} }, {
        setHeader: vi.fn(),
        writeHead: vi.fn(),
        write: vi.fn(),
        flush: vi.fn(),
        on: vi.fn()
      });
    }
    
    // Now test POST handling
    const req = { query: { sessionId: 'test-session-id' } };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    
    const postHandler = app.post.mock.calls.find(call => call[0] === '/message')?.[1];
    expect(postHandler).toBeDefined();
    
    if (postHandler) {
      await postHandler(req, res);
      // Verify handlePostMessage was called on the transport
      const mockSSETransport = SSEServerTransport.mock.results[0].value;
      expect(mockSSETransport.handlePostMessage).toHaveBeenCalled();
    }
  });
});

describe('STDIO Transport', () => {
  const originalConsoleError = console.error;
  const originalProcessOn = process.on;
  
  beforeEach(() => {
    vi.resetAllMocks();
    // Mock console.error to avoid cluttering test output
    console.error = vi.fn();
    // Mock process.on
    process.on = vi.fn();
  });
  
  afterEach(() => {
    // Restore console.error and process.on
    console.error = originalConsoleError;
    process.on = originalProcessOn;
  });

  it('should create STDIO transport and setup signal handler', async () => {
    // Temporarily redefine main to capture it
    let capturedMain;
    
    // Import STDIO module with mocked main
    const stdioModule = await import('../../src/stdio-simple.js');
    
    // Check if StdioServerTransport was created in the main function
    expect(StdioServerTransport).toHaveBeenCalled();
    
    // Check if process.on was called for SIGINT
    expect(process.on).toHaveBeenCalledWith('SIGINT', expect.any(Function));
    
    // Test the SIGINT handler
    const sigintHandler = process.on.mock.calls.find(call => call[0] === 'SIGINT')?.[1];
    
    if (sigintHandler) {
      // Mock process.exit to prevent actual exit
      const originalProcessExit = process.exit;
      process.exit = vi.fn();
      
      // Execute the handler
      await sigintHandler();
      
      // Verify cleanup was called
      const { createServer } = await import('../../src/server.js');
      const mockServer = createServer.mock.results[0].value.server;
      expect(mockServer.close).toHaveBeenCalled();
      
      // Restore process.exit
      process.exit = originalProcessExit;
    }
  });
});
