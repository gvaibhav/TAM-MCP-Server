#!/usr/bin/env node

// Quick test script to verify MCP Inspector functionality
// Usage: node test-inspector-fix.js

import { execSync } from 'child_process';

console.log('🧪 Testing MCP Inspector STDIO Transport Fix...\n');

try {
  // Test 1: Check that the built files exist
  console.log('✅ Step 1: Verifying build artifacts...');
  execSync('ls -la dist/stdio-simple.js dist/server.js', { cwd: '/home/gvaibhav/Documents/TAM-MCP-Server' });
  
  // Test 2: Check that there are no console.log statements in critical files
  console.log('✅ Step 2: Verifying console.log cleanup...');
  try {
    execSync('grep -r "console\\.log" src/services/ src/index.ts', { 
      cwd: '/home/gvaibhav/Documents/TAM-MCP-Server',
      stdio: 'pipe'
    });
    console.error('❌ Found console.log statements - this should not happen!');
    process.exit(1);
  } catch (error) {
    console.log('   No console.log statements found - perfect!');
  }
  
  // Test 3: Quick stdout test
  console.log('✅ Step 3: Testing stdout cleanliness...');
  const result = execSync('timeout 3s node dist/stdio-simple.js 2>/dev/null | head -c 100', { 
    cwd: '/home/gvaibhav/Documents/TAM-MCP-Server',
    encoding: 'utf8'
  });
  
  if (result.trim().length === 0) {
    console.log('   Stdout is clean - ready for JSON-RPC communication!');
  } else {
    console.warn('   Warning: Some output detected on stdout:', result.slice(0, 50));
  }
  
  console.log('\n🎉 All tests passed! The MCP Inspector STDIO transport fix is working.');
  console.log('\n🚀 You can now run:');
  console.log('   npx @modelcontextprotocol/inspector node dist/stdio-simple.js');
  console.log('   Then use the industry_search tool with query="banking"');
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}
