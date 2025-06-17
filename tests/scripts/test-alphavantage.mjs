#!/usr/bin/env node

// Test script to verify AlphaVantage API key is working
import * as dotenv from 'dotenv';
import { AlphaVantageService } from '../dist/services/datasources/AlphaVantageService.js';

// Load environment variables
dotenv.config();

async function testAlphaVantage() {
  console.log('Testing AlphaVantage API with real key...');
  
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  console.log('API Key status:', apiKey ? 'SET' : 'NOT SET');
  
  if (!apiKey) {
    console.error('❌ ALPHA_VANTAGE_API_KEY not found in environment');
    process.exit(1);
  }
  
  const service = new AlphaVantageService(apiKey);
  
  try {
    // Test service availability
    const isAvailable = await service.isAvailable();
    console.log('Service availability:', isAvailable ? '✅ Available' : '❌ Not Available');
    
    if (isAvailable) {
      console.log('✅ AlphaVantage service is working with real API key!');
      
      // Try a simple data fetch (optional - comment out if rate limiting is a concern)
      try {
        console.log('Attempting to fetch sample data for AAPL...');
        const sampleData = await service.getMarketData('AAPL', 2023, 'US');
        console.log('Sample data fetch result:', sampleData ? '✅ Success' : '⚠️ No data returned');
      } catch (dataError) {
        console.log('⚠️ Data fetch failed (may be expected due to rate limits):', dataError.message);
      }
    }
  } catch (error) {
    console.error('❌ Error testing AlphaVantage service:', error.message);
    process.exit(1);
  }
}

testAlphaVantage().catch(console.error);
