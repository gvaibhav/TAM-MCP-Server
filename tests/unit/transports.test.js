import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";

// Mock MCP SDK components
vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: vi.fn().mockImplementation(() => ({
    send: vi.fn().mockResolvedValue(undefined),
    receive: vi.fn().mockResolvedValue({ id: '123', jsonrpc: '2.0', method: 'test', params: {} }),
    on: vi.fn(),
    close: vi.fn().mockResolvedValue(undefined)
  }))
}));

vi.mock('@modelcontextprotocol/sdk/server/sse.js', () => ({
  SSEServerTransport: vi.fn().mockImplementation(() => ({
    sessionId: 'test-session-id',
    send: vi.fn().mockResolvedValue(undefined),
    receive: vi.fn().mockResolvedValue({ id: '123', jsonrpc: '2.0', method: 'test', params: {} }),
    on: vi.fn(),
    close: vi.fn().mockResolvedValue(undefined)
  }))
}));

vi.mock('@modelcontextprotocol/sdk/server/streamableHttp.js', () => ({
  StreamableHTTPServerTransport: vi.fn().mockImplementation(() => ({
    sessionId: 'test-session-id',
    send: vi.fn().mockResolvedValue(undefined),
    receive: vi.fn().mockResolvedValue({ id: '123', jsonrpc: '2.0', method: 'test', params: {} }),
    on: vi.fn(),
    close: vi.fn().mockResolvedValue(undefined)
  }))
}));

vi.mock('express', () => {
  const jsonMiddleware = vi.fn();
  const mockExpress = vi.fn().mockReturnValue({
    use: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    listen: vi.fn().mockReturnValue({
      on: vi.fn(),
      close: vi.fn()
    })
  });
  mockExpress.json = vi.fn().mockReturnValue(jsonMiddleware);
  return {
    default: mockExpress
  };
});

vi.mock('@modelcontextprotocol/sdk/examples/shared/inMemoryEventStore.js', () => ({
  InMemoryEventStore: vi.fn().mockImplementation(() => ({
    add: vi.fn(),
    get: vi.fn(),
    getAll: vi.fn()
  }))
}));

vi.mock('../../src/server.js', () => ({
  createServer: vi.fn().mockResolvedValue({
    server: {
      connect: vi.fn().mockResolvedValue(undefined),
      notification: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined)
    },
    cleanup: vi.fn().mockResolvedValue(undefined),
    notificationService: {
      sendMessage: vi.fn().mockResolvedValue(undefined)
    }
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
      // Import the module to test the initialization
      const stdioModule = await import('../../src/stdio-simple.js');
      
      // Verify console output
      expect(console.error).toHaveBeenCalledWith('Starting TAM MCP Server (STDIO transport)...');
      
      // Verify process listeners were set up
      expect(process.on).toHaveBeenCalledWith('SIGINT', expect.any(Function));
    });
  });
  
  describe('SSEServerTransport', () => {
    it('should initialize an SSE transport with session management', async () => {
      // Import the module to test the initialization
      const sseModule = await import('../../src/sse-new.js');
      
      // Verify console output
      expect(console.error).toHaveBeenCalledWith('Starting TAM MCP Server (SSE transport)...');
      
      // Find the GET route handler and extract it
      const expressMock = (await import('express')).default;
      expect(expressMock().get).toHaveBeenCalledWith('/sse', expect.any(Function));
    });
  });

  describe('StreamableHTTPServerTransport', () => {
    it('should initialize an HTTP transport with session management', async () => {
      // Import the module to test the initialization
      const httpModule = await import('../../src/http.js');
      
      // Verify console output
      expect(console.error).toHaveBeenCalledWith('Starting TAM MCP Server (Streamable HTTP transport)...');
      
      // Find the POST route handler and extract it
      const expressMock = (await import('express')).default;
      expect(expressMock().post).toHaveBeenCalledWith('/mcp', expect.any(Function));
    });
  });
});
