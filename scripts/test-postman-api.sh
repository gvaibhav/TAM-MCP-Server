#!/bin/bash

# Newman API Integration Test Runner
# Runs Postman collections against live API endpoints

set -e

echo "📮 Starting Newman API Integration Tests..."

# Check if newman is installed
if ! command -v newman &> /dev/null; then
    echo "📦 Installing Newman..."
    npm install -g newman
fi

# Check if collection exists
if [ ! -f "TAM-MCP-Server-Postman-Collection.json" ]; then
    echo "❌ Postman collection not found: TAM-MCP-Server-Postman-Collection.json"
    exit 1
fi

# Create environment file for Newman if it doesn't exist
if [ ! -f "postman-environment.json" ]; then
    echo "🔧 Creating Postman environment file..."
    cat > postman-environment.json << EOF
{
    "id": "tam-mcp-env",
    "name": "TAM MCP Environment",
    "values": [
        {
            "key": "baseUrl",
            "value": "http://localhost:3000",
            "enabled": true
        },
        {
            "key": "fredApiKey",
            "value": "${FRED_API_KEY:-}",
            "enabled": true
        },
        {
            "key": "blsApiKey", 
            "value": "${BLS_API_KEY:-}",
            "enabled": true
        },
        {
            "key": "alphaVantageApiKey",
            "value": "${ALPHA_VANTAGE_API_KEY:-}",
            "enabled": true
        },
        {
            "key": "censusApiKey",
            "value": "${CENSUS_API_KEY:-}",
            "enabled": true
        },
        {
            "key": "nasdaqApiKey",
            "value": "${NASDAQ_DATA_LINK_API_KEY:-}",
            "enabled": true
        }
    ],
    "_postman_variable_scope": "environment"
}
EOF
fi

# Check if server is running
if ! curl -f -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "⚠️  TAM MCP Server is not running on port 3000"
    echo "💡 Start the server with: npm run start:http"
    echo "   Or run tests against remote server by changing baseUrl in postman-environment.json"
    exit 1
fi

echo "🚀 Running Postman collection with Newman..."

# Run the collection
newman run TAM-MCP-Server-Postman-Collection.json \
    --environment postman-environment.json \
    --reporters cli,json \
    --reporter-json-export newman-results.json \
    --timeout 30000 \
    --delay-request 1000

echo ""
echo "📊 Newman test results saved to: newman-results.json"
echo "✨ Newman API Integration Tests Complete!"
