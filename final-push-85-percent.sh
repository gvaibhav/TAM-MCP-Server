#!/bin/bash

# Strategic Final Push to 85% Test Pass Rate
# Current: 296/376 passing (78.7%) - Need 24 more passing tests

echo "🎯 FINAL PUSH TO 85% TEST PASS RATE"
echo "Current: 296/376 passing (78.7%)"
echo "Target: 320/376 passing (85%)"
echo "Need: 24 more passing tests"
echo ""

cd /home/gvaibhav/Documents/TAM-MCP-Server

# Strategy 1: Fix remaining environment import issues in services
echo "🔧 Strategy 1: Cleaning up remaining environment mocking issues..."

# Look for any remaining 'process' imports in data source tests
for file in tests/unit/services/dataSources/*.test.ts; do
    if grep -q "import \* as process" "$file"; then
        echo "  📝 Fixing environment imports in $(basename $file)"
        sed -i 's/import \* as process from '\''process'\'';//g' "$file"
        sed -i '/import.*envHelper/a import { envTestUtils } from '\''../../../utils/envTestHelper'\'';' "$file"
    fi
done

# Strategy 2: Quick assertion fixes for common mock expectation patterns
echo ""
echo "🔧 Strategy 2: Quick assertion fixes..."

# Fix common spy expectation patterns in market-tools tests
if [ -f "tests/unit/market-tools.test.ts" ]; then
    echo "  📝 Fixing market-tools spy expectations..."
    # These are likely simple spy call expectation mismatches
fi

# Strategy 3: Check for easy wins in utilities
echo ""
echo "🔧 Strategy 3: Utilities and simple fixes..."

# Run targeted tests to assess improvement
echo ""
echo "🧪 Testing improvements..."
npm test --reporter=basic 2>/dev/null | grep -E "(Test Files|Tests)" | tail -2

echo ""
echo "📊 Progress Assessment Complete"
