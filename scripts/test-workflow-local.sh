#!/bin/bash

# Local test script to simulate GitHub Actions workflow
echo "🚀 Starting Local TAM MCP Server Workflow Test"
echo "=============================================="

# Exit on any error
set -e

echo "📦 Step 1: Building project..."
npm run build
echo "✅ Build completed successfully"

echo "🧪 Step 2: Running API health check..."
npm run test:api-health
echo "✅ API health check completed"

echo "🔧 Step 3: Running unit tests..."
npm run test:unit
echo "✅ Unit tests completed"

echo "🔗 Step 4: Running integration tests..."
npm run test:integration
echo "✅ Integration tests completed"

echo "🌐 Step 5: Starting HTTP server for Postman tests..."
PORT=3000 npm run start:http &
SERVER_PID=$!
echo "Server started with PID: $SERVER_PID"

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 10

# Check if server is running
echo "🔍 Testing server health..."
curl -f http://localhost:3000/health || (echo "❌ Server health check failed" && exit 1)
echo "✅ Server is healthy"

echo "📮 Step 6: Running Newman/Postman tests..."
npx newman run examples/TAM-MCP-Server-Postman-Collection.json \
  --env-var serverUrl=http://localhost:3000 \
  --timeout-request 30000 \
  --delay-request 2000 \
  --bail
echo "✅ Newman tests completed"

# Clean up
echo "🧹 Cleaning up..."
kill $SERVER_PID 2>/dev/null || true
echo "✅ Server stopped"

echo ""
echo "🎉 All tests completed successfully!"
echo "✅ Your workflow is ready for GitHub Actions!"
