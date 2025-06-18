# Backend API Integration Testing Guide

This guide explains how to test that your TAM MCP Server's backend API integrations are working correctly with real external APIs.

## 🎯 Testing Strategy Overview

Your TAM MCP Server has **two types of tests**:

### 1. **Unit Tests** (Mock External APIs)
- **Location**: `tests/unit/`
- **Purpose**: Test business logic and code structure
- **Speed**: Fast (seconds)
- **Dependencies**: None - all external APIs are mocked
- **Run with**: `npm test` or `npm run test:unit`

### 2. **Integration Tests** (Real External APIs)
- **Location**: `tests/integration/services/live/`
- **Purpose**: Test real API connectivity and data flow
- **Speed**: Slower (minutes)
- **Dependencies**: Require real API keys and internet connection
- **Run with**: `npm run test:live` or `npm run test:backend-apis`

## 🔧 Setup for Integration Testing

### 1. Configure API Keys

Copy the environment template:
```bash
cp .env.example .env
```

Add your real API keys to `.env`:
```bash
# Required for testing external APIs
FRED_API_KEY=your_fred_api_key_here
BLS_API_KEY=your_bls_api_key_here
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key_here
CENSUS_API_KEY=your_census_key_here
NASDAQ_DATA_LINK_API_KEY=your_nasdaq_key_here

# Public APIs (no key required)
# - IMF (International Monetary Fund)
# - OECD 
# - World Bank
```

### 2. Get Free API Keys

Most services offer free API keys:

| Service | Free Tier | Sign Up URL |
|---------|-----------|-------------|
| FRED | 120,000 calls/day | https://fred.stlouisfed.org/docs/api/api_key.html |
| Alpha Vantage | 25 calls/day | https://www.alphavantage.co/support/#api-key |
| Census Bureau | No limit | https://api.census.gov/data/key_signup.html |
| BLS | 500 calls/day | https://www.bls.gov/developers/api_signature_v2.htm |
| NASDAQ Data Link | 50 calls/day | https://data.nasdaq.com/sign-up |


## 🔑 Getting API Keys

For step-by-step instructions on obtaining free API keys for FRED, BLS, Alpha Vantage, Census Bureau, and NASDAQ Data Link, see the [API Keys Guide](./getting-api-keys.md).


## 🚀 Running Integration Tests

### Quick Health Check
Test all APIs quickly:
```bash
npm run test:api-health
```

This will:
- ✅ Check which services are available
- 🔍 Make a simple test call to each API
- ⚠️ Show which APIs need configuration
- ❌ Report any connection issues

### Live API Integration Tests
Run comprehensive tests against real APIs:
```bash
npm run test:live
```

This runs tests in `tests/integration/services/live/` that:
- Make real HTTP requests to external APIs
- Validate response data structure
- Test error handling
- Verify caching behavior

### Full Backend API Test Suite
Run everything:
```bash
npm run test:backend-apis
```

This script:
- Tests public APIs (IMF, OECD, World Bank)
- Tests APIs with keys (if configured)
- Runs market analysis tools integration
- Tests MCP server end-to-end

### Individual Service Testing
Test specific services:
```bash
# Test just FRED service
npm test -- --run tests/integration/services/live/fredService.live.test.ts

# Test just IMF service (no API key needed)
npm test -- --run tests/integration/services/live/imfService.live.test.ts
```

## 📊 Understanding Test Results

### ✅ Success (Green)
```
✅ FRED Service: HEALTHY
Live FRED Test - GDP (GDPC1): $26854.6 billion
```
- API is working correctly
- Data is being fetched and parsed
- Service integration is successful

### ⚠️ Unavailable (Yellow)
```
⚠️ FRED Service: SKIPPED (no FRED_API_KEY configured)
```
- Service needs API key configuration
- Add the required key to `.env` file

### ❌ Error (Red)
```
❌ Alpha Vantage Service: ERROR - Request failed with status 403
```
- API connection or authentication issue
- Check API key validity
- Verify rate limits not exceeded
- Check network connectivity

### 🔄 Skipped Tests
```
Skipping FRED live test due to API/network error: Network timeout
```
- Tests gracefully handle network issues
- Won't fail CI/CD due to temporary outages
- Check logs for specific error details

## 📮 Postman API Testing

### Postman Collection Overview
A comprehensive Postman collection is provided for manual and automated API testing:

**Files:**
- `TAM-MCP-Server-Postman-Collection.json` - Complete API test collection
- `tests/postman/environments/TAM-MCP-Server-Environment.postman_environment.json` - Environment variables

### Collection Features
- **🔑 Premium APIs**: Alpha Vantage, Census, FRED, Nasdaq Data Link
- **🌍 Public APIs**: World Bank, OECD, IMF, BLS
- **🔧 Health Checks**: Service availability testing
- **🧪 Test Scenarios**: Complete market analysis workflows
- **✅ Automated Tests**: Response validation and error handling

### Quick Start with Postman
1. **Import Collection**:
   - Open Postman
   - File → Import → `TAM-MCP-Server-Postman-Collection.json`
   - Import environment: `tests/postman/environments/TAM-MCP-Server-Environment.postman_environment.json`

2. **Configure API Keys**:
   - Select "TAM MCP Server - API Testing Environment"
   - Add your API keys to the environment variables
   - Save the environment

3. **Run Tests**:
   - Individual requests: Click "Send" on any request
   - Folder testing: Right-click folder → "Run collection"
   - Full suite: Click "Runner" → Select collection → Run

### Postman Test Categories

#### 🔑 Premium APIs (Require Keys)
- **Alpha Vantage**: Company overview, time series data
- **Census Bureau**: County Business Patterns, demographic data
- **FRED**: Economic series, search functionality
- **Nasdaq Data Link**: Financial datasets

#### 🌍 Public APIs (No Keys Required)
- **World Bank**: GDP, population, development indicators
- **OECD**: International statistics (SDMX format)
- **IMF**: Monetary data, growth indicators
- **BLS**: Employment statistics (enhanced with API key)

#### 🔧 Utilities & Health Checks
- **Service Availability**: Test each API endpoint
- **Error Handling**: Invalid keys, rate limits
- **Response Validation**: Data structure verification

#### 🧪 Complete Test Scenarios
- **Market Analysis Workflow**: Multi-API data collection
- **Company Research**: Financial + industry + economic data
- **Data Validation**: Cross-reference multiple sources

### Running Postman Tests via Newman

Install Newman CLI:
```bash
npm install -g newman
```

Run collection from command line:
```bash
# Run entire collection
newman run TAM-MCP-Server-Postman-Collection.json \
  -e tests/postman/environments/TAM-MCP-Server-Environment.postman_environment.json \
  --reporters cli,json

# Run specific folder
newman run TAM-MCP-Server-Postman-Collection.json \
  -e tests/postman/environments/TAM-MCP-Server-Environment.postman_environment.json \
  --folder "Premium APIs"

# Run with custom iterations
newman run TAM-MCP-Server-Postman-Collection.json \
  -e tests/postman/environments/TAM-MCP-Server-Environment.postman_environment.json \
  -n 3 --delay-request 2000  # 3 iterations, 2s delay
```

### **Environment-Specific Testing**
Multiple environment files are available for different testing scenarios:

| Environment | File | Purpose |
|-------------|------|---------|
| **Default** | `tests/postman/environments/TAM-MCP-Server-Environment.postman_environment.json` | General testing |
| **Development** | `tests/postman/environments/TAM-MCP-Server-Development.postman_environment.json` | Development with demo keys |
| **Staging** | `tests/postman/environments/TAM-MCP-Server-Staging.postman_environment.json` | Pre-production testing |
| **Production** | `tests/postman/environments/TAM-MCP-Server-Production.postman_environment.json` | Production monitoring |

```bash
# Development testing
newman run TAM-MCP-Server-Postman-Collection.json \
  -e tests/postman/environments/TAM-MCP-Server-Development.postman_environment.json

# Production health checks
newman run TAM-MCP-Server-Postman-Collection.json \
  -e tests/postman/environments/TAM-MCP-Server-Production.postman_environment.json \
  --folder "Health Checks" --delay-request 5000
```

Add to package.json:
```bash
npm run test:postman
```

**Automated Integration**: The `test:backend-apis` script now includes Newman testing automatically.

## 🧪 Test Coverage by Service

| Service | Unit Tests | Live Integration | Health Check | Postman Tests |
|---------|------------|------------------|--------------|---------------|
| FRED | ✅ | ✅ | ✅ | ✅ |
| BLS | ✅ | 🚧 | ✅ | ✅ |
| Alpha Vantage | ✅ | 🚧 | ✅ | ✅ |
| Census Bureau | ✅ | 🚧 | ✅ | ✅ |
| IMF | ✅ | ✅ | ✅ | ✅ |
| OECD | ✅ | ✅ | ✅ | ✅ |
| World Bank | ✅ | ✅ | ✅ | ✅ |
| NASDAQ Data Link | ✅ | 🚧 | ✅ | ✅ |

**Legend**: ✅ Implemented, 🚧 Template created (needs completion)

## 🔍 Debugging Integration Issues

### Common Issues

1. **Rate Limits**
   ```
   Error: Request failed with status 429
   ```
   - Wait and retry
   - Check daily/monthly limits
   - Consider upgrading API plan

2. **Invalid API Key**
   ```
   Error: Request failed with status 401/403
   ```
   - Verify API key in `.env`
   - Check key hasn't expired
   - Confirm key has required permissions

3. **Network Issues**
   ```
   Error: Network timeout / ECONNREFUSED
   ```
   - Check internet connection
   - Verify firewall settings
   - Try again later

4. **Data Format Changes**
   ```
   Error: Cannot read property 'value' of undefined
   ```
   - API provider changed response format
   - Update parsing logic in service
   - Check API documentation for changes

### Verbose Logging
Enable detailed logging:
```bash
DEBUG=* npm run test:live
```

### Single Service Debug
Test one service with full output:
```bash
npm test -- --run tests/integration/services/live/fredService.live.test.ts --reporter=verbose
```

## 🚦 CI/CD Integration

### GitHub Actions Workflow
A comprehensive GitHub Actions workflow is provided for automated testing:

**File**: `.github/workflows/api-integration-tests.yml`

**Features**:
- **Daily Scheduled Runs**: Automatically tests API health daily at 6 AM UTC
- **Manual Triggers**: Run tests on-demand with different test levels
- **Matrix Testing**: Parallel execution of unit, integration, and live API tests
- **Newman Integration**: Automated Postman collection testing
- **Graceful Failures**: Tests continue even when API keys are missing
- **Artifact Collection**: Newman results stored for analysis

**Test Levels Available**:
- `health-check`: Quick API availability testing
- `full-integration`: Complete test suite including Newman
- `postman-only`: Newman Postman tests only

**Setup Instructions**:
1. **Add Repository Secrets** (optional for enhanced testing):
   ```
   FRED_API_KEY
   ALPHA_VANTAGE_API_KEY
   BLS_API_KEY
   CENSUS_API_KEY
   NASDAQ_DATA_LINK_API_KEY
   ```

2. **Enable Workflow**:
   - Push the workflow file to your repository
   - GitHub Actions will automatically start daily runs
   - Manual runs available in Actions tab

**Workflow Trigger Examples**:
```yaml
# Daily automatic run
on:
  schedule:
    - cron: '0 6 * * *'

# Manual trigger with options
workflow_dispatch:
  inputs:
    test_level:
      type: choice
      options: ['health-check', 'full-integration', 'postman-only']
```

### Local Development Workflow
1. **Daily**: Run `npm run test:api-health` to check service status
2. **Before deployment**: Run `npm run test:backend-apis`
3. **After API key changes**: Run `npm run test:live`
4. **Debugging issues**: Run individual service tests with verbose output
5. **Postman testing**: Run `npm run test:postman` for comprehensive API testing

### Integration with Existing Scripts
The enhanced `test-backend-apis.sh` script now includes:
- **Newman Integration**: Automatically runs Postman tests if Newman is available
- **Environment Management**: Creates temporary environment files with current API keys
- **Graceful Failures**: Continues testing even when some APIs fail
- **Comprehensive Reporting**: Shows results for all test types

## 📈 Monitoring in Production

### Health Check Endpoint
The server provides a health check endpoint:
```bash
curl http://localhost:3000/health
```

### Automated Monitoring
Set up scheduled health checks:
```bash
# Add to crontab for hourly health checks
0 * * * * cd /path/to/tam-mcp-server && npm run test:api-health >> logs/health-check.log 2>&1
```

## 🛠 Extending Integration Tests

### Adding a New Service Test
1. Create test file: `tests/integration/services/live/newService.live.test.ts`
2. Use this template:
```typescript
import { vi, describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { NewService } from '../../../../src/services/dataSources/newService';
// ... setup similar to existing live tests

describe('NewService - Live API Integration Tests', () => {
  // Skip if no API key
  beforeEach(() => {
    if (!process.env.NEW_SERVICE_API_KEY) {
      console.warn('Skipping test: NEW_SERVICE_API_KEY not configured');
      return;
    }
  });

  it('should fetch real data from New Service API', async () => {
    // Test implementation
  });
});
```

3. Add to health check script
4. Update documentation

This comprehensive testing strategy ensures your backend API integrations are working correctly while maintaining fast unit test feedback loops.
