# Integration Test Scripts

This directory contains standalone integration test scripts that validate the TAM MCP Server functionality with real API connections and transport protocols.

## 📋 Available Scripts

### `test-comprehensive-integration.mjs`
**Purpose**: Complete backend integration testing with all 8 data sources and 11 market analysis tools.

**Features**:
- Tests all backend API integrations with actual API keys
- Validates all 11 market analysis tools with realistic parameters
- Comprehensive error handling and response validation
- Real-time status reporting with colored output

**Usage**:
```bash
node tests/scripts/test-comprehensive-integration.mjs
```

**Expected Output**: 22/22 tests passing with 100% success rate

---

### `test-http-streaming.mjs`
**Purpose**: HTTP Streamable transport testing with Server-Sent Events validation.

**Features**:
- Tests HTTP MCP endpoint initialization and session management
- Validates Server-Sent Events (SSE) response handling
- Tests all 11 tools through HTTP transport
- Session persistence and cleanup validation

**Usage**:
```bash
# Ensure HTTP server is running first
npm run start:http
# Then run the test
node tests/scripts/test-http-streaming.mjs
```

**Expected Output**: 14/14 tests passing with SSE responses confirmed

---

### `test-simple-mcp.mjs`
**Purpose**: Basic MCP functionality verification and health checks.

**Features**:
- Simple MCP protocol compliance testing
- Tool discovery and basic tool execution
- Health check validation
- Quick smoke test for development

**Usage**:
```bash
node tests/scripts/test-simple-mcp.mjs
```

**Expected Output**: Basic MCP operations verified successfully

---

### `test-mcp-tool-calls.mjs`
**Purpose**: Individual tool execution validation with parameter testing.

**Features**:
- Tests each tool individually with various parameter combinations
- Parameter validation and error handling
- Response format verification
- Tool-specific edge case testing

**Usage**:
```bash
node tests/scripts/test-mcp-tool-calls.mjs
```

**Expected Output**: All tool calls executed with proper validation

---

### `test-inspector-fix.mjs`
**Purpose**: MCP Inspector integration verification.

**Features**:
- Tests compatibility with MCP Inspector tool
- JSON-RPC communication validation
- STDIO transport clean output verification
- Inspector connection health check

**Usage**:
```bash
node tests/scripts/test-inspector-fix.mjs
```

**Expected Output**: Inspector compatibility confirmed

## 🚀 Running All Integration Tests

To run all integration tests in sequence:

```bash
# Run comprehensive backend integration
node tests/scripts/test-comprehensive-integration.mjs

# Start HTTP server (if not already running)
npm run start:http &

# Run HTTP streaming tests
node tests/scripts/test-http-streaming.mjs

# Run basic MCP verification
node tests/scripts/test-simple-mcp.mjs

# Run tool-specific tests
node tests/scripts/test-mcp-tool-calls.mjs

# Test Inspector compatibility
node tests/scripts/test-inspector-fix.mjs
```

## 🔧 Prerequisites

### Environment Setup
1. **API Keys**: Ensure `.env` file is properly configured with all required API keys
2. **Dependencies**: Install all project dependencies with `npm install`
3. **Build**: Compile TypeScript with `npm run build`

### Required API Keys
```bash
# Premium APIs (for full functionality)
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
CENSUS_API_KEY=your_census_key
FRED_API_KEY=your_fred_key
NASDAQ_DATA_LINK_API_KEY=your_nasdaq_key
BLS_API_KEY=your_bls_key

# Public APIs (automatically available)
# World Bank, OECD, IMF - no keys required
```

### Server States
- **STDIO Tests**: No server startup required (uses STDIO transport)
- **HTTP Tests**: Requires HTTP server running (`npm run start:http`)

## 📊 Expected Results

### Success Indicators
- ✅ All API connections established successfully
- ✅ All tools respond with valid data structures
- ✅ HTTP sessions managed properly
- ✅ SSE responses received and parsed correctly
- ✅ Error handling works as expected

### Failure Indicators
- ❌ API key authentication failures
- ❌ Network connectivity issues
- ❌ Invalid response formats
- ❌ Session management problems
- ❌ Transport protocol errors

## 🐛 Troubleshooting

### Common Issues

**API Key Errors**:
- Verify `.env` file is in project root
- Check API key validity and quotas
- Ensure environment variables are loaded properly

**HTTP Transport Issues**:
- Confirm HTTP server is running on correct port
- Check for port conflicts (default: 3000)
- Verify Accept headers include `text/event-stream`

**Tool Execution Failures**:
- Review tool parameter validation
- Check for required vs optional parameters
- Verify data source availability

### Debug Mode
Add debugging to any script by modifying the console output level or using Node.js debugging:

```bash
# Enable detailed logging
DEBUG=* node tests/scripts/test-comprehensive-integration.mjs

# Node.js inspector
node --inspect tests/scripts/test-http-streaming.mjs
```

## 🎯 Integration with CI/CD

These scripts are designed to be run in CI/CD pipelines for comprehensive validation:

```yaml
# Example GitHub Actions step
- name: Run Integration Tests
  run: |
    npm run build
    node tests/scripts/test-comprehensive-integration.mjs
    npm run start:http &
    sleep 5
    node tests/scripts/test-http-streaming.mjs
```

## 📈 Performance Expectations

- **Comprehensive Integration**: ~30-60 seconds (depends on API response times)
- **HTTP Streaming**: ~10-20 seconds
- **Simple MCP**: ~5-10 seconds
- **Tool Calls**: ~15-30 seconds
- **Inspector Fix**: ~5 seconds

Times may vary based on network conditions and API response times.
