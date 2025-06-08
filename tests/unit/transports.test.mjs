// Unit tests for Transport modules using mock approach with Jest-like syntax
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '../setup';

// Create mock objects outside the describe block to avoid hoisting issues
const mockServer = {
  connect: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined)
};

const mockCleanup = vi.fn().mockResolvedValue(undefined);

// Create Express mock before other imports
const mockApp = {
  use: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  delete: vi.fn(),
  listen: vi.fn()
};

const mockExpress = vi.fn(() => mockApp);
mockExpress.json = vi.fn(() => vi.fn());

// Mock imports with proper structure
vi.mock('@modelcontextprotocol/sdk/server/stdio.js');
vi.mock('@modelcontextprotocol/sdk/server/sse.js');
vi.mock('@modelcontextprotocol/sdk/server/streamableHttp.js');
vi.mock('express', () => ({
  default: mockExpress
}));
vi.mock('@modelcontextprotocol/sdk/examples/shared/inMemoryEventStore.js');
vi.mock('../../src/server.js', () => ({
  createServer: vi.fn().mockResolvedValue({
    server: mockServer,
    cleanup: mockCleanup
  })
}));

describe('Transport Modules', () => {
  // Mock process and console
  const originalConsoleError = console.error;
  
  beforeEach(() => {
    console.error = vi.fn();
    // Mock process methods rather than replacing the object
    process.on = vi.fn();
    process.exit = vi.fn();
  });
  
  afterEach(() => {
    console.error = originalConsoleError;
    vi.resetModules();
    vi.clearAllMocks();
  });

  describe('StdioServerTransport', () => {
    it('should initialize a STDIO transport', async () => {
      // Verify console output
      expect(console.error).not.toHaveBeenCalled();
      
      // Import the module
      const stdioModule = await import('../../src/stdio-simple.js');
      
      // Verify console output
      expect(console.error).toHaveBeenCalledWith('Starting TAM MCP Server (STDIO transport)...');
    });
  });

  describe('SSEServerTransport', () => {
    it('should initialize an SSE transport with session management', async () => {
      // Import the module (should trigger initialization)
      // We're not testing the actual route handlers, just that the module initializes correctly
      const sseModule = await import('../../src/sse-new.js');
      
      // Verify console output
      expect(console.error).toHaveBeenCalledWith('Starting TAM MCP Server (SSE transport)...');
    });
  });

  describe('StreamableHTTPServerTransport', () => {
    it('should initialize an HTTP transport with session management', async () => {
      // Import the module (should trigger initialization)
      // We're not testing the actual route handlers, just that the module initializes correctly
      const httpModule = await import('../../src/http.js');
      
      // Verify console output
      expect(console.error).toHaveBeenCalledWith('Starting TAM MCP Server (Streamable HTTP transport)...');
    });
  });
});
