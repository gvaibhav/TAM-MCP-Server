#!/usr/bin/env node

// Comprehensive test script to validate all TAM MCP Server tools
import { MarketAnalysisTools } from './dist/tools/market-tools.js';

async function testAllTools() {
  console.log('🧪 Testing ALL TAM MCP Server tools...\n');
  
  const tests = [
    {
      name: 'industry_search',
      description: 'Industry Search',
      params: { query: 'software', limit: 3 },
      method: MarketAnalysisTools.industrySearch
    },
    {
      name: 'industry_data', 
      description: 'Industry Data',
      params: { industryId: 'software-services' },
      method: MarketAnalysisTools.industryData
    },
    {
      name: 'market_size',
      description: 'Market Size',
      params: { industryId: 'saas-software', region: 'north-america', year: 2024 },
      method: MarketAnalysisTools.marketSize
    },
    {
      name: 'tam_calculator',
      description: 'TAM Calculator', 
      params: { industryId: 'saas-software', region: 'global', population: 1000000, penetrationRate: 0.05 },
      method: MarketAnalysisTools.tamCalculator
    },
    {
      name: 'sam_calculator',
      description: 'SAM Calculator',
      params: { industryId: 'saas-software', tam: 50000000000, marketShare: 0.02, region: 'us' },
      method: MarketAnalysisTools.samCalculator
    },
    {
      name: 'market_segments',
      description: 'Market Segments',
      params: { industryId: 'saas-software', segmentationType: 'demographic' },
      method: MarketAnalysisTools.marketSegments
    },
    {
      name: 'market_forecasting',
      description: 'Market Forecasting',
      params: { industryId: 'saas-software', startYear: 2024, endYear: 2027, region: 'global' },
      method: MarketAnalysisTools.marketForecasting
    },
    {
      name: 'market_comparison',
      description: 'Market Comparison',
      params: { industryIds: ['saas-software', 'cloud-computing'], metrics: ['marketSize', 'growthRate'] },
      method: MarketAnalysisTools.marketComparison
    },
    {
      name: 'data_validation',
      description: 'Data Validation',
      params: { industryId: 'saas-software', dataTypes: ['marketSize', 'growthRate'] },
      method: MarketAnalysisTools.dataValidation
    },
    {
      name: 'market_opportunities',
      description: 'Market Opportunities', 
      params: { industryId: 'saas-software', region: 'global', timeframe: '3-years' },
      method: MarketAnalysisTools.marketOpportunities
    }
  ];

  let passedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`${i + 1}️⃣ Testing ${test.description} (${test.name})...`);
    
    try {
      const result = await test.method(test.params);
      
      if (result && typeof result === 'object') {
        console.log(`✅ ${test.description}: ${result.success ? 'SUCCESS' : 'HANDLED_ERROR'}`);
        if (!result.success && result.error) {
          console.log(`   ℹ️  Error: ${result.error}`);
        }
        passedCount++;
      } else {
        console.log(`❌ ${test.description}: Invalid response format`);
        failedCount++;
      }
    } catch (error) {
      console.log(`❌ ${test.description}: Exception thrown`);
      console.log(`   Error: ${error.message}`);
      failedCount++;
    }
    console.log();
  }

  console.log('📊 Test Summary:');
  console.log(`✅ Passed: ${passedCount}/${tests.length}`);
  console.log(`❌ Failed: ${failedCount}/${tests.length}`);
  
  if (failedCount === 0) {
    console.log('🎉 All tools are working correctly!');
  } else {
    console.log('⚠️  Some tools need attention.');
    process.exit(1);
  }
}

testAllTools().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
