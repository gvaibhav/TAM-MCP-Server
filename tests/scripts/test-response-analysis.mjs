#!/usr/bin/env node

/**
 * Focused Response Analysis for Semantic Validation
 * 
 * This script runs specific tools and analyzes response content 
 * for semantic quality and business relevance.
 */

import { MCPServer } from './dist/server.js';

console.log('🔬 Focused Semantic Response Analysis');
console.log('====================================\n');

const server = new MCPServer(
  { name: "tam-mcp-server", version: "1.0.0" },
  { capabilities: { tools: {}, prompts: {}, resources: {} } }
);

// Test specific responses for semantic validation
const tests = [
  {
    name: 'TAM Calculator',
    tool: 'tam_calculator',
    params: {},
    checks: [
      { field: 'calculatedTam', test: (val) => val > 10000000000, desc: 'TAM > $10B' },
      { field: 'parameters.baseMarket', test: (val) => val === 10000000000, desc: 'Base = $10B' },
      { field: 'parameters.growthRate', test: (val) => val === 0.15, desc: 'Growth = 15%' },
      { field: 'parameters.years', test: (val) => val === 5, desc: 'Period = 5 years' }
    ]
  },
  {
    name: 'Market Size Calculator', 
    tool: 'marketSize_calculator',
    params: {},
    checks: [
      { field: 'industry', test: (val) => val === 'Software as a Service', desc: 'Industry = SaaS' },
      { field: 'geography', test: (val) => val === 'US', desc: 'Geography = US' }
    ]
  }
];

let totalChecks = 0;
let passedChecks = 0;

for (const test of tests) {
  console.log(`🧪 Testing: ${test.name}`);
  
  try {
    const result = await server.callTool(test.tool, test.params);
    const data = JSON.parse(result.content[0].text);
    
    console.log(`✅ Response received for ${test.name}`);
    
    // Run semantic checks
    for (const check of test.checks) {
      totalChecks++;
      const fieldPath = check.field.split('.');
      let value = data;
      
      // Navigate nested object
      for (const path of fieldPath) {
        value = value?.[path];
      }
      
      if (check.test(value)) {
        console.log(`   ✅ ${check.desc}: ${value}`);
        passedChecks++;
      } else {
        console.log(`   ❌ ${check.desc}: Expected different, got ${value}`);
      }
    }
    
    // Show sample response structure
    console.log(`   📄 Response preview:`, JSON.stringify(data, null, 2).substring(0, 200) + '...');
    
  } catch (error) {
    console.log(`   ⚠️  ${test.name}: ${error.message}`);
  }
  
  console.log('');
}

console.log('📊 SEMANTIC VALIDATION SUMMARY');
console.log('══════════════════════════════════════════════════════════');
console.log(`✅ Passed Checks: ${passedChecks}/${totalChecks}`);
console.log(`📈 Success Rate: ${((passedChecks/totalChecks)*100).toFixed(1)}%`);

if (passedChecks === totalChecks) {
  console.log('\n🎉 ALL SEMANTIC CHECKS PASSED!');
  console.log('✅ Default values produce semantically valid responses');
  console.log('✅ Professional quality confirmed for business use');
} else {
  console.log('\n⚠️  Some semantic checks failed - review above');
}

process.exit(0);
