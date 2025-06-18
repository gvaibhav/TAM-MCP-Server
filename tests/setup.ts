// Vitest global setup
import { vi } from 'vitest';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Setup environment variables for tests
process.env.NODE_ENV = 'test';
process.env.RATE_LIMIT_REQUESTS = '100';
process.env.RATE_LIMIT_WINDOW = '60000';

// Mock fs module to prevent file system errors in tests
vi.mock('fs', () => ({
  promises: {
    access: vi.fn().mockResolvedValue(undefined),
    mkdir: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockImplementation((path: string) => {
      if (path.includes('README.md')) {
        return Promise.resolve('# Market Sizing MCP Server\n\nFeatures...');
      }
      if (path.includes('CONTRIBUTING.md')) {
        return Promise.resolve('# Contributing Guidelines\n\nWelcome...');
      }
      if (path.includes('RELEASE-NOTES.md')) {
        return Promise.resolve('# Release Notes\n\n## Version 1.0.0...');
      }
      return Promise.resolve('Mock file content');
    })
  }
}));

// Create shared logger mock object so we can reference it across different mocks
const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn()
};

// Create mock CacheManager
const mockCacheManager = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  flush: vi.fn(),
  generateKey: vi.fn().mockImplementation((prefix, params) => 
    `${prefix}-${JSON.stringify(params)}`
  ),
  stats: vi.fn().mockReturnValue({
    keys: 0,
    hits: 0,
    misses: 0,
    ksize: 0,
    vsize: 0
  }),
};

// Export the mock objects for direct use in tests
export const logger = mockLogger;
export const CacheManager = mockCacheManager;

// Mock logger and CacheManager to avoid noise in tests - handle all possible import paths
vi.mock('../../src/utils/index.js', () => ({
  logger: mockLogger,
  CacheManager: mockCacheManager,
  checkRateLimit: vi.fn().mockReturnValue(true),
  createAPIResponse: vi.fn().mockImplementation((data, type) => {
    return { 
      success: true, 
      data, 
      type,
      timestamp: new Date().toISOString() 
    };
  }),
  createErrorResponse: vi.fn().mockImplementation((message, code) => {
    return { 
      success: false, 
      error: { message, code },
      timestamp: new Date().toISOString() 
    };
  }),
  handleToolError: vi.fn().mockImplementation((error, tool) => {
    return { 
      success: false, 
      error: { 
        message: error.message || 'Unknown error', 
        code: 'TOOL_ERROR'
      },
      tool,
      timestamp: new Date().toISOString() 
    };
  }),
  validatePositiveNumber: vi.fn().mockImplementation((value, name) => {
    if (value <= 0) {
      throw new Error(`${name || 'Value'} must be greater than 0`);
    }
    return true;
  }),
  validatePercentage: vi.fn().mockImplementation((value, name) => {
    if (value < 0 || value > 1) {
      throw new Error(`${name || 'Percentage'} must be between 0 and 1`);
    }
    return true;
  }),
  validateYear: vi.fn().mockImplementation((year) => {
    if (year < 2000 || year > 2100) {
      throw new Error(`Year must be between 2000 and 2100`);
    }
    return true;
  }),
  validateCurrency: vi.fn().mockImplementation((currency) => {
    const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CNY'];
    if (!validCurrencies.includes(currency)) {
      throw new Error(`Invalid currency: ${currency}`);
    }
    return true;
  }),
  validateRegion: vi.fn().mockImplementation((region) => {
    const validRegions = ['global', 'north-america', 'europe', 'asia-pacific', 'us', 'uk', 'china'];
    if (!validRegions.includes(region)) {
      throw new Error(`Invalid region: ${region}`);
    }
    return true;
  }),
  formatCurrency: vi.fn().mockImplementation((amount) => `$${amount.toLocaleString()}`),
  formatPercentage: vi.fn().mockImplementation((value) => `${(value * 100).toFixed(2)}%`),  calculateCAGR: vi.fn().mockReturnValue(0.125),
  calculateConfidenceScore: vi.fn().mockReturnValue(0.85),
  logApiAvailabilityStatus: vi.fn().mockReturnValue(undefined),
  getToolAvailabilityStatus: vi.fn().mockReturnValue({ available: true, warnings: [], missingKeys: [] }),
  checkApiAvailability: vi.fn().mockReturnValue(new Map())
}));

vi.mock('../utils/index.js', () => ({
  logger: mockLogger,
  CacheManager: mockCacheManager,
  checkRateLimit: vi.fn().mockReturnValue(true),
  createAPIResponse: vi.fn().mockImplementation((data, type) => {
    return { success: true, data, type, timestamp: new Date().toISOString() };
  }),
  createErrorResponse: vi.fn().mockImplementation((message, code) => {
    return { success: false, error: { message, code }, timestamp: new Date().toISOString() };
  }),
  handleToolError: vi.fn().mockImplementation((error, tool) => {
    return { 
      success: false, 
      error: { message: error.message || 'Unknown error', code: 'TOOL_ERROR' },
      tool,
      timestamp: new Date().toISOString() 
    };
  }),
  logApiAvailabilityStatus: vi.fn().mockReturnValue(undefined),
  getToolAvailabilityStatus: vi.fn().mockReturnValue({ available: true, warnings: [], missingKeys: [] }),
  checkApiAvailability: vi.fn().mockReturnValue(new Map())
}));

// Path used when imported directly from notification service
vi.mock('../src/utils/index.js', () => ({
  logger: mockLogger,
  CacheManager: mockCacheManager,
  checkRateLimit: vi.fn().mockReturnValue(true),
  createAPIResponse: vi.fn().mockImplementation((data, type) => {
    return { success: true, data, type, timestamp: new Date().toISOString() };
  }),
  createErrorResponse: vi.fn().mockImplementation((message, code) => {
    return { success: false, error: { message, code }, timestamp: new Date().toISOString() };
  }),
  handleToolError: vi.fn().mockImplementation((error, tool) => {
    return { 
      success: false, 
      error: { message: error.message || 'Unknown error', code: 'TOOL_ERROR' },
      tool,
      timestamp: new Date().toISOString() 
    };
  }),
  logApiAvailabilityStatus: vi.fn().mockReturnValue(undefined),
  getToolAvailabilityStatus: vi.fn().mockReturnValue({ available: true, warnings: [], missingKeys: [] }),
  checkApiAvailability: vi.fn().mockReturnValue(new Map())
}));

// Path used for direct imports in tests
vi.mock('@/utils/index.js', () => ({
  logger: mockLogger,
  CacheManager: mockCacheManager,
  checkRateLimit: vi.fn().mockReturnValue(true),
  createAPIResponse: vi.fn().mockImplementation((data, type) => {
    return { success: true, data, type, timestamp: new Date().toISOString() };
  }),
  createErrorResponse: vi.fn().mockImplementation((message, code) => {
    return { success: false, error: { message, code }, timestamp: new Date().toISOString() };
  }),
  handleToolError: vi.fn().mockImplementation((error, tool) => {
    return { 
      success: false, 
      error: { message: error.message || 'Unknown error', code: 'TOOL_ERROR' },
      tool,
      timestamp: new Date().toISOString() 
    };
  }),
  logApiAvailabilityStatus: vi.fn().mockReturnValue(undefined),
  getToolAvailabilityStatus: vi.fn().mockReturnValue({ available: true, warnings: [], missingKeys: [] }),
  checkApiAvailability: vi.fn().mockReturnValue(new Map())
}));

// For ESM imports
vi.mock('../../src/utils/index.ts', () => ({
  logger: mockLogger,
  CacheManager: mockCacheManager,
  checkRateLimit: vi.fn().mockReturnValue(true),
  createAPIResponse: vi.fn().mockImplementation((data, type) => {
    return { success: true, data, type, timestamp: new Date().toISOString() };
  }),
  createErrorResponse: vi.fn().mockImplementation((message, code) => {
    return { success: false, error: { message, code }, timestamp: new Date().toISOString() };
  }),
  handleToolError: vi.fn().mockImplementation((error, tool) => {
    return { 
      success: false, 
      error: { message: error.message || 'Unknown error', code: 'TOOL_ERROR' },
      tool,
      timestamp: new Date().toISOString() 
    };
  }),
  logApiAvailabilityStatus: vi.fn().mockReturnValue(undefined),
  getToolAvailabilityStatus: vi.fn().mockReturnValue({ available: true, warnings: [], missingKeys: [] }),
  checkApiAvailability: vi.fn().mockReturnValue(new Map())
}));

// Provide as a module export too
export const utils = { logger: mockLogger };

// Global test timeout
vi.setConfig({
  testTimeout: 30000
});
