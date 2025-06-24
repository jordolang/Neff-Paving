#!/usr/bin/env node

import lighthouse from 'lighthouse'
import { launch } from 'chrome-launcher'
import { writeFile, mkdir } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const projectRoot = join(__dirname, '..')
const reportsDir = join(projectRoot, 'lighthouse-reports')

// Test configurations
const testConfigs = {
  desktop: {
    extends: 'lighthouse:default',
    settings: {
      formFactor: 'desktop',
      throttling: {
        rttMs: 40,
        throughputKbps: 10240,
        cpuSlowdownMultiplier: 1,
        requestLatencyMs: 0,
        downloadThroughputKbps: 0,
        uploadThroughputKbps: 0
      },
      screenEmulation: {
        mobile: false,
        width: 1350,
        height: 940,
        deviceScaleFactor: 1,
        disabled: false
      },
      emulatedUserAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.109 Safari/537.36'
    }
  },
  mobile: {
    extends: 'lighthouse:default',
    settings: {
      formFactor: 'mobile',
      throttling: {
        rttMs: 150,
        throughputKbps: 1638.4,
        cpuSlowdownMultiplier: 4,
        requestLatencyMs: 150,
        downloadThroughputKbps: 1638.4,
        uploadThroughputKbps: 750
      },
      screenEmulation: {
        mobile: true,
        width: 412,
        height: 823,
        deviceScaleFactor: 2.625,
        disabled: false
      }
    }
  }
}

// Pages to test
const testPages = [
  { url: 'http://localhost:3000/', name: 'homepage' },
  { url: 'http://localhost:3000/#services', name: 'services' },
  { url: 'http://localhost:3000/#gallery', name: 'gallery' },
  { url: 'http://localhost:3000/#about', name: 'about' },
  { url: 'http://localhost:3000/#contact', name: 'contact' }
]

// Performance thresholds
const thresholds = {
  performance: 90,
  accessibility: 95,
  bestPractices: 90,
  seo: 95,
  // Web Vitals thresholds
  firstContentfulPaint: 1800,
  largestContentfulPaint: 2500,
  cumulativeLayoutShift: 0.1,
  speedIndex: 3000,
  totalBlockingTime: 200,
  firstMeaningfulPaint: 1600
}

async function ensureDir(dirPath) {
  try {
    await mkdir(dirPath, { recursive: true })
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error
    }
  }
}

async function runLighthouse(url, config, outputPath) {
  const chrome = await launch({ chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage'] })
  
  try {
    console.log(`🔍 Testing: ${url} (${config.settings.formFactor})`)
    
    const result = await lighthouse(url, {
      port: chrome.port,
      output: ['html', 'json'],
      logLevel: 'error'
    }, config)
    
    // Save HTML report
    const htmlPath = join(outputPath, 'report.html')
    await writeFile(htmlPath, result.report[0])
    
    // Save JSON data
    const jsonPath = join(outputPath, 'report.json')
    await writeFile(jsonPath, result.report[1])
    
    return result.lhr
  } finally {
    await chrome.kill()
  }
}

function analyzeResults(results, device) {
  const analysis = {
    device,
    timestamp: new Date().toISOString(),
    scores: {},
    metrics: {},
    passed: true,
    issues: []
  }
  
  // Extract scores
  const categories = results.categories
  analysis.scores = {
    performance: Math.round(categories.performance.score * 100),
    accessibility: Math.round(categories.accessibility.score * 100),
    bestPractices: Math.round(categories['best-practices'].score * 100),
    seo: Math.round(categories.seo.score * 100)
  }
  
  // Extract key metrics
  const audits = results.audits
  analysis.metrics = {
    firstContentfulPaint: audits['first-contentful-paint'].numericValue,
    largestContentfulPaint: audits['largest-contentful-paint'].numericValue,
    cumulativeLayoutShift: audits['cumulative-layout-shift'].numericValue,
    speedIndex: audits['speed-index'].numericValue,
    totalBlockingTime: audits['total-blocking-time'].numericValue,
    firstMeaningfulPaint: audits['first-meaningful-paint'].numericValue
  }
  
  // Check thresholds
  Object.entries(analysis.scores).forEach(([metric, score]) => {
    if (score < thresholds[metric]) {
      analysis.passed = false
      analysis.issues.push(`${metric}: ${score} (threshold: ${thresholds[metric]})`)
    }
  })
  
  Object.entries(analysis.metrics).forEach(([metric, value]) => {
    if (value > thresholds[metric]) {
      analysis.passed = false
      analysis.issues.push(`${metric}: ${Math.round(value)}ms (threshold: ${thresholds[metric]}ms)`)
    }
  })
  
  return analysis
}

function generateReport(allResults) {
  const report = {
    summary: {
      timestamp: new Date().toISOString(),
      totalTests: allResults.length,
      passedTests: allResults.filter(r => r.passed).length,
      overallPassed: allResults.every(r => r.passed)
    },
    results: allResults,
    recommendations: []
  }
  
  // Generate recommendations based on common issues
  const allIssues = allResults.flatMap(r => r.issues)
  const issueFrequency = {}
  
  allIssues.forEach(issue => {
    const metric = issue.split(':')[0]
    issueFrequency[metric] = (issueFrequency[metric] || 0) + 1
  })
  
  // Sort by frequency and generate recommendations
  const sortedIssues = Object.entries(issueFrequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
  
  const recommendations = {
    performance: [
      'Optimize images with next-gen formats (WebP, AVIF)',
      'Enable text compression (gzip, brotli)',
      'Implement code splitting and lazy loading',
      'Optimize CSS delivery and remove unused CSS',
      'Use a Content Delivery Network (CDN)'
    ],
    accessibility: [
      'Add alt text to all images',
      'Ensure sufficient color contrast',
      'Add proper heading hierarchy',
      'Include skip links for navigation',
      'Test with screen readers'
    ],
    bestPractices: [
      'Use HTTPS for all resources',
      'Optimize images for better compression',
      'Avoid deprecated APIs',
      'Implement proper error handling',
      'Use modern JavaScript features appropriately'
    ],
    seo: [
      'Add meta descriptions to all pages',
      'Implement structured data markup',
      'Optimize title tags',
      'Create an XML sitemap',
      'Ensure mobile-friendly design'
    ]
  }
  
  sortedIssues.forEach(([metric]) => {
    if (recommendations[metric]) {
      report.recommendations.push({
        category: metric,
        suggestions: recommendations[metric]
      })
    }
  })
  
  return report
}

function printResults(results) {
  console.log('\\n📊 Lighthouse Test Results\\n')
  console.log('=' .repeat(50))
  
  results.forEach(result => {
    const status = result.passed ? '✅' : '❌'
    console.log(`\\n${status} ${result.page} (${result.device})`)
    console.log(`   Performance: ${result.scores.performance}%`)
    console.log(`   Accessibility: ${result.scores.accessibility}%`)
    console.log(`   Best Practices: ${result.scores.bestPractices}%`)
    console.log(`   SEO: ${result.scores.seo}%`)
    
    if (result.issues.length > 0) {
      console.log('   Issues:')
      result.issues.forEach(issue => {
        console.log(`     • ${issue}`)
      })
    }
  })
  
  const overallPassed = results.every(r => r.passed)
  const passedCount = results.filter(r => r.passed).length
  
  console.log('\\n' + '='.repeat(50))
  console.log(`\\n${overallPassed ? '🎉' : '⚠️'} Overall: ${passedCount}/${results.length} tests passed`)
  
  if (!overallPassed) {
    console.log('\\n🔧 Run `npm run build` and check the generated reports for detailed recommendations.')
  }
}

async function main() {
  console.log('🚀 Starting Lighthouse performance tests...')
  
  try {
    // Ensure reports directory exists
    await ensureDir(reportsDir)
    
    const allResults = []
    
    // Test each page with both desktop and mobile configs
    for (const page of testPages) {
      for (const [device, config] of Object.entries(testConfigs)) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const outputDir = join(reportsDir, `${page.name}-${device}-${timestamp}`)
        await ensureDir(outputDir)
        
        try {
          const results = await runLighthouse(page.url, config, outputDir)
          const analysis = analyzeResults(results, device)
          analysis.page = page.name
          analysis.url = page.url
          allResults.push(analysis)
          
          console.log(`  ✓ Completed: ${page.name} (${device})`)
        } catch (error) {
          console.error(`  ❌ Failed: ${page.name} (${device}) - ${error.message}`)
          allResults.push({
            page: page.name,
            device,
            url: page.url,
            passed: false,
            error: error.message,
            scores: { performance: 0, accessibility: 0, bestPractices: 0, seo: 0 },
            metrics: {},
            issues: [`Test failed: ${error.message}`]
          })
        }
      }
    }
    
    // Generate and save comprehensive report
    const report = generateReport(allResults)
    const reportPath = join(reportsDir, `summary-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
    await writeFile(reportPath, JSON.stringify(report, null, 2))
    
    // Print results to console
    printResults(allResults)
    
    console.log(`\\n📁 Detailed reports saved to: ${reportsDir}`)
    
    // Exit with error if any tests failed
    if (!report.summary.overallPassed) {
      process.exit(1)
    }
    
  } catch (error) {
    console.error('❌ Error running Lighthouse tests:', error)
    process.exit(1)
  }
}

// Check if dev server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000/')
    return response.ok
  } catch {
    return false
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  checkServer().then(isRunning => {
    if (!isRunning) {
      console.error('❌ Development server is not running. Please start it with `npm run dev` first.')
      process.exit(1)
    }
    main()
  })
}

export { runLighthouse, analyzeResults, generateReport }
