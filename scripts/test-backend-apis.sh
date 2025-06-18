#!/bin/bash

# Backend API Integration Test Runner
# This script runs live integration tests against real APIs

# Remove 'set -e' to allow script to continue on errors
# set -e

echo "🚀 Starting Backend API Integration Tests..."
echo "⚠️  Warning: These tests make real API calls and may take time"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please copy .env.example to .env and configure your API keys"
    exit 1
fi

# Source environment variables
source .env

# Function to test service availability
test_service() {
    local service_name=$1
    local test_file=$2
    
    echo "🔍 Testing $service_name..."
    
    if npm test -- --run "$test_file" --reporter=json > /tmp/test_result.json 2>/dev/null; then
        echo "✅ $service_name: PASS"
        return 0
    else
        echo "❌ $service_name: FAIL"
        # Show error details
        cat /tmp/test_result.json | jq -r '.testResults[0].assertionResults[] | select(.status == "failed") | .title + ": " + .failureMessages[0]' 2>/dev/null || echo "  Check logs for details"
        return 1
    fi
}

# Test services that don't require API keys (public APIs)
echo "📊 Testing Public APIs..."
test_service "IMF Service" "tests/integration/services/live/imfService.live.test.ts"
test_service "OECD Service" "tests/integration/services/live/oecdService.live.test.ts"
test_service "World Bank Service" "tests/integration/services/live/worldBankService.live.test.ts"

echo ""
echo "🔑 Testing API Key Required Services..."

# Test services that require API keys (check if keys are available)
services_with_keys=(
    "FRED_API_KEY:FRED Service:tests/integration/services/live/fredService.live.test.ts"
    "BLS_API_KEY:BLS Service:tests/integration/services/live/blsService.live.test.ts"
    "ALPHA_VANTAGE_API_KEY:Alpha Vantage Service:tests/integration/services/live/alphaVantageService.live.test.ts"
    "CENSUS_API_KEY:Census Service:tests/integration/services/live/censusService.live.test.ts"
    "NASDAQ_DATA_LINK_API_KEY:NASDAQ Service:tests/integration/services/live/nasdaqService.live.test.ts"
)

for service_info in "${services_with_keys[@]}"; do
    IFS=':' read -r env_var service_name test_file <<< "$service_info"
    
    if [ -n "${!env_var}" ]; then
        test_service "$service_name" "$test_file"
    else
        echo "⚠️  $service_name: SKIPPED (no $env_var configured)"
    fi
done

echo ""
echo "🧪 Running Market Analysis Tools Integration..."
test_service "Market Analysis Tools" "tests/integration/tools/marketAnalysisTools.integration.test.ts"

echo ""
echo "🌐 Testing MCP Server End-to-End..."
test_service "MCP Server E2E" "tests/integration/server.test.js"

echo ""
echo "📮 Running Postman Collection Tests with Newman..."

# Check if Newman is available
if command -v npx >/dev/null 2>&1 && npx newman --version >/dev/null 2>&1; then
    echo "🔍 Found Newman CLI (via npx), running Postman collection tests..."
    
    # Check if Postman collection exists
    if [ -f "TAM-MCP-Server-Postman-Collection.json" ]; then
        # Check if environment file exists
        if [ -f "tests/postman/environments/TAM-MCP-Server-Environment.postman_environment.json" ]; then
            echo "📊 Running Newman collection with environment..."
            
            # Create temporary environment with current .env values
            temp_env_file="/tmp/newman-env-$(date +%s).json"
            cat > "$temp_env_file" << EOF
{
  "id": "temp-newman-env",
  "name": "Temporary Newman Environment",
  "values": [
    {"key": "ALPHA_VANTAGE_API_KEY", "value": "${ALPHA_VANTAGE_API_KEY:-}", "enabled": true, "type": "secret"},
    {"key": "CENSUS_API_KEY", "value": "${CENSUS_API_KEY:-}", "enabled": true, "type": "secret"},
    {"key": "FRED_API_KEY", "value": "${FRED_API_KEY:-}", "enabled": true, "type": "secret"},
    {"key": "NASDAQ_DATA_LINK_API_KEY", "value": "${NASDAQ_DATA_LINK_API_KEY:-}", "enabled": true, "type": "secret"},
    {"key": "BLS_API_KEY", "value": "${BLS_API_KEY:-}", "enabled": true, "type": "secret"}
  ]
}
EOF
            
            # Run Newman with timeout and error handling
            if npx newman run TAM-MCP-Server-Postman-Collection.json \
                --environment "$temp_env_file" \
                --reporters cli \
                --timeout 30000 \
                --delay-request 2000 \
                --bail 2>/dev/null; then
                echo "✅ Newman Postman Tests: PASS"
            else
                echo "❌ Newman Postman Tests: FAIL (some API tests may require valid keys)"
            fi
            
            # Cleanup temporary environment file
            rm -f "$temp_env_file"
        else
            echo "⚠️  Postman environment file not found, running collection without environment"
            npx newman run TAM-MCP-Server-Postman-Collection.json --reporters cli --timeout 30000 2>/dev/null || echo "❌ Newman collection failed"
        fi
    else
        echo "⚠️  Postman collection not found: TAM-MCP-Server-Postman-Collection.json"
    fi
else
    echo "⚠️  Newman CLI not available via npx. Ensure newman is installed: npm install newman"
    echo "   Then run: npm run test:postman"
fi

echo ""
echo "✨ Backend API Integration Tests Complete!"
echo "💡 Tip: Configure API keys in .env to test more services"
echo "📋 For Postman testing: npm run test:postman"
