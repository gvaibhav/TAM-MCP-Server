import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createServer } from '../../src/server.js';

describe('Resource Integration Tests', () => {
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

  describe('End-to-End Resource Flow', () => {
    it('should complete full resource discovery and read workflow', async () => {
      // Step 1: List resources using direct handler access
      const listRequest = {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'resources/list',
        params: {}
      };

      const listHandler = server._requestHandlers.get('resources/list');
      expect(listHandler).toBeDefined();
      
      const listResponse: any = await listHandler(listRequest);
      expect(listResponse.resources).toHaveLength(6);

      // Step 2: Read each discovered resource
      const readHandler = server._requestHandlers.get('resources/read');
      expect(readHandler).toBeDefined();

      for (const resource of listResponse.resources) {
        const readRequest = {
          jsonrpc: '2.0' as const,
          id: 2,
          method: 'resources/read',
          params: {
            uri: resource.uri
          }
        };

        const readResponse: any = await readHandler(readRequest);
        
        expect(readResponse.contents).toHaveLength(1);
        expect(readResponse.contents[0].uri).toBe(resource.uri);
        expect(readResponse.contents[0].mimeType).toBe('text/markdown');
        expect(readResponse.contents[0].text).toBeTruthy();
      }
    });

    it('should handle concurrent resource reads', async () => {
      const uris = ['tam://readme', 'tam://contributing', 'tam://release-notes'];
      
      const readHandler = server._requestHandlers.get('resources/read');
      expect(readHandler).toBeDefined();

      const readPromises = uris.map(uri => {
        const request = {
          jsonrpc: '2.0' as const,
          id: Math.random(),
          method: 'resources/read',
          params: { uri }
        };
        return readHandler(request);
      });

      const responses = await Promise.all(readPromises);
      
      expect(responses).toHaveLength(3);
      responses.forEach((response: any, index) => {
        expect(response.contents[0].uri).toBe(uris[index]);
        expect(response.contents[0].text).toBeTruthy();
      });
    });
  });

  describe('Resource Content Validation', () => {
    it('should return valid markdown content for all resources', async () => {
      const readHandler = server._requestHandlers.get('resources/read');
      expect(readHandler).toBeDefined();

      const uris = ['tam://readme', 'tam://contributing', 'tam://release-notes'];
      
      for (const uri of uris) {
        const request = {
          jsonrpc: '2.0' as const,
          id: 1,
          method: 'resources/read',
          params: { uri }
        };

        const response: any = await readHandler(request);
        
        expect(response.contents[0].text).toContain('#'); // Should contain markdown headers
        expect(response.contents[0].text.length).toBeGreaterThan(10); // Should have some content
      }
    });

    it('should maintain consistent URI scheme across resources', async () => {
      const listHandler = server._requestHandlers.get('resources/list');
      const listResponse: any = await listHandler({
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'resources/list',
        params: {}
      });

      for (const resource of listResponse.resources) {
        expect(resource.uri).toMatch(/^tam:\/\//);
      }
    });
  });

  describe('Resource Metadata Consistency', () => {
    it('should maintain consistent resource metadata between list and read', async () => {
      // List resources
      const listHandler = server._requestHandlers.get('resources/list');
      const listResponse: any = await listHandler({
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'resources/list',
        params: {}
      });
      
      const readHandler = server._requestHandlers.get('resources/read');
      
      // Read each resource and verify metadata consistency
      for (const resource of listResponse.resources) {
        const readRequest = {
          jsonrpc: '2.0' as const,
          id: 2,
          method: 'resources/read',
          params: {
            uri: resource.uri
          }
        };

        const readResponse: any = await readHandler(readRequest);
        
        expect(readResponse.contents[0].uri).toBe(resource.uri);
        expect(readResponse.contents[0].mimeType).toBe(resource.mimeType);
      }
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle malformed URIs gracefully', async () => {
      const readHandler = server._requestHandlers.get('resources/read');
      expect(readHandler).toBeDefined();

      const malformedUris = [
        'invalid://uri',
        'tam://nonexistent',
        'tam://readme/extra/path'
      ];

      for (const uri of malformedUris) {
        const request = {
          jsonrpc: '2.0' as const,
          id: 1,
          method: 'resources/read',
          params: { uri }
        };

        await expect(readHandler(request)).rejects.toThrow();
      }
    });

    it('should validate empty or malformed requests', async () => {
      const readHandler = server._requestHandlers.get('resources/read');
      expect(readHandler).toBeDefined();

      // Empty URI test
      const emptyUriRequest = {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'resources/read',
        params: { uri: '' }
      };

      await expect(readHandler(emptyUriRequest)).rejects.toThrow();
    });
  });
});
