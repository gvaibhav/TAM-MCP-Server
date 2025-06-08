#!/usr/bin/env node

console.log('Testing basic import...');

try {
  const { MarketAnalysisTools } = await import('./dist/tools/market-tools.js');
  console.log('✅ Import successful');
  
  const tools = MarketAnalysisTools.getToolDefinitions();
  console.log(`✅ Found ${tools.length} tools`);
  
  console.log('Testing first tool method...');
  const result = await MarketAnalysisTools.industrySearch({ query: 'test', limit: 1 });
  console.log('✅ First tool call successful:', result.success);
  
} catch (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}

console.log('🎉 Basic test completed successfully!');
