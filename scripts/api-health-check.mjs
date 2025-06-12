#!/usr/bin/env node
/**
 * API Health Check Script for TAM MCP Server
 * Tests connectivity and functionality of all configured data sources
 */

import dotenv from 'dotenv';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const TIMEOUT = 10000; // 10 seconds
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

class ApiHealthChecker {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      total: 0
    };
  }

  log(message, color = '') {
    console.log(`${color}${message}${colors.reset}`);
  }

  logSuccess(message) {
    this.log(`✅ ${message}`, colors.green);
    this.results.passed++;
  }

  logError(message) {
    this.log(`❌ ${message}`, colors.red);
    this.results.failed++;
  }

  logWarning(message) {
    this.log(`⚠️  ${message}`, colors.yellow);
    this.results.warnings++;
  }

  logInfo(message) {
    this.log(`ℹ️  ${message}`, colors.blue);
  }

  async checkAlphaVantage() {
    this.log('\n📊 Testing Alpha Vantage API...', colors.bold);
    this.results.total++;

    const apiKey = process.env.ALPHA_VANTAGE_API_KEY || 'demo';
    
    if (apiKey === 'demo') {
      this.logWarning('Using demo API key for Alpha Vantage - limited functionality');
    }

    try {
      const response = await axios.get(
        `https://www.alphavantage.co/query?function=OVERVIEW&symbol=IBM&apikey=${apiKey}`,
        { timeout: TIMEOUT }
      );

      if (response.status === 200) {
        if (response.data['Error Message']) {
          this.logError(`Alpha Vantage API error: ${response.data['Error Message']}`);
        } else if (response.data['Note']) {
          this.logWarning(`Alpha Vantage rate limit: ${response.data['Note']}`);
        } else {
          this.logSuccess('Alpha Vantage API is accessible');
        }
      } else {
        this.logError(`Alpha Vantage returned status: ${response.status}`);
      }
    } catch (error) {
      this.logError(`Alpha Vantage connection failed: ${error.message}`);
    }
  }

  async checkFRED() {
    this.log('\n🏦 Testing FRED API...', colors.bold);
    this.results.total++;

    const apiKey = process.env.FRED_API_KEY;
    
    if (!apiKey) {
      this.logWarning('FRED API key not configured - public endpoints only');
    }

    try {
      const url = apiKey 
        ? `https://api.stlouisfed.org/fred/series?series_id=GDP&api_key=${apiKey}&file_type=json`
        : 'https://api.stlouisfed.org/fred/series?series_id=GDP&file_type=json';

      const response = await axios.get(url, { timeout: TIMEOUT });

      if (response.status === 200) {
        if (response.data.error_code) {
          this.logError(`FRED API error: ${response.data.error_message}`);
        } else {
          this.logSuccess('FRED API is accessible');
        }
      } else {
        this.logError(`FRED returned status: ${response.status}`);
      }
    } catch (error) {
      this.logError(`FRED connection failed: ${error.message}`);
    }
  }

  async checkWorldBank() {
    this.log('\n🌍 Testing World Bank API...', colors.bold);
    this.results.total++;

    try {
      const response = await axios.get(
        'https://api.worldbank.org/v2/country/US/indicator/NY.GDP.MKTP.CD?format=json&date=2022',
        { timeout: TIMEOUT }
      );

      if (response.status === 200 && Array.isArray(response.data) && response.data.length > 1) {
        this.logSuccess('World Bank API is accessible');
      } else {
        this.logError('World Bank API returned unexpected format');
      }
    } catch (error) {
      this.logError(`World Bank connection failed: ${error.message}`);
    }
  }

  async checkIMF() {
    this.log('\n💰 Testing IMF API...', colors.bold);
    this.results.total++;

    try {
      const response = await axios.get(
        'http://dataservices.imf.org/REST/SDMX_JSON.svc/DataStructure/IFS',
        { timeout: TIMEOUT }
      );

      if (response.status === 200) {
        this.logSuccess('IMF API is accessible');
      } else {
        this.logError(`IMF returned status: ${response.status}`);
      }
    } catch (error) {
      this.logError(`IMF connection failed: ${error.message}`);
    }
  }

  async checkOECD() {
    this.log('\n📈 Testing OECD API...', colors.bold);
    this.results.total++;

    try {
      const response = await axios.get(
        'https://stats.oecd.org/SDMX-JSON/data/QNA/USA.B1_GE.VOBARSA.Q/all?startTime=2020&endTime=2022',
        { timeout: TIMEOUT }
      );

      if (response.status === 200) {
        this.logSuccess('OECD API is accessible');
      } else {
        this.logError(`OECD returned status: ${response.status}`);
      }
    } catch (error) {
      this.logError(`OECD connection failed: ${error.message}`);
    }
  }

  async checkBLS() {
    this.log('\n👥 Testing BLS API...', colors.bold);
    this.results.total++;

    const apiKey = process.env.BLS_API_KEY;
    
    if (!apiKey) {
      this.logWarning('BLS API key not configured - using public endpoint');
    }

    try {
      const url = 'https://api.bls.gov/publicAPI/v2/timeseries/data/LAUCN040010000000005';
      const response = await axios.get(url, { timeout: TIMEOUT });

      if (response.status === 200) {
        if (response.data.status === 'REQUEST_SUCCEEDED') {
          this.logSuccess('BLS API is accessible');
        } else {
          this.logError(`BLS API error: ${response.data.message}`);
        }
      } else {
        this.logError(`BLS returned status: ${response.status}`);
      }
    } catch (error) {
      this.logError(`BLS connection failed: ${error.message}`);
    }
  }

  async checkCensus() {
    this.log('\n🏛️  Testing U.S. Census API...', colors.bold);
    this.results.total++;

    try {
      const response = await axios.get(
        'https://api.census.gov/data/2021/acs/acs1?get=B01003_001E&for=state:*',
        { timeout: TIMEOUT }
      );

      if (response.status === 200 && Array.isArray(response.data)) {
        this.logSuccess('U.S. Census API is accessible');
      } else {
        this.logError('U.S. Census API returned unexpected format');
      }
    } catch (error) {
      this.logError(`U.S. Census connection failed: ${error.message}`);
    }
  }

  async checkNasdaq() {
    this.log('\n📊 Testing Nasdaq Data Link API...', colors.bold);
    this.results.total++;

    try {
      // Using a public dataset that doesn't require authentication
      const response = await axios.get(
        'https://data.nasdaq.com/api/v3/datasets/WIKI/AAPL.json?rows=1',
        { timeout: TIMEOUT }
      );

      if (response.status === 200) {
        this.logSuccess('Nasdaq Data Link API is accessible');
      } else {
        this.logError(`Nasdaq returned status: ${response.status}`);
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        this.logWarning('Nasdaq WIKI dataset not available (deprecated) - API endpoint is working');
        this.results.passed++;
        this.results.warnings--;
      } else {
        this.logError(`Nasdaq connection failed: ${error.message}`);
      }
    }
  }

  printSummary() {
    this.log('\n' + '='.repeat(50), colors.bold);
    this.log('API Health Check Summary', colors.bold);
    this.log('='.repeat(50), colors.bold);
    
    this.log(`\nTotal APIs tested: ${this.results.total}`);
    this.logSuccess(`Passed: ${this.results.passed}`);
    this.logError(`Failed: ${this.results.failed}`);
    this.logWarning(`Warnings: ${this.results.warnings}`);

    const successRate = ((this.results.passed / this.results.total) * 100).toFixed(1);
    this.log(`\nSuccess rate: ${successRate}%`, 
      successRate >= 80 ? colors.green : successRate >= 60 ? colors.yellow : colors.red);

    if (this.results.failed > 0) {
      this.log('\n⚠️  Some APIs are not accessible. This may impact TAM analysis functionality.', colors.yellow);
      this.log('Please check your network connection and API keys configuration.', colors.yellow);
    } else {
      this.log('\n✅ All APIs are accessible! TAM MCP Server is ready for production.', colors.green);
    }
  }

  async runAllChecks() {
    this.log('🚀 Starting API Health Check for TAM MCP Server...', colors.bold);
    this.log(`Environment: ${process.env.NODE_ENV || 'development'}`, colors.blue);

    await Promise.all([
      this.checkAlphaVantage(),
      this.checkFRED(),
      this.checkWorldBank(),
      this.checkIMF(),
      this.checkOECD(),
      this.checkBLS(),
      this.checkCensus(),
      this.checkNasdaq()
    ]);

    this.printSummary();
    
    // Exit with error code if too many failures
    if (this.results.failed > this.results.total * 0.5) {
      process.exit(1);
    }
  }
}

// Run the health check
const checker = new ApiHealthChecker();
checker.runAllChecks().catch(error => {
  console.error('Health check failed:', error);
  process.exit(1);
});
