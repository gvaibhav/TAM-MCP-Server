#!/bin/bash

# TAM MCP Server - Build Script
# This script builds the TypeScript project and sets executable permissions

set -e

echo "🔨 Building TAM MCP Server..."

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf dist/

# Build TypeScript
echo "📦 Compiling TypeScript..."
npx tsc

# Set executable permissions
echo "🔧 Setting executable permissions..."
chmod +x dist/*.js

# Create logs directory if it doesn't exist
echo "📝 Ensuring logs directory exists..."
mkdir -p logs/

echo "✅ Build completed successfully!"
echo "📍 Built files are in: dist/"
echo "🚀 Run with: npm start"
