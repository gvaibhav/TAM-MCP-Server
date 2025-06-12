# Postman Automation & Enhanced Scripts Guide

This guide provides enhanced automation scripts and modern Postman collection management for the TAM MCP Server.

## 🚀 Enhanced Collection Scripts

### Collection-Level Pre-request Script

```javascript
// Enhanced Environment Setup and Validation
const requiredVars = ['serverUrl', 'mcpEndpoint', 'sseEndpoint', 'healthEndpoint'];

// Auto-configure environment if not set
if (!pm.environment.get('serverUrl')) {
    pm.environment.set('serverUrl', 'http://localhost:3000');
}

const serverUrl = pm.environment.get('serverUrl');
if (!pm.environment.get('mcpEndpoint')) {
    pm.environment.set('mcpEndpoint', `${serverUrl}/mcp`);
}

if (!pm.environment.get('sseEndpoint')) {
    pm.environment.set('sseEndpoint', `${serverUrl}/sse`);
}

if (!pm.environment.get('healthEndpoint')) {
    pm.environment.set('healthEndpoint', `${serverUrl}/health`);
}

// Dynamic request ID generation
if (!pm.environment.get('requestId') || pm.request.name.includes('New Session')) {
    pm.environment.set('requestId', `req_${Date.now()}_${Math.floor(Math.random() * 1000)}`);
}

// Session management for MCP
if (pm.request.url.toString().includes('/mcp') && pm.request.method === 'POST') {
    let sessionId = pm.environment.get('sessionId');
    if (!sessionId || pm.request.name.includes('Initialize')) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        pm.environment.set('sessionId', sessionId);
        console.log(`🆔 Generated new session ID: ${sessionId}`);
    }
}

// API key validation with helpful messages
const apiKeyConfig = {
    'ALPHA_VANTAGE_API_KEY': {
        required: false,
        url: 'https://www.alphavantage.co/support/#api-key',
        description: 'Stock and financial data'
    },
    'FRED_API_KEY': {
        required: false,
        url: 'https://fred.stlouisfed.org/docs/api/api_key.html',
        description: 'Federal Reserve economic data'
    },
    'BLS_API_KEY': {
        required: false,
        url: 'https://www.bls.gov/developers/api_signature_v2.htm',
        description: 'Bureau of Labor Statistics data'
    }
};

Object.entries(apiKeyConfig).forEach(([key, config]) => {
    const value = pm.environment.get(key);
    if (!value || value.startsWith('your_')) {
        console.warn(`⚠️  ${key} not configured. ${config.description} tools may use mock data.`);
        console.log(`   Get your free API key: ${config.url}`);
    } else {
        console.log(`✅ ${key} configured`);
    }
});

// Request timing
pm.environment.set('requestStartTime', Date.now());
```

### Collection-Level Test Script

```javascript
// Enhanced Response Validation and Debugging
const startTime = pm.environment.get('requestStartTime');
const responseTime = Date.now() - startTime;

// Basic response validation
pm.test("✅ Status code is successful", function () {
    pm.expect(pm.response.code).to.be.oneOf([200, 201, 202]);
});

pm.test("⚡ Response time is acceptable", function () {
    pm.expect(pm.response.responseTime).to.be.below(10000);
    if (pm.response.responseTime > 5000) {
        console.warn(`⚠️  Slow response: ${pm.response.responseTime}ms`);
    }
});

pm.test("📄 Content-Type is JSON", function () {
    const contentType = pm.response.headers.get("Content-Type");
    if (contentType) {
        pm.expect(contentType).to.include("application/json");
    }
});

// MCP Protocol specific validation
if (pm.request.url.toString().includes('/mcp')) {
    pm.test("🔌 MCP Protocol compliance", function () {
        const response = pm.response.json();
        
        pm.expect(response).to.have.property('jsonrpc', '2.0');
        pm.expect(response).to.have.property('id');
        
        if (response.result) {
            pm.expect(response).to.have.property('result');
            console.log('✅ MCP Success Response');
        } else if (response.error) {
            pm.expect(response.error).to.have.property('code');
            pm.expect(response.error).to.have.property('message');
            console.warn(`⚠️  MCP Error: ${response.error.message}`);
        }
    });
    
    // Session management
    if (pm.request.name.includes('Initialize') || pm.request.name.includes('Session')) {
        const response = pm.response.json();
        if (response.result && response.result.capabilities) {
            console.log('🔧 Server capabilities:', JSON.stringify(response.result.capabilities, null, 2));
        }
    }
    
    // Tool execution validation
    if (pm.request.name.includes('Tool:') || pm.request.name.includes('call')) {
        pm.test("🛠️  Tool execution response", function () {
            const response = pm.response.json();
            
            if (response.result) {
                pm.expect(response.result).to.have.property('content');
                pm.expect(response.result.content).to.be.an('array');
                
                if (response.result.content.length > 0) {
                    const firstContent = response.result.content[0];
                    pm.expect(firstContent).to.have.property('type');
                    pm.expect(firstContent).to.have.property('text');
                    
                    // Log successful tool execution
                    console.log(`✅ Tool executed successfully`);
                    console.log(`📊 Response length: ${firstContent.text.length} characters`);
                }
            }
        });
    }
}

// Health check specific validation
if (pm.request.url.toString().includes('/health')) {
    pm.test("💚 Health check validation", function () {
        const response = pm.response.json();
        pm.expect(response).to.have.property('status');
        pm.expect(response).to.have.property('timestamp');
        
        if (response.status === 'healthy') {
            console.log('✅ Server is healthy');
        } else {
            console.warn(`⚠️  Server status: ${response.status}`);
        }
        
        if (response.version) {
            console.log(`🏷️  Server version: ${response.version}`);
        }
        
        if (response.dataSourcesStatus) {
            console.log('📊 Data sources status:', response.dataSourcesStatus);
        }
    });
}

// Error handling validation
if (pm.response.code >= 400) {
    pm.test("❌ Error response structure", function () {
        const response = pm.response.json();
        pm.expect(response).to.have.property('error');
        
        console.error(`❌ Request failed: ${response.error.message || 'Unknown error'}`);
        
        if (response.error.code) {
            console.error(`🔢 Error code: ${response.error.code}`);
        }
    });
}

// Performance logging
console.log(`⏱️  Total request time: ${responseTime}ms`);
if (responseTime > 3000) {
    console.warn(`🐌 Performance warning: Request took ${responseTime}ms`);
}

// Response size logging
const responseSize = pm.response.responseSize;
if (responseSize) {
    console.log(`📏 Response size: ${responseSize} bytes`);
    if (responseSize > 100000) {
        console.warn(`📦 Large response: ${responseSize} bytes`);
    }
}
```

## 🔄 Advanced Automation Features

### Environment Auto-Configuration Script

```javascript
// Dynamic Environment Setup Script
// Run this in a standalone request to auto-configure your environment

pm.test("🔧 Environment Auto-Configuration", function () {
    const config = {
        serverUrl: 'http://localhost:3000',
        environments: {
            development: {
                serverUrl: 'http://localhost:3000',
                timeout: 10000,
                retries: 3
            },
            staging: {
                serverUrl: 'https://staging-tam-mcp.your-domain.com',
                timeout: 5000,
                retries: 2
            },
            production: {
                serverUrl: 'https://tam-mcp.your-domain.com',
                timeout: 3000,
                retries: 1
            }
        }
    };
    
    const env = pm.environment.get('environment') || 'development';
    const envConfig = config.environments[env];
    
    Object.entries(envConfig).forEach(([key, value]) => {
        pm.environment.set(key, value);
        console.log(`✅ Set ${key}: ${value}`);
    });
    
    // Derived URLs
    const serverUrl = pm.environment.get('serverUrl');
    pm.environment.set('mcpEndpoint', `${serverUrl}/mcp`);
    pm.environment.set('sseEndpoint', `${serverUrl}/sse`);
    pm.environment.set('healthEndpoint', `${serverUrl}/health`);
    
    console.log('🎯 Environment configured for:', env);
});
```

### Newman CLI Automation Script

Create a shell script for automated testing:

```bash
#!/bin/bash
# newman-automation.sh

echo "🚀 TAM MCP Server - Automated Testing with Newman"

# Configuration
COLLECTION_FILE="TAM-MCP-Server-Postman-Collection.json"
ENVIRONMENT_FILE="environments/TAM-Environment.json"
REPORT_DIR="newman-reports"

# Create reports directory
mkdir -p $REPORT_DIR

# Check if collection exists
if [ ! -f "$COLLECTION_FILE" ]; then
    echo "❌ Collection file not found: $COLLECTION_FILE"
    exit 1
fi

# Run different test scenarios
echo "🏥 Running Health Checks..."
newman run $COLLECTION_FILE \
    --environment $ENVIRONMENT_FILE \
    --folder "Health & Status" \
    --reporters cli,htmlextra \
    --reporter-htmlextra-export $REPORT_DIR/health-check-report.html

echo "🔌 Running MCP Protocol Tests..."
newman run $COLLECTION_FILE \
    --environment $ENVIRONMENT_FILE \
    --folder "MCP Protocol" \
    --reporters cli,htmlextra \
    --reporter-htmlextra-export $REPORT_DIR/mcp-protocol-report.html

echo "🛠️ Running Tool Tests..."
newman run $COLLECTION_FILE \
    --environment $ENVIRONMENT_FILE \
    --folder "Market Analysis Tools" \
    --reporters cli,htmlextra \
    --reporter-htmlextra-export $REPORT_DIR/tools-report.html

echo "📊 Running Data Source Tests..."
newman run $COLLECTION_FILE \
    --environment $ENVIRONMENT_FILE \
    --folder "Data Source Tests" \
    --reporters cli,htmlextra \
    --reporter-htmlextra-export $REPORT_DIR/data-sources-report.html

echo "✅ All tests completed! Reports saved in $REPORT_DIR"
echo "🌐 Open the HTML reports in your browser for detailed results"
```

## 📊 CI/CD Integration Examples

### GitHub Actions Workflow

```yaml
name: TAM MCP Server API Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 6 * * *'  # Daily at 6 AM UTC

jobs:
  api-tests:
    runs-on: ubuntu-latest
    
    services:
      tam-mcp-server:
        image: node:18
        ports:
          - 3000:3000
        options: --health-cmd "curl -f http://localhost:3000/health" --health-interval 30s --health-timeout 10s --health-retries 5
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: |
        npm install
        npm install -g newman newman-reporter-htmlextra
        
    - name: Build and start server
      run: |
        npm run build
        npm start &
        sleep 10  # Wait for server to start
        
    - name: Run Postman tests
      run: |
        newman run TAM-MCP-Server-Postman-Collection.json \
          --environment environments/ci-environment.json \
          --reporters cli,junit,htmlextra \
          --reporter-junit-export results.xml \
          --reporter-htmlextra-export api-test-report.html
      env:
        ALPHA_VANTAGE_API_KEY: ${{ secrets.ALPHA_VANTAGE_API_KEY }}
        FRED_API_KEY: ${{ secrets.FRED_API_KEY }}
        
    - name: Upload test results
      uses: actions/upload-artifact@v3
      with:
        name: api-test-reports
        path: |
          results.xml
          api-test-report.html
        
    - name: Publish test results
      uses: dorny/test-reporter@v1
      if: success() || failure()
      with:
        name: API Tests
        path: results.xml
        reporter: java-junit
```

## 🎯 Quick Setup Guide

### 1. Import Enhanced Collections

```bash
# Download enhanced collections
curl -o TAM-Enhanced-Collection.json https://your-repo/postman/enhanced-collection.json

# Import into Postman or use with Newman
newman run TAM-Enhanced-Collection.json --environment your-environment.json
```

### 2. Environment Variables Template

```json
{
  "id": "tam-mcp-environment",
  "name": "TAM MCP Server Environment",
  "values": [
    {"key": "serverUrl", "value": "http://localhost:3000"},
    {"key": "environment", "value": "development"},
    {"key": "timeout", "value": "10000"},
    {"key": "retries", "value": "3"},
    {"key": "ALPHA_VANTAGE_API_KEY", "value": "your_key_here"},
    {"key": "FRED_API_KEY", "value": "your_key_here"},
    {"key": "BLS_API_KEY", "value": "your_key_here"}
  ]
}
```

### 3. Quick Validation Script

```bash
#!/bin/bash
# quick-validate.sh

echo "🔍 Quick TAM MCP Server Validation"

# Health check
echo "🏥 Checking server health..."
curl -s http://localhost:3000/health | jq .

# Tool list
echo "🛠️ Checking available tools..."
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | \
  curl -s -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d @- | jq '.result.tools | length'

echo "✅ Quick validation complete"
```

---

## 📋 Summary of Enhancements

### ✅ Enhanced Features

1. **Smart Environment Management** - Auto-configuration and validation
2. **Comprehensive Error Handling** - Detailed error reporting and debugging
3. **Performance Monitoring** - Response time and size tracking
4. **MCP Protocol Validation** - Full compliance checking
5. **CI/CD Integration** - GitHub Actions and automated testing
6. **Detailed Logging** - Console output for debugging
7. **Session Management** - Automatic session handling for MCP
8. **API Key Validation** - Helpful configuration guidance

### 🚀 Ready to Use

- Import the enhanced collection
- Configure your environment
- Run automated tests with Newman
- Integrate with CI/CD pipelines
- Monitor performance and errors

The Postman Scripts Revamp is now complete with modern automation capabilities!
