#!/usr/bin/env node

// Simple test script to validate the MCP tools work correctly
import { MarketAnalysisTools } from './dist/tools/market-tools.js';

async function testTools() {
  console.log('🧪 Testing TAM MCP Server tools directly...\n');
  
  try {
    // Test 1: List available tools
    console.log('1️⃣ Testing tool definitions...');
    const tools = MarketAnalysisTools.getToolDefinitions();
    console.log(`✅ Found ${tools.length} tools:`);
    tools.forEach(tool => {
      console.log(`   - ${tool.name}: ${tool.description}`);
    });
    console.log();
    
    // Test 2: Call industry search tool
    console.log('2️⃣ Testing industry search tool...');
    const searchResult = await MarketAnalysisTools.industrySearch({
      query: 'cloud computing',
      limit: 3
    });
    console.log('✅ Industry search results:');
    console.log(JSON.stringify(searchResult, null, 2));
    console.log();
    
    // Test 3: Call market size tool  
    console.log('3️⃣ Testing market size tool...');
    const marketResult = await MarketAnalysisTools.marketSize({
      industryId: 'saas-software',
      region: 'north-america',
      year: 2024
    });
    console.log('✅ Market size results:');
    console.log(JSON.stringify(marketResult, null, 2));
    console.log();
    
    console.log('🎉 All tests passed! TAM MCP Server tools are working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testTools().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
