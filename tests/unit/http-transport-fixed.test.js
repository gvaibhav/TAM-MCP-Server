import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock process first
const mockProcess = {
  on: vi.fn(),
  exit: vi.fn(),
  env: { PORT: '3000' }
};

// Mock console.error to reduce noise
const mockConsole = {
  ...console,
  error: vi.fn()
};

describe('HTTP Server Transport', () => {
  let routeHandlers = {};

  beforeEach(async () => {
    vi.clearAllMocks();
    routeHandlers = {};
    
    // Stub globals
    vi.stubGlobal('process', mockProcess);
    vi.stubGlobal('console', mockConsole);
    
    // Mock external dependencies
    vi.doMock('@modelcontextprotocol/sdk/server/streamableHttp.js', () => ({
      StreamableHTTPServerTransport: vi.fn().mockImplementation(() => ({
        sessionId: 'test-session-id',
        handleRequest: vi.fn().mockResolvedValue(undefined),
        close: vi.fn().mockResolvedValue(undefined)
      }))
    }));

    vi.doMock('@modelcontextprotocol/sdk/examples/shared/inMemoryEventStore.js', () => ({
      InMemoryEventStore: vi.fn().mockImplementation(() => ({}))
    }));

    vi.doMock('../../src/server.js', () => ({
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

    vi.doMock('node:crypto', () => ({
      randomUUID: vi.fn().mockReturnValue('test-uuid')
    }));
    
    // Create mock app with route capture
    const mockApp = {
      use: vi.fn(),
      get: vi.fn((path, handler) => {
        routeHandlers[`GET:${path}`] = handler;
      }),
      post: vi.fn((path, handler) => {
        routeHandlers[`POST:${path}`] = handler;
      }),
      delete: vi.fn((path, handler) => {
        routeHandlers[`DELETE:${path}`] = handler;
      }),
      listen: vi.fn().mockImplementation((port, callback) => {
        if (callback) callback();
        return { 
          close: vi.fn((closeCallback) => {
            if (closeCallback) closeCallback();
          })
        };
      }),
      set: vi.fn(),
      disable: vi.fn()
    };

    // Mock express function
    const mockExpress = vi.fn().mockReturnValue(mockApp);
    mockExpress.json = vi.fn().mockReturnValue(vi.fn());
    mockExpress.urlencoded = vi.fn().mockReturnValue(vi.fn());
    mockExpress.static = vi.fn().mockReturnValue(vi.fn());

    // Apply the express mock
    vi.doMock('express', () => ({
      default: mockExpress
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('should create an express app and register routes', async () => {
    // Import the module to trigger route registration
    await import('../../src/http.ts');

    // Check if routes were captured
    expect(routeHandlers['POST:/mcp']).toBeDefined();
    expect(routeHandlers['GET:/mcp']).toBeDefined();
    expect(routeHandlers['DELETE:/mcp']).toBeDefined();
    expect(routeHandlers['GET:/health']).toBeDefined();
  });

  it('should handle POST /mcp for new session initialization', async () => {
    // Import the module to get route handlers
    await import('../../src/http.ts');
    
    const postHandler = routeHandlers['POST:/mcp'];
    expect(postHandler).toBeDefined();
    
    // Create mock request and response
    const mockReq = {
      headers: {},
      body: { id: 'test-id' }
    };
    
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      headersSent: false
    };

    // Execute the handler
    await postHandler(mockReq, mockRes);

    // Should have created transport and handled request
    expect(mockRes.status).not.toHaveBeenCalledWith(400);
  });

  it('should handle POST /mcp with existing session ID', async () => {
    // Import the module
    await import('../../src/http.ts');
    
    const postHandler = routeHandlers['POST:/mcp'];
    expect(postHandler).toBeDefined();
    
    // Create mock request with existing session ID
    const mockReq = {
      headers: { 'mcp-session-id': 'existing-session' },
      body: { id: 'test-id' }
    };
    
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      headersSent: false
    };

    // Execute the handler
    await postHandler(mockReq, mockRes);

    // Should return error for invalid session
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  it('should handle GET /mcp for SSE stream', async () => {
    // Import the module
    await import('../../src/http.ts');
    
    const getHandler = routeHandlers['GET:/mcp'];
    expect(getHandler).toBeDefined();

    const mockReq = {
      headers: { 'mcp-session-id': 'test-session' },
      body: { id: 'test-id' }
    };
    
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      headersSent: false
    };

    // Execute the handler
    await getHandler(mockReq, mockRes);

    // Should return error for invalid session
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  it('should handle DELETE /mcp for session termination', async () => {
    // Import the module
    await import('../../src/http.ts');
    
    const deleteHandler = routeHandlers['DELETE:/mcp'];
    expect(deleteHandler).toBeDefined();

    const mockReq = {
      headers: { 'mcp-session-id': 'test-session' },
      body: { id: 'test-id' }
    };
    
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      headersSent: false
    };

    // Execute the handler
    await deleteHandler(mockReq, mockRes);

    // Should return error for invalid session
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  it('should handle health check endpoint', async () => {
    // Import the module
    await import('../../src/http.ts');
    
    const healthHandler = routeHandlers['GET:/health'];
    expect(healthHandler).toBeDefined();

    const mockReq = {};
    const mockRes = {
      json: vi.fn().mockReturnThis()
    };

    // Execute the handler
    await healthHandler(mockReq, mockRes);

    // Should return health status
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'healthy',
      service: 'tam-mcp-server-http',
      version: '1.0.0',
      timestamp: expect.any(String),
      activeSessions: 0
    });
  });

  it('should handle SIGINT shutdown', async () => {
    // Import the module
    await import('../../src/http.ts');

    // Find the SIGINT handler
    const sigintCall = mockProcess.on.mock.calls.find(call => call[0] === 'SIGINT');
    expect(sigintCall).toBeDefined();
    
    const sigintHandler = sigintCall[1];

    // Test the handler doesn't throw
    await expect(sigintHandler()).resolves.not.toThrow();
    
    // Should call process.exit
    expect(mockProcess.exit).toHaveBeenCalledWith(0);
  });
});
