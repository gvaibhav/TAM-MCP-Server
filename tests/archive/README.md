# Archived Test Files

This directory contains the original test files that were in the root directory before the test suite was professionally organized.

## Files

- `test-basic.js` - Basic import and functionality test
- `test-tools.js` - Original tools testing script  
- `test-notifications.js` - Original notifications testing script
- `test-simple-notification.js` - Simple notification test
- `test-tools-direct.js` - Direct tool testing without server
- `test-all-tools.js` - Comprehensive tool testing script

## Status

These files are kept for reference and historical purposes. The functionality they provided has been migrated to the organized test structure:

- **Unit Tests**: `tests/unit/tools.test.js`
- **Integration Tests**: `tests/integration/server.test.js`  
- **E2E Tests**: `tests/e2e/transports.test.js` and `tests/e2e/notifications.test.js`

## Migration Notes

The new test structure provides:
- Better organization and maintainability
- Proper Jest integration
- Coverage reporting
- CI/CD compatibility
- Professional testing patterns

These archived files can be removed once the new test suite is fully validated and stable.
