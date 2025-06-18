#!/usr/bin/env node

/**
 * Test runner script for TAM MCP Server
 * Allows running specific test categories with proper setup
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = dirname(__dirname);

const testCategories = {
  unit: 'tests/unit',
  integration: 'tests/integration', 
  e2e: 'tests/e2e',
  all: 'tests'
};

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function printUsage() {
  console.log(`
${colorize('TAM MCP Server Test Runner', 'cyan')}

Usage: node tests/run-tests.js [category] [options]

Categories:
  ${colorize('unit', 'green')}        Run unit tests only
  ${colorize('integration', 'yellow')} Run integration tests only
  ${colorize('e2e', 'blue')}         Run end-to-end tests only
  ${colorize('all', 'magenta')}         Run all tests (default)

Options:
  ${colorize('--watch', 'bright')}     Run tests in watch mode
  ${colorize('--coverage', 'bright')}  Generate coverage report
  ${colorize('--debug', 'bright')}     Run with debug options
  ${colorize('--ci', 'bright')}        Run in CI mode
  ${colorize('--help', 'bright')}      Show this help message

Examples:
  node tests/run-tests.js unit
  node tests/run-tests.js e2e --watch
  node tests/run-tests.js all --coverage
  node tests/run-tests.js integration --debug
`);
}

function runTests(category, options = []) {
  const jestArgs = ['--config', 'config/jest.config.json'];
  
  if (category && category !== 'all') {
    jestArgs.push(testCategories[category]);
  }
  
  // Add options
  jestArgs.push(...options);
  
  console.log(colorize(`\n🧪 Running ${category || 'all'} tests...\n`, 'cyan'));
  console.log(colorize(`Command: npx jest ${jestArgs.join(' ')}\n`, 'bright'));
  
  const jest = spawn('npx', ['jest', ...jestArgs], {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: true
  });
  
  jest.on('error', (error) => {
    console.error(colorize(`\n❌ Failed to start jest: ${error.message}`, 'red'));
    process.exit(1);
  });
  
  jest.on('close', (code) => {
    if (code === 0) {
      console.log(colorize(`\n✅ Tests completed successfully!`, 'green'));
    } else {
      console.log(colorize(`\n❌ Tests failed with exit code ${code}`, 'red'));
    }
    process.exit(code);
  });
}

// Parse command line arguments
const args = process.argv.slice(2);
const category = args.find(arg => testCategories.hasOwnProperty(arg)) || 'all';
const jestOptions = [];

// Parse options
if (args.includes('--watch')) {
  jestOptions.push('--watch');
}

if (args.includes('--coverage')) {
  jestOptions.push('--coverage');
}

if (args.includes('--debug')) {
  jestOptions.push('--detectOpenHandles', '--forceExit');
}

if (args.includes('--ci')) {
  jestOptions.push('--ci', '--coverage', '--watchAll=false');
}

if (args.includes('--help') || args.includes('-h')) {
  printUsage();
  process.exit(0);
}

// Validate category
if (category !== 'all' && !testCategories.hasOwnProperty(category)) {
  console.error(colorize(`\n❌ Invalid test category: ${category}`, 'red'));
  console.error(colorize(`Valid categories: ${Object.keys(testCategories).join(', ')}`, 'yellow'));
  process.exit(1);
}

// Run tests
runTests(category, jestOptions);
