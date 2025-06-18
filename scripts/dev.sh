#!/bin/bash

# TAM MCP Server - Development Helper Script
# Common development tasks in one convenient script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Show help
show_help() {
    echo "TAM MCP Server Development Helper"
    echo ""
    echo "Usage: $0 <command>"
    echo ""
    echo "Commands:"
    echo "  setup      - Run development environment setup"
    echo "  build      - Build the project"
    echo "  test       - Run all tests"
    echo "  test:unit  - Run unit tests only"
    echo "  test:integration - Run integration tests only"
    echo "  test:scripts - Run integration scripts"
    echo "  start      - Start the server (STDIO)"
    echo "  start:http - Start HTTP server"
    echo "  start:sse  - Start SSE server"
    echo "  clean      - Clean build artifacts"
    echo "  format     - Format code with Prettier"
    echo "  lint       - Run ESLint"
    echo "  help       - Show this help message"
    echo ""
}

# Main command processing
case "${1:-help}" in
    "setup")
        print_status "Running development setup..."
        ./scripts/dev-setup.sh
        print_success "Setup completed!"
        ;;
    
    "build")
        print_status "Building project..."
        ./scripts/build.sh
        print_success "Build completed!"
        ;;
    
    "test")
        print_status "Running all tests..."
        npm test
        print_success "All tests completed!"
        ;;
    
    "test:unit")
        print_status "Running unit tests..."
        npm run test:unit
        print_success "Unit tests completed!"
        ;;
    
    "test:integration")
        print_status "Running integration tests..."
        npm run test:integration
        print_success "Integration tests completed!"
        ;;
    
    "test:scripts")
        print_status "Running integration scripts..."
        npm run test:scripts:simple
        print_success "Integration scripts completed!"
        ;;
    
    "start")
        print_status "Starting STDIO server..."
        npm start
        ;;
    
    "start:http")
        print_status "Starting HTTP server..."
        npm run start:http
        ;;
    
    "start:sse")
        print_status "Starting SSE server..."
        npm run start:sse
        ;;
    
    "clean")
        print_status "Cleaning build artifacts..."
        rm -rf dist/
        rm -rf coverage/
        rm -rf node_modules/.cache/
        print_success "Clean completed!"
        ;;
    
    "format")
        print_status "Formatting code..."
        npm run format
        print_success "Code formatted!"
        ;;
    
    "lint")
        print_status "Running linter..."
        npm run lint
        print_success "Linting completed!"
        ;;
    
    "help")
        show_help
        ;;
    
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
