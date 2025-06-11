#!/bin/bash

# Demo: Backend API Integration Testing
# This script demonstrates how to test real API integrations

echo "🎯 TAM MCP Server - Backend API Integration Testing Demo"
echo "======================================================"
echo ""

echo "📋 Current Test Status:"
echo "----------------------"

# Check what API keys are configured
echo "🔑 API Key Configuration:"
if [ -n "$FRED_API_KEY" ]; then
    echo "  ✅ FRED API Key: Configured"
else 
    echo "  ⚠️  FRED API Key: Not configured"
fi

if [ -n "$BLS_API_KEY" ]; then
    echo "  ✅ BLS API Key: Configured"
else 
    echo "  ⚠️  BLS API Key: Not configured"
fi

if [ -n "$ALPHA_VANTAGE_API_KEY" ]; then
    echo "  ✅ Alpha Vantage API Key: Configured"
else 
    echo "  ⚠️  Alpha Vantage API Key: Not configured"
fi

echo "  ✅ IMF: Public API (no key required)"
echo "  ✅ OECD: Public API (no key required)"
echo "  ✅ World Bank: Public API (no key required)"
echo ""

echo "🧪 Running Live Integration Tests..."
echo "-----------------------------------"
echo "These tests make REAL API calls to external services:"
echo ""

# Run live tests with a timeout
timeout 60s npm run test:live --silent || echo "⏰ Tests timed out or completed"

echo ""
echo "📊 Test Results Summary:"
echo "-----------------------"

# Count test results
if [ -f "logs/test-results.log" ]; then
    echo "📁 Detailed logs saved to: logs/test-results.log"
fi

echo ""
echo "🚀 Available Testing Commands:"
echo "-----------------------------"
echo "npm run test:live          # Run all live integration tests"
echo "npm run test:api-health    # Quick health check of all APIs"
echo "npm run test:backend-apis  # Comprehensive backend API test suite"
echo "npm test                   # Run unit tests (mocked APIs)"
echo ""

echo "💡 To enable more API testing:"
echo "-----------------------------"
echo "1. Copy .env.example to .env"
echo "2. Add your API keys to .env file"
echo "3. Get free API keys from:"
echo "   - FRED: https://fred.stlouisfed.org/docs/api/api_key.html"
echo "   - Alpha Vantage: https://www.alphavantage.co/support/#api-key"
echo "   - Census: https://api.census.gov/data/key_signup.html"
echo "   - BLS: https://www.bls.gov/developers/api_signature_v2.htm"
echo ""

echo "📖 Full documentation: doc/BACKEND-API-TESTING.md"
echo ""
echo "✨ Demo complete!"
