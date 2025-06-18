#!/usr/bin/env node

/**
 * Tool Count and Uniqueness Validation
 * Part of the test suite to verify all 28 tools are unique and properly exposed
 */

import { getAllToolDefinitions } from '../../dist/tools/tool-definitions.js';

console.log('🔧 TAM MCP Server - Tool Validation');
console.log('=====================================\n');

try {
  const tools = getAllToolDefinitions();
  
  console.log(`✅ Total tools available: ${tools.length}`);
  
  if (tools.length !== 28) {
    console.error(`❌ Expected 28 tools, found ${tools.length}`);
    process.exit(1);
  }
  
  // Check for duplicates
  const names = tools.map(t => t.name);
  const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
  
  if (duplicates.length > 0) {
    console.error('❌ Duplicate tool names found:', duplicates);
    process.exit(1);
  }
  
  console.log('✅ No duplicate tool names found');
    // Categorize tools based on the actual architecture
  const dataAccessTools = tools.filter(t => 
    t.name.startsWith('alphaVantage_') || 
    t.name.startsWith('bls_') || 
    t.name.startsWith('census_') || 
    t.name.startsWith('fred_') || 
    t.name.startsWith('imf_') || 
    t.name.startsWith('nasdaq_') || 
    t.name.startsWith('oecd_') || 
    t.name.startsWith('worldBank_')
  );
  
  const basicMarketTools = tools.filter(t => 
    ['industry_search', 'tam_calculator', 'market_size_calculator', 'company_financials_retriever'].includes(t.name)
  );
  
  const businessAnalysisTools = tools.filter(t => 
    ['industry_analysis', 'industry_data', 'market_size', 'tam_analysis', 'sam_calculator', 
     'market_segments', 'market_forecasting', 'market_comparison', 'data_validation', 
     'market_opportunities', 'generic_data_query'].includes(t.name)
  );
  
  console.log(`\n📊 Tool Categories:`);
  console.log(`   - Data Access Tools: ${dataAccessTools.length}`);
  console.log(`   - Basic Market Tools: ${basicMarketTools.length}`);
  console.log(`   - Business Analysis Tools: ${businessAnalysisTools.length}`);
  
  // Verify expected structure
  if (dataAccessTools.length !== 13) {
    console.error(`❌ Expected 13 data access tools, found ${dataAccessTools.length}`);
    process.exit(1);
  }
  
  if (basicMarketTools.length !== 4) {
    console.error(`❌ Expected 4 basic market tools, found ${basicMarketTools.length}`);
    process.exit(1);
  }
  
  if (businessAnalysisTools.length !== 11) {
    console.error(`❌ Expected 11 business analysis tools, found ${businessAnalysisTools.length}`);
    process.exit(1);
  }
  
  console.log('\n✅ All tool validation checks passed!');
  console.log('✅ 28 unique tools properly exposed');
  console.log('✅ Tool categorization correct (13+4+11)');
  
} catch (error) {
  console.error('❌ Tool validation failed:', error.message);
  process.exit(1);
}
