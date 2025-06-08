#!/usr/bin/env node

// Simple test script to validate the MCP tools work correctly
import { createServer } from './dist/server.js';

async function testTools() {
  console.log('🧪 Testing TAM MCP Server tools...\n');
  
  try {
    const { server, cleanup } = await createServer();
    
    // Test 1: List available tools
    console.log('1️⃣ Testing tool listing...');
    const listResult = await server.request(
      { method: 'tools/list' },
      { type: 'tools/list' }
    );
    console.log(`✅ Found ${listResult.tools.length} tools`);
    listResult.tools.forEach(tool => {
      console.log(`   - ${tool.name}: ${tool.description}`);
    });
    console.log();
    
    // Test 2: Call industry search tool
    console.log('2️⃣ Testing industry search tool...');
    const searchResult = await server.request(
      {
        method: 'tools/call',
        params: {
          name: 'industry_search',
          arguments: {
            query: 'cloud computing',
            limit: 3
          }
        }
      },
      { type: 'tools/call' }
    );
    console.log('✅ Industry search results:');
    console.log(searchResult.content[0].text);
    console.log();
    
    // Test 3: Call market size tool  
    console.log('3️⃣ Testing market size tool...');
    const marketResult = await server.request(
      {
        method: 'tools/call',
        params: {
          name: 'market_size',
          arguments: {
            industry: 'Software as a Service',
            region: 'North America',
            year: 2024
          }
        }
      },
      { type: 'tools/call' }
    );
    console.log('✅ Market size results:');
    console.log(marketResult.content[0].text);
    console.log();
    
    console.log('🎉 All tests passed! TAM MCP Server is working correctly.');
    
    await cleanup();
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testTools();
