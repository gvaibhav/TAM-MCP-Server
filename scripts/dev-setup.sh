#!/bin/bash

# TAM MCP Server - Development Setup Script
# This script sets up the development environment

set -e

echo "🚀 Setting up TAM MCP Server development environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ required. Current version: $(node --version)"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📋 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your API keys"
fi

# Create logs directory
echo "📝 Creating logs directory..."
mkdir -p logs/

# Build the project
echo "🔨 Building project..."
npm run build

echo ""
echo "✅ Development environment setup complete!"
echo ""
echo "📖 Next steps:"
echo "   1. Edit .env with your API keys"
echo "   2. Run tests: npm test"
echo "   3. Start development: npm run dev"
echo "   4. View documentation: doc/README.md"
echo ""
