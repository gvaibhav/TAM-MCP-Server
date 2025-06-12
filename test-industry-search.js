#!/usr/bin/env node

// Test script for enhanced industry search functionality
import { MarketAnalysisTools } from './dist/tools/market-tools.js';

async function testIndustrySearch() {
  console.log('🧪 Testing Enhanced Industry Search Functionality');
  console.log('=' .repeat(60));

  const testQueries = [
    'healthcare',
    'software', 
    'fintech',
    'construction',
    'manufacturing',
    'technology'
  ];

  for (const query of testQueries) {
    console.log(`\n🔍 Testing query: "${query}"`);
    console.log('-'.repeat(40));
    
    try {
      const result = await MarketAnalysisTools.industrySearch({
        query: query,
        limit: 5,
        includeSubIndustries: true
      });

      if (result.success) {
        console.log(`✅ Found ${result.data.industries.length} results`);
        console.log(`📊 Total sources processed: ${result.data.totalResults}`);
        
        if (result.data.industries.length > 0) {
          console.log('\n📋 Sample results:');
          result.data.industries.slice(0, 3).forEach((industry, index) => {
            console.log(`  ${index + 1}. ${industry.name} (${industry.source || 'unknown'})`);
            console.log(`     NAICS: ${industry.naicsCode || 'N/A'} | Market Size: ${industry.marketSize || 'N/A'}`);
            console.log(`     Relevance: ${industry.relevanceScore || 'N/A'} | Growth: ${industry.growthRate || 'N/A'}`);
          });
        }
      } else {
        console.log(`❌ Search failed: ${result.error}`);
      }
      
    } catch (error) {
      console.log(`💥 Error: ${error.message}`);
    }
  }

  console.log('\n📈 Testing data source availability...');
  console.log('-'.repeat(40));
  
  try {
    // Test direct access to DataService
    const dataService = MarketAnalysisTools.dataService;
    
    // Test with software query to see specific data sources
    const softwareResults = await dataService.searchIndustries('software', 10);
    console.log(`✅ DataService direct call found ${softwareResults.length} results`);
    
    // Show breakdown by source
    const sourceBreakdown = softwareResults.reduce((acc, result) => {
      const source = result.source || 'unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});
    
    console.log('📊 Results by data source:');
    Object.entries(sourceBreakdown).forEach(([source, count]) => {
      console.log(`  ${source}: ${count} results`);
    });
    
  } catch (error) {
    console.log(`💥 DataService test error: ${error.message}`);
  }

  console.log('\n🎯 Test Summary Complete');
}

// Run the test
testIndustrySearch().catch(console.error);
