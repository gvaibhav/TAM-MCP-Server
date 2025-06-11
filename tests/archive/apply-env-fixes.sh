#!/bin/bash

# Script to systematically apply environment mocking fixes to all remaining data source services
# that still have the "Cannot redefine property: env" error

echo "🔧 Phase 2: Environment Mocking Infrastructure Overhaul"
echo "Target: Fix remaining data source services with environment variable mocking issues"
echo ""

services_to_fix=("nasdaqDataService" "oecdService" "imfService" "worldBankService")

for service in "${services_to_fix[@]}"; do
    file_path="/home/gvaibhav/Documents/TAM-MCP-Server/tests/unit/services/dataSources/${service}.test.ts"
    
    if [ -f "$file_path" ]; then
        echo "📝 Processing $service.test.ts..."
        
        # Check if the file has the error before modifying
        if grep -q "Cannot redefine" <<< "$(cd /home/gvaibhav/Documents/TAM-MCP-Server && npm test "$file_path" 2>&1)"; then
            echo "  ❌ Found environment mocking errors in $service"
            
            # Apply the basic import fix
            sed -i 's/import \* as process from '\''process'\'';//g' "$file_path"
            sed -i '/import.*envHelper/a import { envTestUtils } from '\''../../../utils/envTestHelper'\'';' "$file_path"
            
            # Apply the describe block fix
            sed -i 's/const OLD_ENV = { \.\.\.process\.env };//g' "$file_path"
            sed -i 's/process\.env = { \.\.\.OLD_ENV };/envTestUtils.setup();/g' "$file_path"
            sed -i 's/process\.env = OLD_ENV;/envTestUtils.cleanup();/g' "$file_path"
            
            # Fix afterAll to afterEach
            sed -i 's/afterAll(() => {/afterEach(() => {/g' "$file_path"
            sed -i 's/}, { timeout: [0-9]* });/});/g' "$file_path"
            
            echo "  ✅ Applied basic environment mocking fixes to $service"
        else
            echo "  ✅ $service already working (no environment errors)"
        fi
    else
        echo "  ⚠️  File not found: $file_path"
    fi
done

echo ""
echo "🧪 Testing the fixes..."
cd /home/gvaibhav/Documents/TAM-MCP-Server

# Test overall improvement
npm test tests/unit/services/dataSources/ 2>&1 | grep -E "(Test Files|Tests|failed|passed)" | tail -3
