#!/usr/bin/env node

// Test script to verify Nasdaq API key is working
import * as dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables
dotenv.config();

async function testNasdaq() {
  console.log('Testing Nasdaq Data Link API with real key...');
  
  const apiKey = process.env.NASDAQ_DATA_LINK_API_KEY;
  console.log('API Key status:', apiKey ? 'SET' : 'NOT SET');
  
  if (!apiKey) {
    console.error('❌ NASDAQ_DATA_LINK_API_KEY not found in environment');
    process.exit(1);
  }

  try {
    // Test 1: Try the same endpoint as the health check but with API key
    console.log('\n🔍 Testing deprecated WIKI endpoint (from health check)...');
    try {
      const wikiResponse = await axios.get(
        'https://data.nasdaq.com/api/v3/datasets/WIKI/AAPL.json?rows=1',
        { 
          timeout: 10000,
          params: { api_key: apiKey }
        }
      );
      console.log('WIKI endpoint result:', wikiResponse.status, '✅ SUCCESS');
    } catch (wikiError) {
      console.log('WIKI endpoint failed:', wikiError.response?.status, wikiError.response?.statusText);
      if (wikiError.response?.status === 403) {
        console.log('💡 WIKI dataset is likely deprecated and no longer accessible');
      }
    }

    // Test 2: Try a more modern dataset
    console.log('\n🔍 Testing modern dataset endpoint...');
    try {
      const modernResponse = await axios.get(
        'https://data.nasdaq.com/api/v3/datasets.json',
        { 
          timeout: 10000,
          params: { 
            api_key: apiKey,
            query: 'GDP',
            per_page: 1
          }
        }
      );
      console.log('Modern endpoint result:', modernResponse.status, '✅ SUCCESS');
      console.log('Sample data:', modernResponse.data.datasets?.[0]?.name || 'No datasets found');
    } catch (modernError) {
      console.log('Modern endpoint failed:', modernError.response?.status, modernError.response?.statusText);
    }

    // Test 3: Check API key validity with a simple endpoint
    console.log('\n🔍 Testing API key validity...');
    try {
      const keyTestResponse = await axios.get(
        'https://data.nasdaq.com/api/v3/datasets/FRED/GDP.json',
        { 
          timeout: 10000,
          params: { 
            api_key: apiKey,
            rows: 1
          }
        }
      );
      console.log('API key test result:', keyTestResponse.status, '✅ API KEY VALID');
    } catch (keyError) {
      console.log('API key test failed:', keyError.response?.status, keyError.response?.statusText);
      if (keyError.response?.status === 403) {
        console.log('❌ API key appears to be invalid or expired');
      } else if (keyError.response?.status === 429) {
        console.log('⚠️ Rate limit reached');
      }
    }

  } catch (error) {
    console.error('❌ Error testing Nasdaq service:', error.message);
  }
}

testNasdaq().catch(console.error);
