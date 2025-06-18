/**
 * Test utilities for TAM MCP Server tests
 * Common helpers and setup functions for all test categories
 */

import { randomUUID } from 'crypto';
import http from 'http';

/**
 * Create a test MCP request with proper structure
 */
export function createMCPRequest(method, params = {}, id = null) {
  return {
    jsonrpc: "2.0",
    id: id || randomUUID(),
    method,
    params
  };
}

/**
 * Create test tool call request
 */
export function createToolCallRequest(toolName, args, id = null) {
  return createMCPRequest('tools/call', {
    name: toolName,
    arguments: args
  }, id);
}

/**
 * Wait for a specified amount of time
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Make HTTP request to test server
 */
export function makeHttpRequest(port, path, data, method = 'POST') {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'localhost',
      port,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Check if server is running on specified port
 */
export function isServerRunning(port) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port,
      path: '/health',
      method: 'GET',
      timeout: 2000
    };

    const req = http.request(options, (res) => {
      resolve(res.statusCode === 200);
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
}

/**
 * Wait for server to be ready
 */
export async function waitForServer(port, maxAttempts = 10, delay = 1000) {
  for (let i = 0; i < maxAttempts; i++) {
    if (await isServerRunning(port)) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  return false;
}

/**
 * Mock notification handler for testing
 */
export class MockNotificationHandler {
  constructor() {
    this.notifications = [];
  }

  handleNotification(notification) {
    this.notifications.push({
      ...notification,
      timestamp: new Date().toISOString()
    });
  }

  getNotifications() {
    return [...this.notifications];
  }

  getNotificationsByType(type) {
    return this.notifications.filter(n => n.method === type);
  }

  clearNotifications() {
    this.notifications = [];
  }

  getLatestNotification() {
    return this.notifications[this.notifications.length - 1];
  }
}

/**
 * Validate MCP response structure
 */
export function validateMCPResponse(response) {
  const errors = [];

  if (!response.hasOwnProperty('jsonrpc')) {
    errors.push('Missing jsonrpc field');
  } else if (response.jsonrpc !== '2.0') {
    errors.push('Invalid jsonrpc version');
  }

  if (!response.hasOwnProperty('id')) {
    errors.push('Missing id field');
  }

  if (response.hasOwnProperty('error')) {
    if (!response.error.hasOwnProperty('code')) {
      errors.push('Error missing code field');
    }
    if (!response.error.hasOwnProperty('message')) {
      errors.push('Error missing message field');
    }
  } else if (!response.hasOwnProperty('result')) {
    errors.push('Response missing both result and error fields');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Generate test data for various scenarios
 */
export const TestDataGenerator = {
  /**
   * Generate random industry name
   */
  randomIndustry() {
    const industries = [
      'Software as a Service (SaaS)',
      'E-commerce',
      'Healthcare Technology',
      'Financial Technology',
      'Cloud Computing',
      'Artificial Intelligence',
      'Cybersecurity',
      'Gaming',
      'EdTech',
      'PropTech'
    ];
    return industries[Math.floor(Math.random() * industries.length)];
  },

  /**
   * Generate random region
   */
  randomRegion() {
    const regions = [
      'North America',
      'Europe',
      'Asia Pacific',
      'Latin America',
      'Middle East & Africa',
      'Global'
    ];
    return regions[Math.floor(Math.random() * regions.length)];
  },

  /**
   * Generate random market size
   */
  randomMarketSize() {
    const sizes = ['50M', '100M', '500M', '1B', '5B', '10B', '50B', '100B'];
    return sizes[Math.floor(Math.random() * sizes.length)];
  },

  /**
   * Generate random year
   */
  randomYear() {
    const currentYear = new Date().getFullYear();
    return (currentYear + Math.floor(Math.random() * 6)).toString(); // Current year to +5 years
  }
};

/**
 * Performance testing utilities
 */
export class PerformanceTracker {
  constructor() {
    this.measurements = [];
  }

  start(label) {
    const startTime = process.hrtime.bigint();
    return {
      end: () => {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
        this.measurements.push({
          label,
          duration,
          timestamp: new Date().toISOString()
        });
        return duration;
      }
    };
  }

  getMeasurements() {
    return [...this.measurements];
  }

  getAverageDuration(label) {
    const filtered = this.measurements.filter(m => m.label === label);
    if (filtered.length === 0) return 0;
    return filtered.reduce((sum, m) => sum + m.duration, 0) / filtered.length;
  }

  clear() {
    this.measurements = [];
  }
}
