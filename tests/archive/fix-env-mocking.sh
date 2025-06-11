#!/bin/bash

# Script to apply environment mocking fixes to all data source service tests
# This applies the pattern that fixed AlphaVantageService to all other services

echo "🔧 Applying environment mocking fixes to all data source service tests..."

# List of service test files to fix
services=(
  "blsService"
  "censusService" 
  "fredService"
  "nasdaqDataService"
  "oecdService"
  "imfService"
  "worldBankService"
)

# Apply fixes to each service test file
for service in "${services[@]}"; do
  file_path="/home/gvaibhav/Documents/TAM-MCP-Server/tests/unit/services/dataSources/${service}.test.ts"
  
  if [ -f "$file_path" ]; then
    echo "📝 Fixing $service.test.ts..."
    
    # Backup the original file
    cp "$file_path" "${file_path}.backup"
    
    # Apply the environment mocking pattern
    sed -i 's/import \* as process from '\''process'\'';//' "$file_path"
    sed -i 's/const OLD_ENV = { \.\.\.process\.env };//' "$file_path"
    sed -i 's/process\.env = { \.\.\.OLD_ENV };/envTestUtils.setup();/' "$file_path"
    sed -i 's/process\.env = OLD_ENV;/envTestUtils.cleanup();/' "$file_path"
    sed -i 's/delete process\.env\./envTestUtils.mockWith({ /' "$file_path"
    sed -i 's/process\.env\.\([A-Z_]*\) = /envTestUtils.mockWith({ \1: /' "$file_path"
    
    # Add the import for envTestHelper at the top
    sed -i '/import.*envHelper/a import { envTestUtils } from '"'"'../../../utils/envTestHelper'"'"';' "$file_path"
    
    echo "✅ Fixed $service.test.ts"
  else
    echo "⚠️  File not found: $file_path"
  fi
done

echo "🎉 Environment mocking fixes applied to all data source service tests!"
echo "🧪 Running a quick test to verify fixes..."

cd /home/gvaibhav/Documents/TAM-MCP-Server
npm test tests/unit/services/dataSources/ --reporter=basic 2>&1 | grep -E "(Test Files|Tests|failed|passed)"
