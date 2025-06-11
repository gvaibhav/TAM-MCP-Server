import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response } from 'express';
import request from 'supertest';
import { logger } from '../setup';

// Create comprehensive Express mock outside the vi.mock
const mockApp = {
  use: vi.fn(),
  get: vi.fn(),
  post: vi.fn(), 
  put: vi.fn(),
  delete: vi.fn(),
  listen: vi.fn((port, callback) => {
    if (callback) callback();
    return { port };
  })
};

const mockExpress = vi.fn(() => mockApp);
mockExpress.json = vi.fn(() => (req, res, next) => next());
mockExpress.urlencoded = vi.fn(() => (req, res, next) => next());
mockExpress.static = vi.fn(() => (req, res, next) => next());

// Mock express module
vi.mock('express', () => ({
  default: mockExpress
}));

// Mock server and cleanup
const mockServer = {
  connect: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined)
};

const mockCleanup = vi.fn().mockResolvedValue(undefined);

vi.mock('../../src/server.js', () => ({
  createServer: vi.fn().mockResolvedValue({
    server: mockServer,
    cleanup: mockCleanup
  })
}));

describe('HTTP Transport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.resetModules();
  });

  it('should create an HTTP transport', async () => {
    // Import the HTTP module
    await import('../../src/http.js');
    
    // Verify express was called to create app
    expect(mockExpress).toHaveBeenCalled();
    
    // Verify express middleware initialization
    expect(mockApp.use).toHaveBeenCalled();
    expect(mockExpress.json).toHaveBeenCalled();
  });

  it('should handle POST /mcp for new session initialization', async () => {
    // Import the HTTP module
    await import('../../src/http.js');
    
    // Simulate endpoint handler for POST /mcp
    const postCalls = mockApp.post.mock.calls;
    expect(postCalls.length).toBeGreaterThan(0);
    const handler = postCalls.find(call => call[0] === '/mcp');
    expect(handler).toBeDefined();
    
    // Create mock request and response
    const mockReq = {
      body: { method: 'initialize', params: {} },
      headers: { 'content-type': 'application/json' }
    };
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      setHeader: vi.fn()
    };
    
    // Execute the handler
    if (handler && handler[1]) {
      await handler[1](mockReq, mockRes);
    }
    
    // Verify response was sent
    expect(mockRes.status).toHaveBeenCalled();
  });

  it('should handle GET /mcp for SSE stream with valid session ID', async () => {
    // Import the HTTP module
    await import('../../src/http.js');
    
    // This requires reaching into the module to access the handlers
    const getCalls = mockApp.get.mock.calls;
    expect(getCalls.length).toBeGreaterThan(0);
    const handler = getCalls.find(call => call[0] === '/mcp');
    expect(handler).toBeDefined();
    
    // Create mock request and response
    const mockReq = {
      query: { sessionId: 'test-session-123' },
      headers: { accept: 'text/event-stream' }
    };
    const mockRes = {
      writeHead: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
      setHeader: vi.fn()
    };
    
    // Execute the handler
    if (handler && handler[1]) {
      await handler[1](mockReq, mockRes);
    }
    
    // Verify SSE headers were set
    expect(mockRes.setHeader).toHaveBeenCalled();
  });
});