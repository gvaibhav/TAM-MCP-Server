/**
 * Jest setup file for TAM MCP Server tests
 * Global test configuration and utilities
 */

// Increase timeout for integration and e2e tests
jest.setTimeout(30000);

// Global test utilities
global.testUtils = {
  // Add any global test utilities here
};

// Setup console logging for tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Suppress expected error messages in tests
console.error = (...args) => {
  const message = args.join(' ');
  
  // Suppress known test-related errors that are expected
  if (
    message.includes('ECONNREFUSED') ||
    message.includes('socket hang up') ||
    message.includes('connect ECONNREFUSED')
  ) {
    return;
  }
  
  originalConsoleError.apply(console, args);
};

console.warn = (...args) => {
  const message = args.join(' ');
  
  // Suppress known test-related warnings
  if (
    message.includes('ExperimentalWarning') ||
    message.includes('--experimental-modules')
  ) {
    return;
  }
  
  originalConsoleWarn.apply(console, args);
};

// Cleanup function for after all tests
afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Global error handler for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Reduce logging noise during tests
