# Testing Guide

## Overview

The TAM MCP Server includes comprehensive testing across multiple areas:

## Test Structure

- **Unit Tests**: Located in `tests/unit/`
- **Integration Tests**: Located in `tests/integration/`
- **E2E Tests**: Located in `tests/e2e/`
- **API Health Checks**: Located in `scripts/`

## Running Tests

```bash
# Run all tests
npm test

# Run API health checks
npm run test:api-health

# Run backend API tests
npm run test:backend-apis
```

## Test Organization

- Tests are organized by functionality and scope
- Each test file corresponds to specific features or components
- Integration tests verify end-to-end workflows
- API tests validate external service integrations

For more details, see the test files in the `tests/` directory.