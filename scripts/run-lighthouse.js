#!/usr/bin/env node
/**
 * Run Lighthouse audits locally
 * This script runs Lighthouse performance audits on key pages
 * and validates against Core Web Vitals targets
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function checkServerRunning() {
  try {
    const response = await fetch('http://localhost:3000/');
    return response.ok;
  } catch {
    return false;
  }
}

async function runLighthouseCI() {
  console.log(`${colors.blue}🔍 Running Lighthouse CI audits...${colors.reset}\n`);

  try {
    // Use npx to run @lhci/cli
    const { stdout, stderr } = await execAsync(
      'npx --yes @lhci/cli@0.13.x autorun --config=.lighthouserc.js',
      {
        cwd: projectRoot,
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer for large output
      }
    );

    return { stdout, stderr, success: true };
  } catch (error) {
    // Lighthouse CI exits with non-zero code if assertions fail
    // We still want to show the results
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || '',
      success: false,
      error: error.message
    };
  }
}

function parseResults(output) {
  const results = {
    performance: null,
    lcp: null,
    cls: null,
    tbt: null,
    fcp: null,
    speedIndex: null,
    urls: []
  };

  // Extract performance score
  const perfMatch = output.match(/performance\s+│\s+(\d+)/i);
  if (perfMatch) {
    results.performance = parseInt(perfMatch[1]);
  }

  // Extract Core Web Vitals
  const lcpMatch = output.match(/largest-contentful-paint\s+│[^│]*│\s+([\d.]+)/i);
  if (lcpMatch) {
    results.lcp = parseFloat(lcpMatch[1]);
  }

  const clsMatch = output.match(/cumulative-layout-shift\s+│[^│]*│\s+([\d.]+)/i);
  if (clsMatch) {
    results.cls = parseFloat(clsMatch[1]);
  }

  const tbtMatch = output.match(/total-blocking-time\s+│[^│]*│\s+([\d.]+)/i);
  if (tbtMatch) {
    results.tbt = parseFloat(tbtMatch[1]);
  }

  const fcpMatch = output.match(/first-contentful-paint\s+│[^│]*│\s+([\d.]+)/i);
  if (fcpMatch) {
    results.fcp = parseFloat(fcpMatch[1]);
  }

  const speedMatch = output.match(/speed-index\s+│[^│]*│\s+([\d.]+)/i);
  if (speedMatch) {
    results.speedIndex = parseFloat(speedMatch[1]);
  }

  return results;
}

function displayResults(output, success) {
  console.log(`\n${colors.bright}📊 Lighthouse Audit Results${colors.reset}`);
  console.log('━'.repeat(60));

  const results = parseResults(output);

  // Display performance score
  if (results.performance !== null) {
    const scoreColor = results.performance >= 90 ? colors.green :
                       results.performance >= 50 ? colors.yellow : colors.red;
    console.log(`\n${colors.bright}Performance Score:${colors.reset} ${scoreColor}${results.performance}/100${colors.reset}`);
  }

  // Display Core Web Vitals
  console.log(`\n${colors.bright}Core Web Vitals:${colors.reset}`);

  if (results.lcp !== null) {
    const lcpColor = results.lcp <= 2500 ? colors.green :
                     results.lcp <= 4000 ? colors.yellow : colors.red;
    console.log(`  ${colors.cyan}LCP (Largest Contentful Paint):${colors.reset} ${lcpColor}${(results.lcp / 1000).toFixed(2)}s${colors.reset} ${results.lcp <= 2500 ? '✓' : '✗'} (target: ≤2.5s)`);
  }

  if (results.cls !== null) {
    const clsColor = results.cls <= 0.1 ? colors.green :
                     results.cls <= 0.25 ? colors.yellow : colors.red;
    console.log(`  ${colors.cyan}CLS (Cumulative Layout Shift):${colors.reset} ${clsColor}${results.cls.toFixed(3)}${colors.reset} ${results.cls <= 0.1 ? '✓' : '✗'} (target: ≤0.1)`);
  }

  if (results.tbt !== null) {
    const tbtColor = results.tbt <= 200 ? colors.green :
                     results.tbt <= 600 ? colors.yellow : colors.red;
    console.log(`  ${colors.cyan}TBT (Total Blocking Time):${colors.reset} ${tbtColor}${results.tbt.toFixed(0)}ms${colors.reset} ${results.tbt <= 200 ? '✓' : '✗'} (target: ≤200ms)`);
  }

  // Display other metrics
  console.log(`\n${colors.bright}Other Metrics:${colors.reset}`);

  if (results.fcp !== null) {
    const fcpColor = results.fcp <= 1800 ? colors.green :
                     results.fcp <= 3000 ? colors.yellow : colors.red;
    console.log(`  ${colors.cyan}FCP (First Contentful Paint):${colors.reset} ${fcpColor}${(results.fcp / 1000).toFixed(2)}s${colors.reset}`);
  }

  if (results.speedIndex !== null) {
    const siColor = results.speedIndex <= 3400 ? colors.green :
                    results.speedIndex <= 5800 ? colors.yellow : colors.red;
    console.log(`  ${colors.cyan}Speed Index:${colors.reset} ${siColor}${(results.speedIndex / 1000).toFixed(2)}s${colors.reset}`);
  }

  console.log('\n' + '━'.repeat(60));

  // Display full output for detailed view
  if (output.includes('Assertion results')) {
    console.log(`\n${colors.bright}📋 Detailed Results:${colors.reset}`);
    console.log(output);
  }

  if (success) {
    console.log(`\n${colors.green}✅ All Lighthouse assertions passed!${colors.reset}`);
  } else {
    console.log(`\n${colors.yellow}⚠️  Some Lighthouse assertions failed. Review the results above.${colors.reset}`);
  }
}

async function main() {
  console.log(`${colors.bright}🚀 Lighthouse Performance Audit${colors.reset}\n`);

  // Check if dev server is running
  console.log('Checking for development server at http://localhost:3000...');
  const serverRunning = await checkServerRunning();

  if (!serverRunning) {
    console.log(`${colors.red}❌ Development server is not running!${colors.reset}\n`);
    console.log(`${colors.yellow}Please start the development server first:${colors.reset}`);
    console.log(`   ${colors.cyan}npm run dev${colors.reset}\n`);
    console.log('Then run this script again in a new terminal.');
    process.exit(1);
  }

  console.log(`${colors.green}✓ Development server is running${colors.reset}\n`);

  // Run Lighthouse CI
  console.log('Running Lighthouse audits (this may take a minute)...\n');
  const { stdout, stderr, success } = await runLighthouseCI();

  // Display results
  displayResults(stdout, success);

  if (stderr && stderr.trim()) {
    console.log(`\n${colors.yellow}Warnings:${colors.reset}`);
    console.log(stderr);
  }

  // Exit with appropriate code
  if (!success) {
    console.log(`\n${colors.blue}💡 Tips to improve performance:${colors.reset}`);
    console.log('   • Optimize images and use WebP/AVIF formats');
    console.log('   • Defer non-critical JavaScript');
    console.log('   • Use lazy loading for below-fold content');
    console.log('   • Minimize render-blocking resources');
    console.log('   • Enable compression and caching');
    console.log(`\n${colors.cyan}See .lighthouserc.js for full configuration${colors.reset}\n`);
    process.exit(1);
  }

  console.log('');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(`${colors.red}❌ Error running Lighthouse:${colors.reset}`, error.message);
    process.exit(1);
  });
}

export { runLighthouseCI, parseResults };
