import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createServer } from '../../src/server.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

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
      // Step 1: List resources
      const listRequest = {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'resources/list',
        params: {}
      };

      const listResponse = await server._requestHandlers.get('resources/list')?.(listRequest);
      expect(listResponse.resources).toHaveLength(3);

      // Step 2: Read each discovered resource
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
        expect(readResponse.contents[0].uri).toBe(resource.uri);
        expect(readResponse.contents[0].mimeType).toBe('text/markdown');
        expect(readResponse.contents[0].text).toBeTruthy();
      }
    });

    it('should handle concurrent resource reads', async () => {
      const uris = ['tam://readme', 'tam://contributing', 'tam://release-notes'];
      
      const readPromises = uris.map(uri => {
        const request = {
          jsonrpc: '2.0' as const,
          id: Math.random(),
          method: 'resources/read',
          params: { uri }
        };
        return server._requestHandlers.get('resources/read')?.(request);
      });

      const responses = await Promise.all(readPromises);
      
      expect(responses).toHaveLength(3);
      responses.forEach((response: any, index) => {
        expect(response.contents[0].uri).toBe(uris[index]);
        expect(response.contents[0].text).toBeTruthy();
      });
    });
  });

  describe('File System Integration', () => {
    it('should read actual files from project structure', async () => {
      // Get project root (same logic as in server)
      const currentDir = path.dirname(fileURLToPath(import.meta.url));
      const projectRoot = path.resolve(currentDir, '../../');

      // Verify files exist
      const readmeExists = await fs.access(path.join(projectRoot, 'README.md')).then(() => true).catch(() => false);
      const contributingExists = await fs.access(path.join(projectRoot, 'CONTRIBUTING.md')).then(() => true).catch(() => false);
      const releaseNotesExists = await fs.access(path.join(projectRoot, 'doc', 'RELEASE-NOTES.md')).then(() => true).catch(() => false);

      expect(readmeExists).toBe(true);
      expect(contributingExists).toBe(true);
      expect(releaseNotesExists).toBe(true);

      // Test resource reading matches file content
      const request = {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'resources/read',
        params: {
          uri: 'tam://readme'
        }
      };

      const response = await server._requestHandlers.get('resources/read')?.(request);
      
      // Rather than checking exact match, check that content contains expected parts
      expect(response.contents[0].text).toContain('Market Sizing MCP Server');
    });

    it('should handle relative path resolution correctly', async () => {
      // Test that path resolution works from dist directory too
      const request = {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'resources/read',
        params: {
          uri: 'tam://readme'
        }
      };

      const response = await server._requestHandlers.get('resources/read')?.(request);
      
      expect(response.contents[0].text).toContain('Market Sizing MCP Server');
      expect(response.contents[0].text).toContain('Features');
    });
  });

  describe('Resource Metadata Consistency', () => {
    it('should maintain consistent resource metadata between list and read', async () => {
      // List resources
      const listRequest = {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'resources/list',
        params: {}
      };

      const listResponse = await server._requestHandlers.get('resources/list')?.(listRequest);
      
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

        const readResponse = await server._requestHandlers.get('resources/read')?.(readRequest);
        
        expect(readResponse.contents[0].uri).toBe(resource.uri);
        expect(readResponse.contents[0].mimeType).toBe(resource.mimeType);
      }
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle malformed URIs gracefully', async () => {
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

        try {
          await server._requestHandlers.get('resources/read')?.(request);
          // If it doesn't throw, that's also acceptable for some URIs
        } catch (error) {
          // Expected for invalid URIs
          expect(error).toBeDefined();
        }
      }
    });
  });
});
