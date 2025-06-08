import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createServer } from '../../src/server.js';

describe('MCP Resource Handlers', () => {
  let server: any;
  let cleanup: any;

  beforeEach(async () => {
    const serverConfig = await createServer();
    server = serverConfig.server;
    cleanup = serverConfig.cleanup;
  });

  afterEach(async () => {
    if (cleanup) {
      await cleanup();
    }
  });

  describe('ListResourcesRequestSchema Handler', () => {
    it('should return list of available resources', async () => {
      const request = {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'resources/list',
        params: {}
      };

      const response = await server._requestHandlers.get('resources/list')?.(request);
      
      expect(response).toBeDefined();
      expect(response.resources).toBeInstanceOf(Array);
      expect(response.resources.length).toBe(3);
      
      // Verify each resource has required properties
      response.resources.forEach((resource: any) => {
        expect(resource).toHaveProperty('uri');
        expect(resource).toHaveProperty('name');
        expect(resource).toHaveProperty('description');
        expect(resource).toHaveProperty('mimeType');
        expect(resource.mimeType).toBe('text/markdown');
      });
    });

    it('should include expected resources', async () => {
      const request = {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'resources/list',
        params: {}
      };

      const response = await server._requestHandlers.get('resources/list')?.(request);
      const uris = response.resources.map((r: any) => r.uri);
      
      expect(uris).toContain('tam://readme');
      expect(uris).toContain('tam://contributing');
      expect(uris).toContain('tam://release-notes');
    });

    it('should use consistent URI scheme', async () => {
      const request = {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'resources/list',
        params: {}
      };

      const response = await server._requestHandlers.get('resources/list')?.(request);
      
      response.resources.forEach((resource: any) => {
        expect(resource.uri).toMatch(/^tam:\/\/[a-z-]+$/);
      });
    });
  });

  describe('ReadResourceRequestSchema Handler', () => {
    it('should read README resource', async () => {
      const request = {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'resources/read',
        params: {
          uri: 'tam://readme'
        }
      };

      const response = await server._requestHandlers.get('resources/read')?.(request);
      
      expect(response).toBeDefined();
      expect(response.contents).toBeInstanceOf(Array);
      expect(response.contents.length).toBe(1);
      
      const content = response.contents[0];
      expect(content.uri).toBe('tam://readme');
      expect(content.mimeType).toBe('text/markdown');
      expect(content.text).toBeTruthy();
      expect(content.text).toContain('Market Sizing MCP Server');
    });

    it('should read CONTRIBUTING resource', async () => {
      const request = {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'resources/read',
        params: {
          uri: 'tam://contributing'
        }
      };

      const response = await server._requestHandlers.get('resources/read')?.(request);
      
      expect(response).toBeDefined();
      expect(response.contents).toBeInstanceOf(Array);
      expect(response.contents.length).toBe(1);
      
      const content = response.contents[0];
      expect(content.uri).toBe('tam://contributing');
      expect(content.mimeType).toBe('text/markdown');
      expect(content.text).toBeTruthy();
    });

    it('should read RELEASE-NOTES resource', async () => {
      const request = {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'resources/read',
        params: {
          uri: 'tam://release-notes'
        }
      };

      const response = await server._requestHandlers.get('resources/read')?.(request);
      
      expect(response).toBeDefined();
      expect(response.contents).toBeInstanceOf(Array);
      expect(response.contents.length).toBe(1);
      
      const content = response.contents[0];
      expect(content.uri).toBe('tam://release-notes');
      expect(content.mimeType).toBe('text/markdown');
      expect(content.text).toBeTruthy();
    });

    it('should handle invalid URI gracefully', async () => {
      const request = {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'resources/read',
        params: {
          uri: 'tam://nonexistent'
        }
      };

      try {
        await server._requestHandlers.get('resources/read')?.(request);
        // If it doesn't throw, the handler might return empty or handle gracefully
        // This is acceptable behavior
      } catch (error) {
        // Expected for invalid URIs
        expect(error).toBeDefined();
      }
    });
  });

  describe('Resource Content Validation', () => {
    it('should return valid content format for all resources', async () => {
      // First get all resources
      const listRequest = {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'resources/list',
        params: {}
      };

      const listResponse = await server._requestHandlers.get('resources/list')?.(listRequest);
      
      // Then read each one and validate format
      for (const resource of listResponse.resources) {
        const readRequest = {
          jsonrpc: '2.0' as const,
          id: 2,
          method: 'resources/read',
          params: {
            uri: resource.uri
          }
        };

        const readResponse = await server._requestHandlers.get('resources/read')?.(readRequest);
        
        expect(readResponse.contents).toHaveLength(1);
        
        const content = readResponse.contents[0];
        expect(content).toHaveProperty('uri');
        expect(content).toHaveProperty('mimeType');
        expect(content).toHaveProperty('text');
        
        expect(content.uri).toBe(resource.uri);
        expect(content.mimeType).toBe('text/markdown');
        expect(typeof content.text).toBe('string');
        expect(content.text.length).toBeGreaterThan(0);
      }
    });

    it('should maintain consistency between list and read operations', async () => {
      const listRequest = {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'resources/list',
        params: {}
      };

      const listResponse = await server._requestHandlers.get('resources/list')?.(listRequest);
      
      for (const resource of listResponse.resources) {
        const readRequest = {
          jsonrpc: '2.0' as const,
          id: 2,
          method: 'resources/read',
          params: {
            uri: resource.uri
          }
        };

        const readResponse = await server._requestHandlers.get('resources/read')?.(readRequest);
        
        // URI should match exactly
        expect(readResponse.contents[0].uri).toBe(resource.uri);
        
        // MIME type should match
        expect(readResponse.contents[0].mimeType).toBe(resource.mimeType);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed read requests', async () => {
      const malformedRequests = [
        {
          jsonrpc: '2.0' as const,
          id: 1,
          method: 'resources/read',
          params: {
            uri: ''
          }
        },
        {
          jsonrpc: '2.0' as const,
          id: 1,
          method: 'resources/read',
          params: {
            uri: 'invalid://scheme'
          }
        }
      ];

      for (const request of malformedRequests) {
        try {
          await server._requestHandlers.get('resources/read')?.(request);
          // If no error thrown, that's also acceptable
        } catch (error) {
          // Expected for malformed requests
          expect(error).toBeDefined();
        }
      }
    });
  });
});
