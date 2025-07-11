# TAM MCP Server Tests

This directory contains the complete test suite for the TAM MCP Server, organized following industry best practices.

## Test Coverage

### ✅ Verified Functionality
- **MCP Protocol:** STDIO transport and JSON-RPC interface
- **Tool Functionality:** All market analysis tools verified through MCP interface
- **Integration Scripts:** Working scripts for core functionality testing
- **Data Sources:** All 8 external data source integrations tested

## Test Structure

```
tests/
├── FUNCTIONAL-TEST-COVERAGE-BIBLE.md  # Comprehensive test documentation
├── TEST-CLEANUP-STATUS.md             # Cleanup results and status
├── README.md                          # This file
├── setup.ts                          # Test setup configuration
├── run-tests.js                      # Test runner script
├── scripts/                          # Integration test scripts (10 files)
│   ├── test-simple-mcp.mjs          # ✅ Basic MCP protocol verification
│   ├── test-inspector-fix.mjs       # ✅ STDIO transport verification
│   ├── test-mcp-tool-calls.mjs      # ✅ Tool call verification (100% success)
│   ├── test-tool-validation.mjs     # ✅ Tool count and uniqueness validation
│   ├── test-comprehensive.mjs       # ✅ Comprehensive functionality test
│   ├── test-default-values.mjs      # ✅ Default values validation
│   ├── test-final-validation.mjs    # ✅ Final system validation
│   ├── test-prompts.mjs             # ✅ Prompt functionality test
│   ├── test-response-analysis.mjs   # ✅ Response structure analysis
│   └── test-semantic-validation.mjs # ✅ Semantic validation test
├── unit/                            # Unit tests (26 files)
│   ├── Core functionality tests
│   ├── Transport layer tests (HTTP, SSE, STDIO)
│   ├── Market analysis tools tests
│   ├── Notification service tests
│   ├── Resource management tests
│   └── services/                    # Service-specific tests
│       ├── cache/                   # Cache and persistence tests
│       └── dataSources/             # External API integration tests
├── integration/                     # Integration tests (8 files)
│   ├── resources.test.ts           # Resource integration
│   ├── server.test.js              # Server integration
│   ├── services/                   # Service integration tests
│   └── tools/                      # Tool integration tests
├── e2e/                            # End-to-end tests (2 files)
│   ├── notifications.test.js       # Notification workflows
│   └── transports.test.js          # Transport workflows
├── fixtures/                       # Test data and mock objects
└── utils/                          # Test utilities and helpers
```

## Test Categories

### Unit Tests (`tests/unit/`)
Tests individual functions and components in isolation without external dependencies.

- **Purpose**: Validate core business logic and tool functionality
- **Scope**: Individual tools, data providers, utilities
- **Dependencies**: Minimal - mostly internal modules
- **Speed**: Fast (< 100ms per test)

**Coverage includes:**
- Tool definitions and schemas validation
- Industry search functionality
- Market size calculations
- TAM calculator logic
- Competitor analysis
- Error handling and edge cases

### Integration Tests (`tests/integration/`)
Tests component interactions and MCP protocol compliance.

- **Purpose**: Validate server initialization and protocol adherence
- **Scope**: Server setup, MCP request/response handling, notifications
- **Dependencies**: Full server stack without transport layer
- **Speed**: Medium (100ms - 1s per test)

**Coverage includes:**
- Server initialization and cleanup
- MCP protocol method handling
- Tool registration and discovery
- Notification system integration
- Request validation and error handling
- External API integration with both success and error scenarios
- Service error handling and recovery mechanisms

### End-to-End Tests (`tests/e2e/`)
Tests complete workflows through real transport connections.

- **Purpose**: Validate entire system functionality from client perspective
- **Scope**: Full system including HTTP/SSE transports
- **Dependencies**: Running server instances, network connections
- **Speed**: Slower (1s+ per test)

**Coverage includes:**
- HTTP and SSE transport connectivity
- Real-time notification delivery
- Complete request/response cycles
- Health check endpoints
- Connection error handling

## Running Tests

### Using npm scripts (recommended):

```bash
# Run all tests
npm test

# Run specific test categories
npm run test:unit
npm run test:integration
npm run test:e2e

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run tests in CI mode
npm run test:ci

# Debug test issues
npm run test:debug
```

### Using the test runner directly:

```bash
# Run all tests
node tests/run-tests.js

# Run specific categories
node tests/run-tests.js unit
node tests/run-tests.js integration
node tests/run-tests.js e2e

# With options
node tests/run-tests.js unit --watch
node tests/run-tests.js e2e --coverage
node tests/run-tests.js all --debug
```

### Using Jest directly:

```bash
# Run all tests
npx jest

# Run specific test files
npx jest tests/unit/tools.test.js
npx jest tests/e2e/

# With options
npx jest --watch
npx jest --coverage
npx jest --detectOpenHandles
```

## Test Configuration

### Jest Configuration (`jest.config.json`)
- ES Module support for TypeScript/JavaScript
- 30-second timeout for integration/e2e tests
- Coverage reporting with HTML and LCOV formats
- Test path patterns and ignore rules

### Global Setup (`tests/utils/jest-setup.js`)
- Console error suppression for expected test errors
- Environment variable configuration
- Global timeout settings
- Unhandled rejection monitoring

## Test Utilities (`tests/utils/test-helpers.js`)

### Available Utilities:

- **`createMCPRequest(method, params, id)`** - Create properly formatted MCP requests
- **`createToolCallRequest(toolName, args, id)`** - Create tool call requests
- **`makeHttpRequest(port, path, data, method)`** - Make HTTP requests to test servers
- **`isServerRunning(port)`** - Check if server is running on port
- **`waitForServer(port, maxAttempts, delay)`** - Wait for server to be ready
- **`MockNotificationHandler`** - Mock notification handling for tests
- **`validateMCPResponse(response)`** - Validate MCP response structure
- **`TestDataGenerator`** - Generate random test data
- **`PerformanceTracker`** - Track test performance metrics

## Test Data (`tests/fixtures/sample-data.js`)

Centralized test data including:
- Sample industries and market segments
- Market size data for different regions
- TAM calculation examples
- Notification message templates
- MCP request/response examples

## Best Practices

### Writing Tests
1. **Use descriptive test names** that explain what is being tested
2. **Follow AAA pattern** (Arrange, Act, Assert)
3. **Test one thing at a time** in each test case
4. **Use proper mocking** for external dependencies
5. **Clean up resources** in afterEach/afterAll hooks

### Test Organization
1. **Group related tests** using describe blocks
2. **Use beforeAll/afterAll** for expensive setup/teardown
3. **Keep tests independent** - no shared state between tests
4. **Use fixtures** for consistent test data
5. **Mock external services** to avoid flaky tests

### Performance
1. **Unit tests should be fast** (< 100ms)
2. **Limit expensive operations** in beforeEach hooks
3. **Use proper timeouts** for async operations
4. **Clean up resources** to prevent memory leaks
5. **Run tests in parallel** when possible

## Debugging Tests

### Common Issues:
- **Timeout errors**: Increase Jest timeout or check for hanging promises
- **Connection refused**: Ensure test servers are properly started/stopped
- **Memory leaks**: Check for unclosed resources in cleanup hooks
- **Flaky tests**: Add proper wait conditions and error handling

### Debug Commands:
```bash
# Run with debug output
npm run test:debug

# Run single test file
npx jest tests/unit/tools.test.js --verbose

# Run with coverage to identify untested code
npm run test:coverage
```

## Continuous Integration

The test suite is designed to run in CI environments with:
- Deterministic test execution
- Proper cleanup and resource management
- Coverage reporting
- Exit code handling for build systems

Use `npm run test:ci` for CI environments, which includes:
- No watch mode
- Coverage reporting
- Appropriate timeouts
- Process cleanup

## Contributing

When adding new tests:
1. Choose the appropriate test category (unit/integration/e2e)
2. Follow existing naming conventions
3. Use test utilities from `tests/utils/test-helpers.js`
4. Add test data to `tests/fixtures/sample-data.js` if needed
5. Update this README if adding new test utilities or patterns
