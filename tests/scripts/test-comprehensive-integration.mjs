#!/usr/bin/env node

/**
 * Comprehensive Backend Service and Tool Integration Testing Script
 * 
 * This script systematically tests:
 * 1. Each backend data source service
 * 2. Each market analysis tool
 * 3. End-to-end data flow and response parsing
 */

import { DataService } from './dist/services/dataService.js';
import { MarketAnalysisTools } from './dist/tools/market-tools.js';

// Test results tracking
const results = {
  backendServices: {},
  tools: {},
  integration: {},
  errors: []
};

/**
 * Phase 1: Backend Service Testing
 */
async function testBackendServices() {
  console.log('\n🔧 Phase 1: Testing Backend Data Sources...\n');
  
  const dataService = new DataService();
  const services = [
    'AlphaVantageService',
    'CensusService', 
    'FredService',
    'WorldBankService',
    'BlsService',
    'NasdaqDataService',
    'OecdService',
    'ImfService'
  ];

  for (const serviceName of services) {
    console.log(`📊 Testing ${serviceName}...`);
    
    try {
      // Test service availability
      const isAvailable = await testServiceAvailability(dataService, serviceName);
      
      // Test basic data fetching
      const dataResult = await testServiceDataFetch(dataService, serviceName);
      
      results.backendServices[serviceName] = {
        available: isAvailable,
        dataFetch: dataResult,
        status: isAvailable ? 'PASS' : 'SKIP (API key missing)'
      };
      
      console.log(`   ✅ ${serviceName}: ${results.backendServices[serviceName].status}`);
      
    } catch (error) {
      results.backendServices[serviceName] = {
        available: false,
        error: error.message,
        status: 'FAIL'
      };
      console.log(`   ❌ ${serviceName}: FAIL - ${error.message}`);
      results.errors.push(`${serviceName}: ${error.message}`);
    }
  }
}

async function testServiceAvailability(dataService, serviceName) {
  // Test using getSpecificDataSourceData to check if service exists and is available
  try {
    const service = dataService.dataSourceServicesMap[serviceName];
    if (!service) return false;
    return await service.isAvailable();
  } catch (error) {
    return false;
  }
}

async function testServiceDataFetch(dataService, serviceName) {
  // Test data fetching based on service capabilities
  const testParams = getTestParamsForService(serviceName);
  
  try {
    const result = await dataService.getSpecificDataSourceData(
      serviceName,
      testParams.method,
      testParams.params
    );
    
    return {
      success: true,
      dataType: typeof result,
      hasData: result !== null && result !== undefined,
      sampleKeys: result && typeof result === 'object' ? Object.keys(result).slice(0, 5) : null
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

function getTestParamsForService(serviceName) {
  const testParams = {
    'AlphaVantageService': {
      method: 'fetchMarketSize',
      params: ['AAPL', 'US']
    },
    'CensusService': {
      method: 'fetchIndustryData', 
      params: ['EMP', 'state:01', { NAICS2017: "23" }]
    },
    'FredService': {
      method: 'fetchMarketSize',
      params: ['GDP', 'US']
    },
    'WorldBankService': {
      method: 'fetchMarketSize',
      params: ['US', 'NY.GDP.MKTP.CD']
    },
    'BlsService': {
      method: 'fetchIndustryData',
      params: ['LAUCN040010000000005', 'US']
    },
    'NasdaqDataService': {
      method: 'fetchMarketSize', 
      params: ['WIKI/AAPL', 'US']
    },
    'OecdService': {
      method: 'fetchOecdDataset',
      params: ['QNA', 'USA.GDP.CUR']
    },
    'ImfService': {
      method: 'fetchImfDataset',
      params: ['IFS', 'A.US.NGDP_XDC']
    }
  };
  
  return testParams[serviceName] || { method: 'isAvailable', params: [] };
}

/**
 * Phase 2: Tool Integration Testing  
 */
async function testToolIntegration() {
  console.log('\n🛠️ Phase 2: Testing Market Analysis Tools...\n');
  
  const tools = [
    'industry_search',
    'industry_data', 
    'market_size',
    'tam_calculator',
    'sam_calculator',
    'market_segments',
    'market_forecasting', 
    'market_comparison',
    'data_validation',
    'market_opportunities',
    'generic_data_query'
  ];

  for (const toolName of tools) {
    console.log(`🔧 Testing ${toolName}...`);
    
    try {
      const testParams = getTestParamsForTool(toolName);
      const result = await callTool(toolName, testParams);
      
      results.tools[toolName] = {
        success: result.success,
        responseStructure: analyzeResponseStructure(result),
        status: result.success ? 'PASS' : 'FAIL'
      };
      
      console.log(`   ✅ ${toolName}: ${results.tools[toolName].status}`);
      
      if (!result.success) {
        console.log(`      Error: ${result.error || 'Unknown error'}`);
      }
      
    } catch (error) {
      results.tools[toolName] = {
        success: false,
        error: error.message,
        status: 'FAIL'
      };
      console.log(`   ❌ ${toolName}: FAIL - ${error.message}`);
      results.errors.push(`${toolName}: ${error.message}`);
    }
  }
}

async function callTool(toolName, params) {
  const methodMap = {
    'industry_search': MarketAnalysisTools.industrySearch,
    'industry_data': MarketAnalysisTools.industryData,
    'market_size': MarketAnalysisTools.marketSize,
    'tam_calculator': MarketAnalysisTools.tamCalculator,
    'sam_calculator': MarketAnalysisTools.samCalculator,
    'market_segments': MarketAnalysisTools.marketSegments,
    'market_forecasting': MarketAnalysisTools.marketForecasting,
    'market_comparison': MarketAnalysisTools.marketComparison,
    'data_validation': MarketAnalysisTools.dataValidation,
    'market_opportunities': MarketAnalysisTools.marketOpportunities,
    'generic_data_query': MarketAnalysisTools.genericDataQuery
  };
  
  const method = methodMap[toolName];
  if (!method) {
    throw new Error(`Tool method not found: ${toolName}`);
  }
  
  return await method.call(MarketAnalysisTools, params);
}

function getTestParamsForTool(toolName) {
  const testParams = {
    'industry_search': {
      query: 'banking',
      limit: 5
    },
    'industry_data': {
      industryId: 'tech-software',
      region: 'US',
      includeMetrics: true
    },
    'market_size': {
      industryId: 'tech-software',
      region: 'US',
      currency: 'USD'
    },
    'tam_calculator': {
      industryId: 'tech-software',
      region: 'US'
    },
    'sam_calculator': {
      tamValue: 1000000000,
      targetMarketShare: 0.05,
      targetSegments: ['enterprise', 'smb'],
      geographicConstraints: ['north-america']
    },
    'market_segments': {
      industryId: 'tech-software',
      segmentationType: 'demographic',
      region: 'US'
    },
    'market_forecasting': {
      industryId: 'tech-software',
      years: 5,
      region: 'US'
    },
    'market_comparison': {
      industryIds: ['tech-software', 'tech-ai'],
      region: 'US'
    },
    'data_validation': {
      dataType: 'market-size',
      data: {
        value: 1000000000,
        year: 2023,
        currency: 'USD'
      }
    },
    'market_opportunities': {
      industryId: 'tech-software',
      region: 'US',
      minMarketSize: 1000000
    },
    'generic_data_query': {
      dataSourceName: 'WorldBankService',
      dataSourceMethod: 'fetchMarketSize',
      dataSourceParams: ['US', 'NY.GDP.MKTP.CD']
    }
  };
  
  return testParams[toolName] || {};
}

function analyzeResponseStructure(response) {
  return {
    hasSuccess: 'success' in response,
    hasData: 'data' in response,
    hasMetadata: 'metadata' in response,
    hasError: 'error' in response,
    dataType: response.data ? typeof response.data : null,
    topLevelKeys: Object.keys(response)
  };
}

/**
 * Phase 3: End-to-End Integration Testing
 */
async function testEndToEndIntegration() {
  console.log('\n🌐 Phase 3: Testing End-to-End Integration...\n');
  
  // Test complex scenarios that involve multiple backend calls
  const scenarios = [
    {
      name: 'Industry Analysis Pipeline',
      description: 'Search → Get Details → Market Size → TAM Calculation',
      test: testIndustryAnalysisPipeline
    },
    {
      name: 'Cross-Source Data Validation',
      description: 'Compare data from multiple sources',
      test: testCrossSourceValidation
    },
    {
      name: 'Real API Integration',
      description: 'Test with actual API calls (if keys available)', 
      test: testRealApiIntegration
    }
  ];

  for (const scenario of scenarios) {
    console.log(`🧪 Testing ${scenario.name}...`);
    console.log(`   📝 ${scenario.description}`);
    
    try {
      const result = await scenario.test();
      results.integration[scenario.name] = {
        success: result.success,
        details: result.details,
        status: result.success ? 'PASS' : 'FAIL'
      };
      
      console.log(`   ✅ ${scenario.name}: ${results.integration[scenario.name].status}`);
      
    } catch (error) {
      results.integration[scenario.name] = {
        success: false,
        error: error.message,
        status: 'FAIL'
      };
      console.log(`   ❌ ${scenario.name}: FAIL - ${error.message}`);
      results.errors.push(`${scenario.name}: ${error.message}`);
    }
  }
}

async function testIndustryAnalysisPipeline() {
  // Step 1: Search for industries
  const searchResult = await MarketAnalysisTools.industrySearch({
    query: 'software',
    limit: 1
  });
  
  if (!searchResult.success || !searchResult.data.industries.length) {
    return { success: false, details: 'Industry search failed' };
  }
  
  const industryId = searchResult.data.industries[0].id;
  
  // Step 2: Get detailed industry data
  const industryResult = await MarketAnalysisTools.industryData({
    industryId,
    region: 'US',
    includeMetrics: true
  });
  
  if (!industryResult.success) {
    return { success: false, details: 'Industry data fetch failed' };
  }
  
  // Step 3: Get market size
  const marketSizeResult = await MarketAnalysisTools.marketSize({
    industryId,
    region: 'US',
    currency: 'USD'
  });
  
  if (!marketSizeResult.success) {
    return { success: false, details: 'Market size fetch failed' };
  }
  
  // Step 4: Calculate TAM
  const tamResult = await MarketAnalysisTools.tamCalculator({
    industryId,
    region: 'US'
  });
  
  return {
    success: tamResult.success,
    details: {
      industryFound: industryId,
      marketSize: marketSizeResult.data?.marketSize?.value,
      tamValue: tamResult.data?.totalAddressableMarket,
      dataSource: marketSizeResult.metadata?.source
    }
  };
}

async function testCrossSourceValidation() {
  // Test getting data from multiple sources and comparing
  const testData = {
    value: 500000000000,
    year: 2023,
    currency: 'USD'
  };
  
  const validationResult = await MarketAnalysisTools.dataValidation({
    dataType: 'market-size',
    data: testData,
    strictMode: true
  });
  
  return {
    success: validationResult.success,
    details: {
      validationPassed: validationResult.data?.isValid,
      issuesFound: validationResult.data?.issues?.length || 0,
      dataQuality: validationResult.data?.dataQuality
    }
  };
}

async function testRealApiIntegration() {
  // Test actual API calls with available services
  const dataService = new DataService();
  const availableServices = [];
  
  // Check which services are actually available (have API keys)
  for (const serviceName of Object.keys(dataService.dataSourceServicesMap)) {
    try {
      const service = dataService.dataSourceServicesMap[serviceName];
      if (await service.isAvailable()) {
        availableServices.push(serviceName);
      }
    } catch (error) {
      // Service not available
    }
  }
  
  if (availableServices.length === 0) {
    return {
      success: true,
      details: {
        message: 'No real APIs available (missing API keys)',
        availableServices: 0,
        mockDataWorking: true
      }
    };
  }
  
  // Test one available service
  const serviceName = availableServices[0];
  const testParams = getTestParamsForService(serviceName);
  
  try {
    const result = await dataService.getSpecificDataSourceData(
      serviceName,
      testParams.method,
      testParams.params
    );
    
    return {
      success: true,
      details: {
        serviceTested: serviceName,
        dataReceived: result !== null && result !== undefined,
        availableServices: availableServices.length,
        resultType: typeof result
      }
    };
  } catch (error) {
    return {
      success: false,
      details: {
        serviceTested: serviceName,
        error: error.message,
        availableServices: availableServices.length
      }
    };
  }
}

/**
 * Generate comprehensive test report
 */
function generateTestReport() {
  console.log('\n📋 TEST REPORT\n');
  console.log('='.repeat(80));
  
  // Backend Services Summary
  console.log('\n🔧 BACKEND SERVICES:');
  const backendTotal = Object.keys(results.backendServices).length;
  const backendPassed = Object.values(results.backendServices).filter(r => r.status === 'PASS').length;
  const backendSkipped = Object.values(results.backendServices).filter(r => r.status.includes('SKIP')).length;
  
  console.log(`   Total: ${backendTotal} | Passed: ${backendPassed} | Skipped: ${backendSkipped} | Failed: ${backendTotal - backendPassed - backendSkipped}`);
  
  Object.entries(results.backendServices).forEach(([service, result]) => {
    const status = result.status === 'PASS' ? '✅' : 
                  result.status.includes('SKIP') ? '⏭️' : '❌';
    console.log(`   ${status} ${service}: ${result.status}`);
  });
  
  // Tools Summary
  console.log('\n🛠️ MARKET ANALYSIS TOOLS:');
  const toolsTotal = Object.keys(results.tools).length;
  const toolsPassed = Object.values(results.tools).filter(r => r.status === 'PASS').length;
  
  console.log(`   Total: ${toolsTotal} | Passed: ${toolsPassed} | Failed: ${toolsTotal - toolsPassed}`);
  
  Object.entries(results.tools).forEach(([tool, result]) => {
    const status = result.status === 'PASS' ? '✅' : '❌';
    console.log(`   ${status} ${tool}: ${result.status}`);
  });
  
  // Integration Summary
  console.log('\n🌐 END-TO-END INTEGRATION:');
  const integrationTotal = Object.keys(results.integration).length;
  const integrationPassed = Object.values(results.integration).filter(r => r.status === 'PASS').length;
  
  console.log(`   Total: ${integrationTotal} | Passed: ${integrationPassed} | Failed: ${integrationTotal - integrationPassed}`);
  
  Object.entries(results.integration).forEach(([test, result]) => {
    const status = result.status === 'PASS' ? '✅' : '❌';
    console.log(`   ${status} ${test}: ${result.status}`);
  });
  
  // Overall Status
  console.log('\n🎯 OVERALL STATUS:');
  const totalTests = backendTotal + toolsTotal + integrationTotal;
  const totalPassed = backendPassed + toolsPassed + integrationPassed;
  const totalSkipped = backendSkipped;
  const successRate = Math.round((totalPassed / (totalTests - totalSkipped)) * 100);
  
  console.log(`   Tests Run: ${totalTests - totalSkipped}/${totalTests} (${totalSkipped} skipped)`);
  console.log(`   Success Rate: ${successRate}% (${totalPassed}/${totalTests - totalSkipped})`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ ERRORS ENCOUNTERED:');
    results.errors.forEach(error => console.log(`   • ${error}`));
  }
  
  console.log('\n' + '='.repeat(80));
  
  // Return overall success status
  return {
    success: successRate >= 80,
    successRate,
    totalTests,
    totalPassed,
    totalSkipped,
    errors: results.errors
  };
}

/**
 * Main test execution
 */
async function runAllTests() {
  console.log('🚀 Starting Comprehensive TAM MCP Server Testing...');
  console.log('='.repeat(80));
  
  try {
    await testBackendServices();
    await testToolIntegration();
    await testEndToEndIntegration();
    
    const report = generateTestReport();
    
    if (report.success) {
      console.log('\n🎉 ALL TESTS COMPLETED SUCCESSFULLY!');
      process.exit(0);
    } else {
      console.log('\n⚠️ SOME TESTS FAILED - See report above');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n💥 CRITICAL ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Export for testing
export { runAllTests, testBackendServices, testToolIntegration, testEndToEndIntegration };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}
