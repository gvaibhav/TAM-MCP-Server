# Test Directory Cleanup and Status Report

**Generated:** June 11, 2025  
**Purpose:** Document current test status and plan cleanup of broken/duplicate test files

## Current Test File Inventory

### Working Test Scripts (Keep)
- ✅ `scripts/test-simple-mcp.mjs` - Basic MCP protocol verification
- ✅ `scripts/test-inspector-fix.mjs` - STDIO transport verification  
- ✅ `scripts/test-mcp-tool-calls.mjs` - Tool call verification (100% success)

### Broken Test Scripts (Remove)
- ❌ `scripts/test-http-streaming.mjs` - HTTP server not running
- ❌ `scripts/test-comprehensive-integration.mjs` - Import path issues

### Unit Test Files Analysis

#### Market Tools Tests (Multiple Duplicates - Consolidate)
- `unit/market-tools.test.js` - Original version
- `unit/market-tools.test.ts` - TypeScript version
- `unit/market-tools-advanced.test.js` - Advanced features
- `unit/market-tools-coverage.test.js` - Coverage focused
- `unit/market-tools-coverage.test.ts` - TypeScript coverage
- `unit/market-tools-coverage-fixed.test.js` - Fixed version
- `unit/market-tools-coverage-new.test.ts` - New version
- `unit/market-tools-extra.test.ts` - Extra tests
- `unit/market-tools-extra.test.ts.new` - Backup file
- `unit/market-tools-simple.js` - Simple version

**Action:** Keep only the most comprehensive working version, remove duplicates

#### Transport Tests (Multiple Versions - Consolidate)
- `unit/http.test.js` - Original HTTP tests
- `unit/http.test.ts` - TypeScript version
- `unit/http-fixed.test.js` - Fixed version
- `unit/transports.test.js` - General transport tests
- `unit/transports.test.mjs` - Module version
- `unit/transports.test.ts` - TypeScript version
- `unit/sse-new.test.js` - SSE tests
- `unit/sse-new.test.ts` - TypeScript SSE
- `unit/sse-new-broken.test.js` - Broken SSE tests
- `unit/sse-new-fixed.test.js` - Fixed SSE tests

**Action:** Keep only working transport tests, remove broken/duplicate versions

#### Resource Tests (Duplicates - Consolidate)
- `unit/resources.test.ts` - Main resource tests
- `unit/resources-new.test.ts` - New version
- `unit/resources-fixed.test.ts` - Fixed version
- `unit/resources.test.ts.bak` - Backup file
- `integration/resources.test.ts` - Integration version
- `integration/resources-new.test.ts` - New integration version

**Action:** Keep best working version from each category (unit/integration)

#### Notification Tests (Review)
- `unit/notification-service.test.js` - JavaScript version
- `unit/notification-service.test.ts` - TypeScript version  
- `unit/notification-service-error.test.js` - Error handling

**Action:** Keep TypeScript version if working, remove duplicates

#### Other Unit Tests
- `unit/tools.test.js` - Core tools test (keep if working)
- `unit/server-capabilities.test.ts` - Server capabilities (keep)

### Integration Test Files
- `integration/server.test.js` - Server integration tests (review)
- `integration/services/` - Service integration tests (review)
- `integration/tools/` - Tool integration tests (review)

### Test Infrastructure Files
- `fixtures/` - Test data (keep)
- `utils/` - Test utilities (keep)
- `setup.ts` - Test setup (keep)
- `run-tests.js` - Test runner (keep)

## Files to Remove (Broken/Duplicate)

### Immediate Removal List
```bash
# Broken scripts
tests/scripts/test-http-streaming.mjs
tests/scripts/test-comprehensive-integration.mjs

# Duplicate/backup files
tests/unit/market-tools-extra.test.ts.new
tests/unit/resources.test.ts.bak

# Broken SSE tests
tests/unit/sse-new-broken.test.js

# Duplicate market tools tests (keep only best working version)
tests/unit/market-tools-advanced.test.js
tests/unit/market-tools-coverage.test.js
tests/unit/market-tools-coverage-fixed.test.js
tests/unit/market-tools-extra.test.ts
tests/unit/market-tools-simple.js

# Duplicate transport tests (keep only working versions)
tests/unit/transports.test.js
tests/unit/transports.test.mjs

# Duplicate HTTP tests (keep only working version)
tests/unit/http.test.js

# Duplicate notification tests (keep TypeScript version)
tests/unit/notification-service.test.js
tests/unit/notification-service-error.test.js

# Duplicate resource tests (keep main versions)
tests/unit/resources-new.test.ts
tests/unit/resources-fixed.test.ts
tests/integration/resources-new.test.ts
```

## Files to Keep and Validate

### Core Working Tests
- `scripts/test-simple-mcp.mjs`
- `scripts/test-inspector-fix.mjs`
- `scripts/test-mcp-tool-calls.mjs`

### Best Version of Each Test Category
- `unit/market-tools.test.ts` (if working) or `unit/market-tools-coverage-new.test.ts`
- `unit/http-fixed.test.js` or `unit/http.test.ts` (whichever works)
- `unit/sse-new-fixed.test.js`
- `unit/transports.test.ts`
- `unit/resources.test.ts`
- `unit/notification-service.test.ts`
- `unit/tools.test.js`
- `unit/server-capabilities.test.ts`
- `integration/server.test.js`
- `integration/resources.test.ts`

## Cleanup Implementation Plan

### Phase 1: Remove Obviously Broken/Duplicate Files
1. Remove backup files (*.bak, *.new)
2. Remove broken test scripts
3. Remove obviously duplicate test files

### Phase 2: Test Validation
1. Run remaining tests to identify which versions work
2. Keep only the working version of each test category
3. Document any remaining issues

### Phase 3: Consolidation
1. Merge useful test cases from removed files into kept files
2. Update test configurations
3. Verify all kept tests run successfully

## Expected Outcome

### Before Cleanup
- ~49 test files
- Many duplicates and broken tests
- Confusing test structure

### After Cleanup
- ~20-25 focused test files
- No duplicates
- Clear test organization
- Only working or fixable tests

## Post-Cleanup Actions Required

1. Update `tests/README.md` with new structure
2. Update test running scripts
3. Fix any remaining test issues
4. Update CI/CD configuration
5. Document test maintenance procedures

---

**Next Steps:** Execute the cleanup plan to create a clean, maintainable test suite focused on working tests that provide real value.
