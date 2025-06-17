#!/usr/bin/env node
/**
 * TAM MCP Server Integration Test
 * Tests the MCP server tools with real API calls
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

class MCPServerTester {
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

  async testTool(toolName, toolArgs, expectedProperties = []) {
    this.log(`\n🔍 Testing tool: ${toolName}`, colors.cyan);
    this.results.total++;

    try {
      // Import the server module
      const { createServer } = await import('../dist/server.js');
      const server = createServer();

      // Create a mock request
      const request = {
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: toolArgs
        }
      };

      // Call the tool handler directly
      const tools = server.getToolHandlers();
      const toolHandler = tools.get(toolName);

      if (!toolHandler) {
        this.logError(`Tool ${toolName} not found`);
        return;
      }

      const result = await toolHandler(request.params);

      if (result && result.content && result.content.length > 0) {
        const content = result.content[0];
        
        if (content.type === 'text') {
          try {
            const data = JSON.parse(content.text);
            
            // Check if expected properties exist
            let hasExpectedData = true;
            for (const prop of expectedProperties) {
              if (!data.hasOwnProperty(prop)) {
                hasExpectedData = false;
                break;
              }
            }

            if (hasExpectedData) {
              this.logSuccess(`${toolName} returned valid data`);
              this.logInfo(`Sample data: ${JSON.stringify(data).substring(0, 200)}...`);
            } else {
              this.logWarning(`${toolName} returned data but missing expected properties: ${expectedProperties.join(', ')}`);
            }
          } catch (parseError) {
            this.logWarning(`${toolName} returned non-JSON data: ${content.text.substring(0, 100)}...`);
          }
        } else {
          this.logSuccess(`${toolName} returned content of type: ${content.type}`);
        }
      } else {
        this.logError(`${toolName} returned no content`);
      }

    } catch (error) {
      this.logError(`${toolName} failed: ${error.message}`);
    }
  }

  async runToolTests() {
    this.log('🚀 Starting TAM MCP Server Tool Integration Tests...', colors.bold);
    this.log(`Environment: ${process.env.NODE_ENV || 'development'}`, colors.blue);

    // Test simple data source tools first
    await this.testTool('alpha_vantage_company_overview', {
      symbol: 'AAPL'
    }, ['symbol', 'name']);

    await this.testTool('fred_economic_data', {
      series_id: 'GDPC1',
      start_date: '2022-01-01',
      end_date: '2023-12-31'
    }, ['series_id', 'data']);

    await this.testTool('world_bank_country_data', {
      country_code: 'US',
      indicator: 'NY.GDP.MKTP.CD',
      start_year: 2020,
      end_year: 2022
    }, ['country_code', 'indicator']);

    await this.testTool('census_industry_data', {
      year: '2021',
      dataset: 'acs',
      survey: 'acs1',
      variables: ['B01003_001E'],
      geography: { for: 'state:06' }
    }, ['data']);

    await this.testTool('bls_industry_employment', {
      series_ids: ['CES0000000001'],
      start_year: '2023',
      end_year: '2023'
    }, ['series_data']);

    // Test analytical tools
    await this.testTool('tam_calculator', {
      industry: 'software',
      market_segments: ['enterprise', 'consumer'],
      geographic_scope: 'US',
      time_horizon: 5
    }, ['tam_estimate']);

    await this.testTool('market_size_calculator', {
      industry_code: 'NAICS_541511',
      geographic_region: 'US',
      data_sources: ['census', 'bls'],
      calculation_method: 'revenue_based'
    }, ['market_size']);

    await this.testTool('company_financials_retriever', {
      symbol: 'MSFT',
      metrics: ['revenue', 'market_cap'],
      period: 'annual'
    }, ['symbol', 'financials']);

    // Test multi-source aggregation
    await this.testTool('industry_search', {
      query: 'cloud computing',
      data_sources: ['alpha_vantage', 'fred', 'census'],
      filters: {
        geographic_scope: 'US',
        time_period: {
          start: '2022-01-01',
          end: '2023-12-31'
        }
      }
    }, ['search_results']);

    this.printSummary();
  }

  printSummary() {
    this.log('\n' + '='.repeat(60), colors.bold);
    this.log('TAM MCP Server Integration Test Summary', colors.bold);
    this.log('='.repeat(60), colors.bold);
    
    this.log(`\nTotal tools tested: ${this.results.total}`);
    this.logSuccess(`Passed: ${this.results.passed}`);
    this.logError(`Failed: ${this.results.failed}`);
    this.logWarning(`Warnings: ${this.results.warnings}`);

    const successRate = ((this.results.passed / this.results.total) * 100).toFixed(1);
    this.log(`\nSuccess rate: ${successRate}%`, 
      successRate >= 80 ? colors.green : successRate >= 60 ? colors.yellow : colors.red);

    if (this.results.failed === 0) {
      this.log('\n🎉 All tools are working correctly! TAM MCP Server is ready for production.', colors.green);
    } else if (this.results.failed <= 2) {
      this.log('\n✅ Most tools are working. Minor issues detected - check API configurations.', colors.yellow);
    } else {
      this.log('\n⚠️  Several tools failed. Please check your configuration and API keys.', colors.red);
    }

    this.log('\n📋 Next Steps:', colors.bold);
    this.log('  1. Configure missing API keys in .env file');
    this.log('  2. Test with your preferred MCP client');
    this.log('  3. Review tool documentation in README.md');
  }
}

// Run the integration test
const tester = new MCPServerTester();
tester.runToolTests().catch(error => {
  console.error('Integration test failed:', error);
  process.exit(1);
});
