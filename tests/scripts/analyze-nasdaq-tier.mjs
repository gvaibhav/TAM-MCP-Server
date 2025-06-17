#!/usr/bin/env node

// Test script to check Nasdaq API access level and pricing tier
import * as dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables
dotenv.config();

async function analyzeNasdaqAccess() {
  console.log('🔍 Analyzing Nasdaq Data Link API Access Level...\n');
  
  const apiKey = process.env.NASDAQ_DATA_LINK_API_KEY;
  console.log('API Key:', apiKey ? 'SET' : 'NOT SET');
  
  if (!apiKey) {
    console.error('❌ NASDAQ_DATA_LINK_API_KEY not found in environment');
    return;
  }

  // Test different access patterns to determine tier
  const tests = [
    {
      name: 'Free Tier Test - WIKI Data (Deprecated)',
      url: 'https://data.nasdaq.com/api/v3/datasets/WIKI/AAPL.json',
      params: { api_key: apiKey, rows: 1 },
      description: 'WIKI database was free but deprecated in 2018'
    },
    {
      name: 'Free Tier Test - FRED Economic Data',
      url: 'https://data.nasdaq.com/api/v3/datasets/FRED/GDP.json',
      params: { api_key: apiKey, rows: 1 },
      description: 'FRED data through Nasdaq (usually free)'
    },
    {
      name: 'API Account Info',
      url: 'https://data.nasdaq.com/api/v3/account.json',
      params: { api_key: apiKey },
      description: 'Check account status and limits'
    },
    {
      name: 'General Datasets Search',
      url: 'https://data.nasdaq.com/api/v3/datasets.json',
      params: { api_key: apiKey, query: 'stock', per_page: 1 },
      description: 'Search available datasets'
    },
    {
      name: 'Premium Database Test',
      url: 'https://data.nasdaq.com/api/v3/datasets/EOD/AAPL.json',
      params: { api_key: apiKey, rows: 1 },
      description: 'End of Day stock data (typically premium)'
    }
  ];

  for (const test of tests) {
    console.log(`\n📊 ${test.name}`);
    console.log(`   ${test.description}`);
    
    try {
      const response = await axios.get(test.url, {
        params: test.params,
        timeout: 10000
      });
      
      console.log(`   ✅ SUCCESS (${response.status})`);
      
      // Analyze response for tier indicators
      if (response.data.dataset) {
        console.log(`   📈 Dataset: ${response.data.dataset.name}`);
        if (response.data.dataset.premium === true) {
          console.log('   💎 PREMIUM dataset');
        } else if (response.data.dataset.premium === false) {
          console.log('   🆓 FREE dataset');
        }
      }
      
      if (response.data.account) {
        console.log(`   👤 Account Type: ${response.data.account.plan || 'Unknown'}`);
        console.log(`   📊 API Calls Today: ${response.data.account.calls_today || 'Unknown'}`);
        console.log(`   🔄 API Call Limit: ${response.data.account.call_limit || 'Unknown'}`);
      }
      
      if (response.data.datasets && response.data.datasets.length > 0) {
        const dataset = response.data.datasets[0];
        console.log(`   📊 Sample Dataset: ${dataset.name}`);
        if (dataset.premium) {
          console.log('   💎 Contains PREMIUM datasets');
        }
      }
      
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.quandl_error?.message || error.message;
      
      if (status === 403) {
        console.log(`   ❌ FORBIDDEN (403): ${message}`);
        console.log('   💡 This suggests either:');
        console.log('      - API key is invalid/expired');
        console.log('      - Dataset requires premium subscription');
        console.log('      - Rate limit exceeded');
      } else if (status === 404) {
        console.log(`   ⚠️  NOT FOUND (404): Dataset may be deprecated`);
      } else if (status === 429) {
        console.log(`   ⏰ RATE LIMITED (429): Too many requests`);
      } else {
        console.log(`   ❌ FAILED (${status}): ${message}`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📋 ANALYSIS SUMMARY:');
  console.log('='.repeat(60));
  console.log('• Nasdaq Data Link has different tiers:');
  console.log('  🆓 FREE: Limited datasets (FRED, some deprecated ones)');
  console.log('  💎 PREMIUM: Full access to stock/financial data');
  console.log('• WIKI database was discontinued in 2018');
  console.log('• Most financial datasets now require premium subscription');
  console.log('• Free tier mainly covers economic data (FRED, etc.)');
}

analyzeNasdaqAccess().catch(console.error);
