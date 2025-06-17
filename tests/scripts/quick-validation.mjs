#!/usr/bin/env node
/**
 * Quick Tool Validation
 * Validates that all tools are properly defined and can be listed
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';

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

async function quickValidation() {
  console.log(`${colors.bold}🔍 TAM MCP Server Quick Validation${colors.reset}\n`);

  try {
    // Test 1: Check if server can list tools
    console.log(`${colors.cyan}1. Testing tools/list endpoint...${colors.reset}`);
    
    const listRequest = {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/list"
    };

    const requestFile = `/tmp/mcp_list_${Date.now()}.json`;
    await fs.writeFile(requestFile, JSON.stringify(listRequest) + '\n');

    const { stdout } = await execAsync(
      `cd /home/gvaibhav/Documents/TAM-MCP-Server && timeout 5s node dist/index.js < ${requestFile}`,
      { maxBuffer: 1024 * 1024 }
    );

    await fs.unlink(requestFile).catch(() => {});

    if (stdout.includes('"tools"')) {
      console.log(`${colors.green}✅ Server can list tools${colors.reset}`);
      
      // Parse and show tool count
      try {
        const lines = stdout.split('\n').filter(line => line.trim());
        const resultLine = lines.find(line => line.includes('"tools"'));
        if (resultLine) {
          const response = JSON.parse(resultLine);
          const toolCount = response.result?.tools?.length || 0;
          console.log(`${colors.blue}   📊 Found ${toolCount} tools${colors.reset}`);
          
          // Show first few tool names
          if (response.result?.tools) {
            const toolNames = response.result.tools.slice(0, 5).map(t => t.name);
            console.log(`${colors.blue}   🔧 Sample tools: ${toolNames.join(', ')}...${colors.reset}`);
          }
        }
      } catch (e) {
        console.log(`${colors.yellow}   ⚠️  Could not parse tool list details${colors.reset}`);
      }
    } else {
      console.log(`${colors.red}❌ Server failed to list tools${colors.reset}`);
      console.log(`Output: ${stdout.substring(0, 300)}...`);
    }

  } catch (error) {
    console.log(`${colors.red}❌ Validation failed: ${error.message}${colors.reset}`);
  }

  // Test 2: Check build status
  console.log(`\n${colors.cyan}2. Checking build status...${colors.reset}`);
  try {
    const { stdout: buildOutput } = await execAsync('cd /home/gvaibhav/Documents/TAM-MCP-Server && npm run build');
    console.log(`${colors.green}✅ Build completed successfully${colors.reset}`);
  } catch (buildError) {
    console.log(`${colors.red}❌ Build failed: ${buildError.message}${colors.reset}`);
  }

  // Test 3: Show server info
  console.log(`\n${colors.cyan}3. Server configuration:${colors.reset}`);
  console.log(`${colors.blue}   📁 Working directory: /home/gvaibhav/Documents/TAM-MCP-Server${colors.reset}`);
  console.log(`${colors.blue}   🌍 Environment: ${process.env.NODE_ENV || 'development'}${colors.reset}`);
  console.log(`${colors.blue}   🔑 Alpha Vantage API: ${process.env.ALPHA_VANTAGE_API_KEY ? 'configured' : 'using demo'}${colors.reset}`);
  console.log(`${colors.blue}   🏦 FRED API: ${process.env.FRED_API_KEY ? 'configured' : 'not configured'}${colors.reset}`);
  console.log(`${colors.blue}   👥 BLS API: ${process.env.BLS_API_KEY ? 'configured' : 'not configured'}${colors.reset}`);

  console.log(`\n${colors.bold}📋 Next Steps:${colors.reset}`);
  console.log(`${colors.blue}   1. Configure API keys in .env file for full functionality${colors.reset}`);
  console.log(`${colors.blue}   2. Test with MCP client (Claude Desktop, VS Code extension, etc.)${colors.reset}`);
  console.log(`${colors.blue}   3. Run: npm run test:api-health for detailed API status${colors.reset}`);
  console.log(`${colors.blue}   4. Start server: npm start${colors.reset}`);
  
  console.log(`\n${colors.green}🎉 TAM MCP Server validation complete!${colors.reset}`);
}

quickValidation().catch(error => {
  console.error(`${colors.red}Validation failed:${colors.reset}`, error);
  process.exit(1);
});
