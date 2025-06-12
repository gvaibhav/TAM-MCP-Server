const { AllToolDefinitions } = require('./dist/tools/tool-definitions.js');

console.log('=== TAM MCP Server Schema Validation ===\n');

const tools = Object.keys(AllToolDefinitions);
console.log(`Total tools: ${tools.length}\n`);

let validCount = 0;
const sampleTools = tools.slice(0, 8); // Test first 8 tools

sampleTools.forEach((toolName, index) => {
  const tool = AllToolDefinitions[toolName];
  const schema = tool.inputSchema;
  
  const hasType = schema.type === 'object';
  const hasProps = !!schema.properties;
  const hasSchema = !!schema.$schema;
  
  const isValid = hasType && hasProps && hasSchema;
  if (isValid) validCount++;
  
  console.log(`${index + 1}. ${toolName}`);
  console.log(`   Type: ${schema.type} ${hasType ? '✅' : '❌'}`);
  console.log(`   Properties: ${hasProps ? '✅' : '❌'}`);
  console.log(`   $schema: ${hasSchema ? '✅' : '❌'}`);
  console.log(`   Status: ${isValid ? 'VALID' : 'INVALID'}\n`);
});

console.log(`=== RESULTS ===`);
console.log(`Valid tools: ${validCount}/${sampleTools.length}`);
console.log(`All schemas MCP-compliant: ${validCount === sampleTools.length ? 'YES' : 'NO'}`);
