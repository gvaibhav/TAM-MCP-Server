// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.{test,spec}.{js,ts,mjs}'], // Keep existing include pattern
    exclude: ['tests/archive/**', 'node_modules/**', 'dist/**', 'tests/unit/transports.test.ts'], // Keep existing top-level exclude
    setupFiles: ['./tests/setup.ts'], // Keep existing setup file
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'], // Added 'lcov'
      reportsDirectory: './coverage/vitest', // Added to separate from potential Jest coverage
      include: ['src/**/*.ts'], // Explicitly include src files
      exclude: [
        'node_modules/**',
        'dist/**',
        'tests/**',
        'coverage/**',
        'src/**/*.d.ts',
        'src/types/**/*.ts',     // Added from request
        'src/index.ts',         // Added from request (covered by src/**/index.ts but more explicit)
        'src/server.ts',        // Added from request
        'src/http.ts',          // Often an entry point, similar to server.ts
        'src/sse-new.ts',       // Entry point
        'src/stdio-simple.ts',  // Entry point
        'src/config/**/*.ts',   // Added from request (use plural for consistency)
        'src/**/index.ts',      // Keep existing specific index exclusion
      ],
      all: true, // Added to report coverage for all included files
      thresholds: { // Keep existing thresholds
        global: {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95
        }
      }
    },
    testTimeout: 30000, // Keep existing
    hookTimeout: 30000  // Keep existing
    // Optional: Configure test runner options
    // reporters: ['default', 'json', { outputFile: 'test-results/vitest-report.json' }],
  },
});
