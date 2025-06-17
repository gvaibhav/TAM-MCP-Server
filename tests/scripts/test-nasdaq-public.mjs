#!/usr/bin/env node

// Test script to check Nasdaq API without key
import axios from 'axios';

async function testNasdaqWithoutKey() {
  console.log('Testing Nasdaq Data Link API without API key...');

  try {
    // Test 1: Try without API key (public access)
    console.log('\n🔍 Testing without API key (public access)...');
    try {
      const publicResponse = await axios.get(
        'https://data.nasdaq.com/api/v3/datasets/WIKI/AAPL.json?rows=1',
        { timeout: 10000 }
      );
      console.log('Public access result:', publicResponse.status, '✅ SUCCESS');
    } catch (publicError) {
      console.log('Public access failed:', publicError.response?.status, publicError.response?.statusText);
    }

    // Test 2: Try a known good endpoint
    console.log('\n🔍 Testing known FRED dataset via Nasdaq...');
    try {
      const fredResponse = await axios.get(
        'https://data.nasdaq.com/api/v3/datasets/FRED/GDP.json?rows=1',
        { timeout: 10000 }
      );
      console.log('FRED via Nasdaq result:', fredResponse.status, '✅ SUCCESS');
    } catch (fredError) {
      console.log('FRED via Nasdaq failed:', fredError.response?.status, fredError.response?.statusText);
    }

    // Test 3: Just test the base API
    console.log('\n🔍 Testing base API endpoint...');
    try {
      const baseResponse = await axios.get(
        'https://data.nasdaq.com/api/v3/datasets.json?per_page=1',
        { timeout: 10000 }
      );
      console.log('Base API result:', baseResponse.status, '✅ SUCCESS');
    } catch (baseError) {
      console.log('Base API failed:', baseError.response?.status, baseError.response?.statusText);
    }

  } catch (error) {
    console.error('❌ Error testing Nasdaq service:', error.message);
  }
}

testNasdaqWithoutKey().catch(console.error);
