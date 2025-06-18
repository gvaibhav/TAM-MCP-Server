#!/usr/bin/env node
/**
 * Simple TAM MCP Tool Test
 * Tests individual tools with mock data to verify functionality
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

class ToolTester {
  constructor() {
    this.results = { passed: 0, failed: 0, total: 0 };
  }

  log(message, color = '') {
    console.log(`${color}${message}${colors.reset}`);
  }

  async testToolViaJsonInput(toolName, args) {
    this.results.total++;
    this.log(`\n🔍 Testing ${toolName}...`, colors.cyan);

    try {
      // Create a test input for the MCP server
      const mcpRequest = {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: toolName,
          arguments: args
        }
      };

      // Write request to temp file
      const requestFile = `/tmp/mcp_test_${Date.now()}.json`;
      await fs.writeFile(requestFile, JSON.stringify(mcpRequest) + '\n');

      // Test the tool by sending JSON to the server
      const { stdout, stderr } = await execAsync(
        `cd /home/gvaibhav/Documents/TAM-MCP-Server && timeout 10s node dist/index.js < ${requestFile}`,
        { maxBuffer: 1024 * 1024 * 10 } // 10MB buffer
      );

      // Clean up temp file
      await fs.unlink(requestFile).catch(() => {});

      if (stdout.includes('"result"') && !stdout.includes('"error"')) {
        this.log(`✅ ${toolName} executed successfully`, colors.green);
        this.results.passed++;
        
        // Try to extract and show result summary
        try {
          const lines = stdout.split('\n').filter(line => line.trim());
          const resultLine = lines.find(line => line.includes('"result"'));
          if (resultLine) {
            const response = JSON.parse(resultLine);
            if (response.result && response.result.content) {
              const contentType = response.result.content[0]?.type || 'unknown';
              const contentLength = response.result.content[0]?.text?.length || 0;
              this.log(`   📊 Returned ${contentType} content (${contentLength} chars)`, colors.blue);
            }
          }
        } catch (e) {
          // Ignore parsing errors for summary
        }
      } else if (stdout.includes('"error"')) {
        this.log(`❌ ${toolName} returned error`, colors.red);
        this.results.failed++;
        
        // Try to extract error message
        try {
          const lines = stdout.split('\n').filter(line => line.trim());
          const errorLine = lines.find(line => line.includes('"error"'));
          if (errorLine) {
            const response = JSON.parse(errorLine);
            this.log(`   Error: ${response.error.message}`, colors.red);
          }
        } catch (e) {
          this.log(`   Error details: ${stdout.substring(0, 200)}...`, colors.red);
        }
      } else {
        this.log(`⚠️  ${toolName} returned unexpected output`, colors.yellow);
        this.results.failed++;
        this.log(`   Output: ${stdout.substring(0, 200)}...`, colors.yellow);
      }

    } catch (error) {
      this.log(`❌ ${toolName} failed to execute: ${error.message}`, colors.red);
      this.results.failed++;
    }
  }

  async runTests() {
    this.log('🚀 Starting TAM MCP Server Tool Tests...', colors.bold);
    
    // Test basic data source tools
    await this.testToolViaJsonInput('alpha_vantage_company_overview', {
      symbol: 'AAPL'
    });

    await this.testToolViaJsonInput('fred_economic_data', {
      series_id: 'GDPC1',
      start_date: '2022-01-01',
      end_date: '2023-12-31'
    });

    await this.testToolViaJsonInput('world_bank_country_data', {
      country_code: 'US',
      indicator: 'NY.GDP.MKTP.CD',
      start_year: 2020,
      end_year: 2022
    });

    await this.testToolViaJsonInput('census_industry_data', {
      year: '2021',
      dataset: 'acs',
      survey: 'acs1',
      variables: ['B01003_001E'],
      geography: { for: 'state:06' }
    });

    await this.testToolViaJsonInput('bls_industry_employment', {
      series_ids: ['CES0000000001'],
      start_year: '2023',
      end_year: '2023'
    });

    // Test analytical tools
    await this.testToolViaJsonInput('tam_calculator', {
      industry: 'software',
      market_segments: ['enterprise', 'consumer'],
      geographic_scope: 'US',
      time_horizon: 5
    });

    await this.testToolViaJsonInput('market_size_calculator', {
      industry_code: 'NAICS_541511',
      geographic_region: 'US',
      data_sources: ['census', 'bls'],
      calculation_method: 'revenue_based'
    });

    // Test company financials
    await this.testToolViaJsonInput('company_financials_retriever', {
      symbol: 'MSFT',
      metrics: ['revenue', 'market_cap'],
      period: 'annual'
    });

    this.printSummary();
  }

  printSummary() {
    this.log('\n' + '='.repeat(50), colors.bold);
    this.log('Tool Test Summary', colors.bold);
    this.log('='.repeat(50), colors.bold);
    
    this.log(`\nTotal tools tested: ${this.results.total}`);
    this.log(`✅ Passed: ${this.results.passed}`, colors.green);
    this.log(`❌ Failed: ${this.results.failed}`, colors.red);

    const successRate = ((this.results.passed / this.results.total) * 100).toFixed(1);
    this.log(`\nSuccess rate: ${successRate}%`, 
      successRate >= 80 ? colors.green : successRate >= 60 ? colors.yellow : colors.red);

    if (this.results.failed === 0) {
      this.log('\n🎉 All tools are working! TAM MCP Server is ready.', colors.green);
    } else {
      this.log('\n⚠️  Some tools need attention. Check API configurations.', colors.yellow);
    }
  }
}

// Run the tests
const tester = new ToolTester();
tester.runTests().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
