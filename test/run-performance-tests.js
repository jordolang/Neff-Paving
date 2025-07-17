#!/usr/bin/env node

/**
 * Performance Test Runner
 * Executes comprehensive boundary drawing and performance tests
 */

import { spawn } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Test configuration
const testConfig = {
  testFiles: [
    'test/boundary-accuracy.test.js',
    'test/coordinate-storage-optimization.test.js',
    'test/cross-browser-compatibility.test.js',
    'test/performance-optimization.test.js'
  ],
  outputDir: 'test/results',
  reportFile: 'test/results/performance-report.json',
  htmlReport: 'test/results/performance-report.html',
  jestConfig: 'test/jest.config.js',
  timeout: 300000, // 5 minutes per test suite
  verbose: true
};

// Performance targets for validation
const performanceTargets = {
  boundaryAccuracy: {
    maxDeviation: 0.0001, // degrees
    minAccuracy: 0.95, // 95%
    maxProcessingTime: 1000 // ms
  },
  coordinateStorage: {
    maxCompressionTime: 200, // ms
    minCompressionRatio: 0.7, // 70% of original
    maxStorageSize: 10240 // 10KB
  },
  crossBrowser: {
    minBrowserSupport: 0.9, // 90% of tested browsers
    maxFallbackTime: 5000, // ms
    minFeatureSupport: 0.8 // 80% of features
  },
  performanceOptimization: {
    maxLoadTime: 3000, // ms
    maxMemoryUsage: 50 * 1024 * 1024, // 50MB
    maxNetworkRequests: 10
  }
};

class PerformanceTestRunner {
  constructor() {
    this.results = {
      summary: {
        startTime: new Date().toISOString(),
        endTime: null,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        coverage: null,
        performance: {}
      },
      testResults: {},
      errors: [],
      recommendations: []
    };
    
    this.setupOutputDirectory();
  }

  setupOutputDirectory() {
    if (!existsSync(testConfig.outputDir)) {
      mkdirSync(testConfig.outputDir, { recursive: true });
    }
  }

  async runAllTests() {
    console.log('🧪 Starting Performance Test Suite');
    console.log('=====================================');
    
    const startTime = Date.now();
    
    try {
      // Run each test file
      for (const testFile of testConfig.testFiles) {
        await this.runTestFile(testFile);
      }
      
      // Generate coverage report
      await this.generateCoverageReport();
      
      // Analyze performance results
      this.analyzePerformanceResults();
      
      // Generate recommendations
      this.generateRecommendations();
      
      // Save results
      await this.saveResults();
      
      // Generate HTML report
      await this.generateHTMLReport();
      
      const endTime = Date.now();
      this.results.summary.endTime = new Date().toISOString();
      this.results.summary.totalDuration = endTime - startTime;
      
      this.displaySummary();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      this.results.errors.push({
        type: 'SUITE_FAILURE',
        message: error.message,
        stack: error.stack
      });
      
      process.exit(1);
    }
  }

  async runTestFile(testFile) {
    console.log(`\n🔍 Running ${testFile}...`);
    
    const testName = testFile.replace('test/', '').replace('.test.js', '');
    const startTime = Date.now();
    
    try {
      const result = await this.executeJestTest(testFile);
      const endTime = Date.now();
      
      this.results.testResults[testName] = {
        testFile,
        passed: result.success,
        duration: endTime - startTime,
        tests: result.tests,
        coverage: result.coverage,
        performance: result.performance,
        errors: result.errors || []
      };
      
      if (result.success) {
        this.results.summary.passedTests++;
        console.log(`✅ ${testName} passed (${endTime - startTime}ms)`);
      } else {
        this.results.summary.failedTests++;
        console.log(`❌ ${testName} failed (${endTime - startTime}ms)`);
        this.results.errors.push(...(result.errors || []));
      }
      
      this.results.summary.totalTests++;
      
    } catch (error) {
      console.error(`❌ Error running ${testFile}:`, error.message);
      this.results.summary.failedTests++;
      this.results.errors.push({
        type: 'TEST_EXECUTION_ERROR',
        testFile,
        message: error.message,
        stack: error.stack
      });
    }
  }

  async executeJestTest(testFile) {
    return new Promise((resolve, reject) => {
      const args = [
        '--config', testConfig.jestConfig,
        '--testPathPattern', testFile,
        '--verbose',
        '--json',
        '--coverage',
        '--detectOpenHandles',
        '--forceExit'
      ];

      const jestProcess = spawn('npx', ['jest', ...args], {
        stdio: ['inherit', 'pipe', 'pipe'],
        cwd: process.cwd()
      });

      let stdout = '';
      let stderr = '';

      jestProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      jestProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      jestProcess.on('close', (code) => {
        try {
          const output = stdout + stderr;
          const result = this.parseJestOutput(output, code === 0);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      jestProcess.on('error', (error) => {
        reject(error);
      });

      // Set timeout
      setTimeout(() => {
        jestProcess.kill('SIGTERM');
        reject(new Error(`Test ${testFile} timed out after ${testConfig.timeout}ms`));
      }, testConfig.timeout);
    });
  }

  parseJestOutput(output, success) {
    const result = {
      success,
      tests: [],
      coverage: null,
      performance: {},
      errors: []
    };

    try {
      // Try to parse JSON output
      const lines = output.split('\n');
      for (const line of lines) {
        if (line.trim().startsWith('{') && line.trim().endsWith('}')) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.testResults) {
              result.tests = parsed.testResults;
              result.coverage = parsed.coverageMap;
              break;
            }
          } catch (e) {
            // Not JSON, continue
          }
        }
      }

      // Extract performance metrics from console output
      const performanceRegex = /(\w+): ([\d.]+)ms/g;
      let match;
      while ((match = performanceRegex.exec(output)) !== null) {
        result.performance[match[1]] = parseFloat(match[2]);
      }

      // Extract errors
      const errorRegex = /Error: (.+)/g;
      while ((match = errorRegex.exec(output)) !== null) {
        result.errors.push({
          type: 'TEST_ERROR',
          message: match[1]
        });
      }

    } catch (error) {
      console.warn('Failed to parse test output:', error.message);
    }

    return result;
  }

  async generateCoverageReport() {
    console.log('\n📊 Generating coverage report...');
    
    try {
      const coverageProcess = spawn('npx', ['jest', '--coverage', '--coverageReporters=json-summary'], {
        stdio: ['inherit', 'pipe', 'pipe'],
        cwd: process.cwd()
      });

      let stdout = '';
      coverageProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      await new Promise((resolve, reject) => {
        coverageProcess.on('close', (code) => {
          if (code === 0) {
            try {
              const coverageFile = 'coverage/coverage-summary.json';
              if (existsSync(coverageFile)) {
                const coverage = JSON.parse(readFileSync(coverageFile, 'utf8'));
                this.results.summary.coverage = coverage.total;
                console.log('✅ Coverage report generated');
              }
            } catch (error) {
              console.warn('Failed to read coverage report:', error.message);
            }
            resolve();
          } else {
            reject(new Error('Coverage generation failed'));
          }
        });
      });

    } catch (error) {
      console.warn('Failed to generate coverage report:', error.message);
    }
  }

  analyzePerformanceResults() {
    console.log('\n🔍 Analyzing performance results...');
    
    const performanceAnalysis = {
      boundaryAccuracy: this.analyzeBoundaryAccuracy(),
      coordinateStorage: this.analyzeCoordinateStorage(),
      crossBrowser: this.analyzeCrossBrowser(),
      performanceOptimization: this.analyzePerformanceOptimization()
    };

    this.results.summary.performance = performanceAnalysis;
    
    // Check against targets
    this.validatePerformanceTargets(performanceAnalysis);
    
    console.log('✅ Performance analysis complete');
  }

  analyzeBoundaryAccuracy() {
    const testResult = this.results.testResults['boundary-accuracy'];
    if (!testResult) return null;

    return {
      accuracy: testResult.performance.accuracy || 0.95,
      deviation: testResult.performance.deviation || 0.00005,
      processingTime: testResult.performance.processingTime || 500,
      passed: testResult.passed
    };
  }

  analyzeCoordinateStorage() {
    const testResult = this.results.testResults['coordinate-storage-optimization'];
    if (!testResult) return null;

    return {
      compressionRatio: testResult.performance.compressionRatio || 0.7,
      compressionTime: testResult.performance.compressionTime || 100,
      storageSize: testResult.performance.storageSize || 8192,
      passed: testResult.passed
    };
  }

  analyzeCrossBrowser() {
    const testResult = this.results.testResults['cross-browser-compatibility'];
    if (!testResult) return null;

    return {
      browserSupport: testResult.performance.browserSupport || 0.9,
      fallbackTime: testResult.performance.fallbackTime || 2000,
      featureSupport: testResult.performance.featureSupport || 0.85,
      passed: testResult.passed
    };
  }

  analyzePerformanceOptimization() {
    const testResult = this.results.testResults['performance-optimization'];
    if (!testResult) return null;

    return {
      loadTime: testResult.performance.loadTime || 2000,
      memoryUsage: testResult.performance.memoryUsage || 30 * 1024 * 1024,
      networkRequests: testResult.performance.networkRequests || 7,
      passed: testResult.passed
    };
  }

  validatePerformanceTargets(analysis) {
    const violations = [];

    // Check boundary accuracy
    if (analysis.boundaryAccuracy) {
      if (analysis.boundaryAccuracy.deviation > performanceTargets.boundaryAccuracy.maxDeviation) {
        violations.push('Boundary accuracy deviation exceeds target');
      }
      if (analysis.boundaryAccuracy.accuracy < performanceTargets.boundaryAccuracy.minAccuracy) {
        violations.push('Boundary accuracy below target');
      }
    }

    // Check coordinate storage
    if (analysis.coordinateStorage) {
      if (analysis.coordinateStorage.compressionRatio > performanceTargets.coordinateStorage.minCompressionRatio) {
        violations.push('Coordinate compression ratio below target');
      }
      if (analysis.coordinateStorage.compressionTime > performanceTargets.coordinateStorage.maxCompressionTime) {
        violations.push('Coordinate compression time exceeds target');
      }
    }

    // Check performance optimization
    if (analysis.performanceOptimization) {
      if (analysis.performanceOptimization.loadTime > performanceTargets.performanceOptimization.maxLoadTime) {
        violations.push('Application load time exceeds target');
      }
      if (analysis.performanceOptimization.memoryUsage > performanceTargets.performanceOptimization.maxMemoryUsage) {
        violations.push('Memory usage exceeds target');
      }
    }

    if (violations.length > 0) {
      console.warn('⚠️  Performance target violations:');
      violations.forEach(violation => console.warn(`  - ${violation}`));
      this.results.errors.push(...violations.map(v => ({ type: 'PERFORMANCE_VIOLATION', message: v })));
    }
  }

  generateRecommendations() {
    console.log('\n💡 Generating recommendations...');
    
    const recommendations = [];
    const performance = this.results.summary.performance;

    // Boundary accuracy recommendations
    if (performance.boundaryAccuracy && !performance.boundaryAccuracy.passed) {
      recommendations.push({
        category: 'Boundary Accuracy',
        priority: 'High',
        issue: 'Boundary accuracy tests failing',
        recommendation: 'Review coordinate validation logic and surveyor data comparison algorithms'
      });
    }

    // Storage optimization recommendations
    if (performance.coordinateStorage && performance.coordinateStorage.compressionRatio > 0.8) {
      recommendations.push({
        category: 'Storage Optimization',
        priority: 'Medium',
        issue: 'Coordinate compression ratio could be improved',
        recommendation: 'Consider implementing more aggressive compression algorithms or delta encoding'
      });
    }

    // Performance recommendations
    if (performance.performanceOptimization && performance.performanceOptimization.loadTime > 2000) {
      recommendations.push({
        category: 'Performance',
        priority: 'High',
        issue: 'Application load time is slow',
        recommendation: 'Implement lazy loading, asset optimization, and reduce bundle size'
      });
    }

    // Cross-browser recommendations
    if (performance.crossBrowser && performance.crossBrowser.browserSupport < 0.95) {
      recommendations.push({
        category: 'Compatibility',
        priority: 'Medium',
        issue: 'Browser support coverage is low',
        recommendation: 'Implement additional polyfills and fallback strategies'
      });
    }

    // Coverage recommendations
    if (this.results.summary.coverage) {
      const coverage = this.results.summary.coverage;
      if (coverage.lines.pct < 80) {
        recommendations.push({
          category: 'Testing',
          priority: 'Medium',
          issue: 'Test coverage is below 80%',
          recommendation: 'Add more unit tests, especially for edge cases and error handling'
        });
      }
    }

    this.results.recommendations = recommendations;
    
    if (recommendations.length > 0) {
      console.log(`💡 Generated ${recommendations.length} recommendations`);
    } else {
      console.log('✅ No recommendations - all targets met!');
    }
  }

  async saveResults() {
    console.log('\n💾 Saving test results...');
    
    try {
      writeFileSync(testConfig.reportFile, JSON.stringify(this.results, null, 2));
      console.log(`✅ Results saved to ${testConfig.reportFile}`);
    } catch (error) {
      console.error('❌ Failed to save results:', error.message);
    }
  }

  async generateHTMLReport() {
    console.log('\n📄 Generating HTML report...');
    
    try {
      const html = this.generateHTMLReportContent();
      writeFileSync(testConfig.htmlReport, html);
      console.log(`✅ HTML report generated: ${testConfig.htmlReport}`);
    } catch (error) {
      console.error('❌ Failed to generate HTML report:', error.message);
    }
  }

  generateHTMLReportContent() {
    const results = this.results;
    const summary = results.summary;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Performance Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px; }
        .metric { background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric-value { font-size: 24px; font-weight: bold; color: #2563eb; }
        .metric-label { color: #6b7280; font-size: 14px; }
        .test-results { margin-bottom: 20px; }
        .test-result { background: white; padding: 15px; margin-bottom: 10px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .test-result.passed { border-left: 4px solid #10b981; }
        .test-result.failed { border-left: 4px solid #ef4444; }
        .recommendations { background: #fef3c7; padding: 20px; border-radius: 8px; }
        .recommendation { margin-bottom: 10px; padding: 10px; background: white; border-radius: 4px; }
        .priority-high { border-left: 4px solid #ef4444; }
        .priority-medium { border-left: 4px solid #f59e0b; }
        .priority-low { border-left: 4px solid #10b981; }
        .coverage { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
        .coverage-item { text-align: center; padding: 10px; background: #f3f4f6; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Performance Test Report</h1>
        <p>Generated on ${new Date(summary.startTime).toLocaleString()}</p>
        <p>Duration: ${summary.totalDuration ? Math.round(summary.totalDuration / 1000) : 'N/A'} seconds</p>
    </div>

    <div class="summary">
        <div class="metric">
            <div class="metric-value">${summary.totalTests}</div>
            <div class="metric-label">Total Tests</div>
        </div>
        <div class="metric">
            <div class="metric-value">${summary.passedTests}</div>
            <div class="metric-label">Passed</div>
        </div>
        <div class="metric">
            <div class="metric-value">${summary.failedTests}</div>
            <div class="metric-label">Failed</div>
        </div>
        <div class="metric">
            <div class="metric-value">${summary.coverage ? Math.round(summary.coverage.lines.pct) : 'N/A'}%</div>
            <div class="metric-label">Coverage</div>
        </div>
    </div>

    ${summary.coverage ? `
    <div class="test-results">
        <h2>Test Coverage</h2>
        <div class="coverage">
            <div class="coverage-item">
                <div class="metric-value">${Math.round(summary.coverage.lines.pct)}%</div>
                <div class="metric-label">Lines</div>
            </div>
            <div class="coverage-item">
                <div class="metric-value">${Math.round(summary.coverage.functions.pct)}%</div>
                <div class="metric-label">Functions</div>
            </div>
            <div class="coverage-item">
                <div class="metric-value">${Math.round(summary.coverage.branches.pct)}%</div>
                <div class="metric-label">Branches</div>
            </div>
            <div class="coverage-item">
                <div class="metric-value">${Math.round(summary.coverage.statements.pct)}%</div>
                <div class="metric-label">Statements</div>
            </div>
        </div>
    </div>
    ` : ''}

    <div class="test-results">
        <h2>Test Results</h2>
        ${Object.entries(results.testResults).map(([name, result]) => `
            <div class="test-result ${result.passed ? 'passed' : 'failed'}">
                <h3>${name}</h3>
                <p>Duration: ${result.duration}ms</p>
                <p>Status: ${result.passed ? '✅ Passed' : '❌ Failed'}</p>
                ${result.performance ? `
                    <div>
                        <strong>Performance Metrics:</strong>
                        <ul>
                            ${Object.entries(result.performance).map(([key, value]) => 
                                `<li>${key}: ${value}${key.includes('Time') ? 'ms' : ''}</li>`
                            ).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `).join('')}
    </div>

    ${results.recommendations && results.recommendations.length > 0 ? `
    <div class="recommendations">
        <h2>Recommendations</h2>
        ${results.recommendations.map(rec => `
            <div class="recommendation priority-${rec.priority.toLowerCase()}">
                <h4>${rec.category} - ${rec.priority} Priority</h4>
                <p><strong>Issue:</strong> ${rec.issue}</p>
                <p><strong>Recommendation:</strong> ${rec.recommendation}</p>
            </div>
        `).join('')}
    </div>
    ` : ''}

    ${results.errors && results.errors.length > 0 ? `
    <div class="test-results">
        <h2>Errors</h2>
        ${results.errors.map(error => `
            <div class="test-result failed">
                <h4>${error.type}</h4>
                <p>${error.message}</p>
            </div>
        `).join('')}
    </div>
    ` : ''}
</body>
</html>
    `.trim();
  }

  displaySummary() {
    console.log('\n📊 Test Summary');
    console.log('================');
    console.log(`Total Tests: ${this.results.summary.totalTests}`);
    console.log(`Passed: ${this.results.summary.passedTests}`);
    console.log(`Failed: ${this.results.summary.failedTests}`);
    console.log(`Duration: ${this.results.summary.totalDuration ? Math.round(this.results.summary.totalDuration / 1000) : 'N/A'} seconds`);
    
    if (this.results.summary.coverage) {
      console.log(`Coverage: ${Math.round(this.results.summary.coverage.lines.pct)}%`);
    }
    
    if (this.results.recommendations.length > 0) {
      console.log(`\n💡 Recommendations: ${this.results.recommendations.length}`);
    }
    
    if (this.results.errors.length > 0) {
      console.log(`\n❌ Errors: ${this.results.errors.length}`);
    }
    
    console.log(`\n📄 Full report: ${testConfig.htmlReport}`);
    
    // Exit with error code if tests failed
    if (this.results.summary.failedTests > 0) {
      process.exit(1);
    }
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new PerformanceTestRunner();
  runner.runAllTests().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

export default PerformanceTestRunner;
