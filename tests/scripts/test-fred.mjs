#!/usr/bin/env node

// Test script to verify FRED API key is working
import * as dotenv from 'dotenv';
import { FredService } from '../dist/services/datasources/FredService.js';

// Load environment variables
dotenv.config();

async function testFred() {
  console.log('Testing FRED API with real key...');
  
  const apiKey = process.env.FRED_API_KEY;
  console.log('API Key status:', apiKey ? 'SET' : 'NOT SET');
  
  if (!apiKey) {
    console.error('❌ FRED_API_KEY not found in environment');
    process.exit(1);
  }
  
  const service = new FredService(apiKey);
  
  try {
    // Test service availability
    const isAvailable = await service.isAvailable();
    console.log('Service availability:', isAvailable ? '✅ Available' : '❌ Not Available');
    
    if (isAvailable) {
      console.log('✅ FRED service is working with real API key!');
      
      // Try a simple data fetch
      try {
        console.log('Attempting to fetch sample GDP data...');
        const sampleData = await service.getGdpData('US', 2023);
        console.log('Sample data fetch result:', sampleData ? '✅ Success' : '⚠️ No data returned');
        if (sampleData) {
          console.log('Sample data keys:', Object.keys(sampleData));
        }
      } catch (dataError) {
        console.log('⚠️ Data fetch failed:', dataError.message);
      }
    }
  } catch (error) {
    console.error('❌ Error testing FRED service:', error.message);
    process.exit(1);
  }
}

testFred().catch(console.error);
