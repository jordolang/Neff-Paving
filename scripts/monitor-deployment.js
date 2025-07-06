#!/usr/bin/env node

/**
 * Deployment Monitoring Script
 * Monitors deployment health and detects broken deployments immediately
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

class DeploymentMonitor {
  constructor(options = {}) {
    this.config = {
      urls: options.urls || ['https://neffpaving.com', 'https://www.neffpaving.com'],
      checkInterval: options.checkInterval || 60000, // 1 minute
      timeout: options.timeout || 30000, // 30 seconds
      retries: options.retries || 3,
      alertThreshold: options.alertThreshold || 2, // failures before alert
      logFile: path.join(projectRoot, 'deployment-monitor.log'),
      statusFile: path.join(projectRoot, 'deployment-status.json'),
      webhookUrl: options.webhookUrl || null,
      emailConfig: options.emailConfig || null
    };
    
    this.state = {
      isRunning: false,
      consecutiveFailures: 0,
      lastSuccessTime: null,
      lastFailureTime: null,
      totalChecks: 0,
      successCount: 0,
      failureCount: 0,
      startTime: new Date(),
      alerts: []
    };
    
    this.checks = [];
    this.setupChecks();
  }

  setupChecks() {
    // Core functionality checks
    this.addCheck('Homepage loads', this.checkHomepage.bind(this));
    this.addCheck('Admin panel accessible', this.checkAdminPanel.bind(this));
    this.addCheck('Services page loads', this.checkServicesPage.bind(this));
    this.addCheck('API health endpoint', this.checkApiHealth.bind(this));
    
    // Asset checks
    this.addCheck('Main CSS loads', this.checkMainStyles.bind(this));
    this.addCheck('Main JS loads', this.checkMainScript.bind(this));
    
    // Performance checks
    this.addCheck('Response time acceptable', this.checkResponseTime.bind(this));
    this.addCheck('No server errors', this.checkServerErrors.bind(this));
    
    // Security checks
    this.addCheck('Security headers present', this.checkSecurityHeaders.bind(this));
    this.addCheck('SSL certificate valid', this.checkSSLCertificate.bind(this));
  }

  addCheck(name, checkFn) {
    this.checks.push({ name, checkFn });
  }

  async start() {
    if (this.state.isRunning) {
      console.log('Monitor is already running');
      return;
    }

    console.log('🚀 Starting deployment monitor...');
    console.log(`URLs: ${this.config.urls.join(', ')}`);
    console.log(`Check interval: ${this.config.checkInterval}ms`);
    console.log(`Alert threshold: ${this.config.alertThreshold} failures\n`);

    this.state.isRunning = true;
    this.state.startTime = new Date();

    // Initial check
    await this.runChecks();

    // Set up interval
    this.intervalId = setInterval(async () => {
      await this.runChecks();
    }, this.config.checkInterval);

    // Set up graceful shutdown
    process.on('SIGINT', () => this.stop());
    process.on('SIGTERM', () => this.stop());
  }

  async stop() {
    if (!this.state.isRunning) {
      return;
    }

    console.log('\n🛑 Stopping deployment monitor...');
    
    this.state.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    await this.saveStatus();
    console.log('Monitor stopped');
    process.exit(0);
  }

  async runChecks() {
    const timestamp = new Date().toISOString();
    console.log(`\n🔍 Running checks at ${timestamp}...`);

    this.state.totalChecks++;
    let allPassed = true;
    const results = [];

    for (const check of this.checks) {
      try {
        await check.checkFn();
        results.push({ name: check.name, status: 'pass', error: null });
        console.log(`✅ ${check.name}`);
      } catch (error) {
        results.push({ name: check.name, status: 'fail', error: error.message });
        console.log(`❌ ${check.name}: ${error.message}`);
        allPassed = false;
      }
    }

    if (allPassed) {
      this.handleSuccess(results);
    } else {
      this.handleFailure(results);
    }

    await this.logResults(timestamp, results);
    await this.saveStatus();
  }

  handleSuccess(results) {
    this.state.successCount++;
    this.state.lastSuccessTime = new Date();
    
    if (this.state.consecutiveFailures > 0) {
      console.log(`🎉 Service recovered after ${this.state.consecutiveFailures} failures`);
      this.sendAlert('recovery', {
        message: `Service recovered after ${this.state.consecutiveFailures} consecutive failures`,
        previousFailures: this.state.consecutiveFailures
      });
    }
    
    this.state.consecutiveFailures = 0;
  }

  handleFailure(results) {
    this.state.failureCount++;
    this.state.consecutiveFailures++;
    this.state.lastFailureTime = new Date();

    const failedChecks = results.filter(r => r.status === 'fail');
    
    console.log(`🚨 ${failedChecks.length} check(s) failed (${this.state.consecutiveFailures} consecutive failures)`);

    if (this.state.consecutiveFailures >= this.config.alertThreshold) {
      this.sendAlert('failure', {
        message: `Deployment health check failed: ${this.state.consecutiveFailures} consecutive failures`,
        failedChecks: failedChecks,
        consecutiveFailures: this.state.consecutiveFailures
      });
    }
  }

  // Check implementations

  async checkHomepage() {
    for (const url of this.config.urls) {
      const response = await this.fetchWithTimeout(url);
      
      if (!response.ok) {
        throw new Error(`Homepage returned ${response.status}: ${response.statusText}`);
      }
      
      const content = await response.text();
      
      if (!content.includes('<title>') || content.length < 1000) {
        throw new Error('Homepage content appears incomplete');
      }
    }
  }

  async checkAdminPanel() {
    const adminUrls = this.config.urls.map(url => `${url}/admin`);
    
    for (const url of adminUrls) {
      const response = await this.fetchWithTimeout(url);
      
      // Admin panel should at least return something (even if redirecting to login)
      if (response.status >= 500) {
        throw new Error(`Admin panel returned server error: ${response.status}`);
      }
    }
  }

  async checkServicesPage() {
    const serviceUrls = this.config.urls.map(url => `${url}/services`);
    
    for (const url of serviceUrls) {
      const response = await this.fetchWithTimeout(url);
      
      if (!response.ok) {
        throw new Error(`Services page returned ${response.status}: ${response.statusText}`);
      }
    }
  }

  async checkApiHealth() {
    const healthUrls = this.config.urls.map(url => `${url}/api/health`);
    
    for (const url of healthUrls) {
      try {
        const response = await this.fetchWithTimeout(url);
        
        // Health endpoint should return 200 or at least not 500
        if (response.status >= 500) {
          throw new Error(`Health endpoint returned ${response.status}`);
        }
        
        // Try to parse JSON if content-type suggests it
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          await response.json(); // Will throw if invalid JSON
        }
      } catch (error) {
        if (error.message.includes('fetch')) {
          throw new Error('Health endpoint not accessible');
        }
        throw error;
      }
    }
  }

  async checkMainStyles() {
    // This would need to be adapted based on your actual build output
    const stylePaths = ['/assets/main.css', '/assets/index.css'];
    
    for (const baseUrl of this.config.urls) {
      let found = false;
      
      for (const stylePath of stylePaths) {
        try {
          const response = await this.fetchWithTimeout(`${baseUrl}${stylePath}`);
          if (response.ok) {
            const content = await response.text();
            if (content.length > 100) { // Basic validation
              found = true;
              break;
            }
          }
        } catch (error) {
          // Try next path
        }
      }
      
      if (!found) {
        throw new Error('No valid main stylesheet found');
      }
    }
  }

  async checkMainScript() {
    // This would need to be adapted based on your actual build output
    const scriptPaths = ['/assets/main.js', '/assets/index.js'];
    
    for (const baseUrl of this.config.urls) {
      let found = false;
      
      for (const scriptPath of scriptPaths) {
        try {
          const response = await this.fetchWithTimeout(`${baseUrl}${scriptPath}`);
          if (response.ok) {
            const content = await response.text();
            if (content.length > 100) { // Basic validation
              found = true;
              break;
            }
          }
        } catch (error) {
          // Try next path
        }
      }
      
      if (!found) {
        throw new Error('No valid main script found');
      }
    }
  }

  async checkResponseTime() {
    for (const url of this.config.urls) {
      const startTime = Date.now();
      const response = await this.fetchWithTimeout(url);
      const endTime = Date.now();
      
      const responseTime = endTime - startTime;
      const maxResponseTime = 10000; // 10 seconds
      
      if (responseTime > maxResponseTime) {
        throw new Error(`Response time too slow: ${responseTime}ms > ${maxResponseTime}ms`);
      }
      
      if (!response.ok) {
        throw new Error(`Response time check failed: HTTP ${response.status}`);
      }
    }
  }

  async checkServerErrors() {
    for (const url of this.config.urls) {
      const response = await this.fetchWithTimeout(url);
      
      if (response.status >= 500) {
        throw new Error(`Server error detected: HTTP ${response.status}`);
      }
    }
  }

  async checkSecurityHeaders() {
    const requiredHeaders = ['x-content-type-options', 'x-frame-options'];
    
    for (const url of this.config.urls) {
      const response = await this.fetchWithTimeout(url);
      
      const missingHeaders = [];
      for (const header of requiredHeaders) {
        if (!response.headers.has(header)) {
          missingHeaders.push(header);
        }
      }
      
      if (missingHeaders.length > 0) {
        throw new Error(`Missing security headers: ${missingHeaders.join(', ')}`);
      }
    }
  }

  async checkSSLCertificate() {
    // This is a basic check - in production you might want more thorough SSL validation
    for (const url of this.config.urls) {
      if (url.startsWith('https://')) {
        try {
          const response = await this.fetchWithTimeout(url);
          // If we can make the request, SSL is probably working
          if (response.status >= 500) {
            throw new Error('SSL check inconclusive due to server error');
          }
        } catch (error) {
          if (error.message.includes('certificate') || error.message.includes('SSL')) {
            throw new Error('SSL certificate issue detected');
          }
          // Re-throw other errors
          throw error;
        }
      }
    }
  }

  // Utility methods

  async fetchWithTimeout(url) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Deployment-Monitor/1.0'
        }
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.config.timeout}ms`);
      }
      throw error;
    }
  }

  async logResults(timestamp, results) {
    const logEntry = {
      timestamp,
      results,
      consecutiveFailures: this.state.consecutiveFailures,
      totalChecks: this.state.totalChecks,
      successRate: ((this.state.successCount / this.state.totalChecks) * 100).toFixed(2) + '%'
    };

    const logLine = JSON.stringify(logEntry) + '\n';
    
    try {
      await fs.appendFile(this.config.logFile, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error.message);
    }
  }

  async saveStatus() {
    const status = {
      ...this.state,
      config: {
        urls: this.config.urls,
        checkInterval: this.config.checkInterval,
        alertThreshold: this.config.alertThreshold
      },
      uptime: Date.now() - this.state.startTime.getTime(),
      successRate: this.state.totalChecks > 0 
        ? ((this.state.successCount / this.state.totalChecks) * 100).toFixed(2) + '%' 
        : '0%'
    };

    try {
      await fs.writeFile(this.config.statusFile, JSON.stringify(status, null, 2));
    } catch (error) {
      console.error('Failed to save status file:', error.message);
    }
  }

  sendAlert(type, data) {
    const alert = {
      type,
      timestamp: new Date().toISOString(),
      data,
      urls: this.config.urls
    };

    this.state.alerts.push(alert);

    // Console alert
    console.log(`\n🚨 ALERT [${type.toUpperCase()}]: ${data.message}`);

    // Webhook alert
    if (this.config.webhookUrl) {
      this.sendWebhookAlert(alert).catch(error => {
        console.error('Failed to send webhook alert:', error.message);
      });
    }

    // Email alert
    if (this.config.emailConfig) {
      this.sendEmailAlert(alert).catch(error => {
        console.error('Failed to send email alert:', error.message);
      });
    }
  }

  async sendWebhookAlert(alert) {
    try {
      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alert)
      });

      if (!response.ok) {
        throw new Error(`Webhook returned ${response.status}`);
      }
    } catch (error) {
      throw new Error(`Webhook delivery failed: ${error.message}`);
    }
  }

  async sendEmailAlert(alert) {
    // Email implementation would go here
    // This would typically use nodemailer or similar
    console.log('Email alert not implemented yet');
  }

  printStatus() {
    const uptime = Date.now() - this.state.startTime.getTime();
    const uptimeHours = (uptime / (1000 * 60 * 60)).toFixed(2);
    
    console.log('\n📊 Monitor Status:');
    console.log(`Uptime: ${uptimeHours} hours`);
    console.log(`Total checks: ${this.state.totalChecks}`);
    console.log(`Success rate: ${this.state.totalChecks > 0 ? ((this.state.successCount / this.state.totalChecks) * 100).toFixed(2) : 0}%`);
    console.log(`Consecutive failures: ${this.state.consecutiveFailures}`);
    console.log(`Last success: ${this.state.lastSuccessTime ? this.state.lastSuccessTime.toISOString() : 'Never'}`);
    console.log(`Last failure: ${this.state.lastFailureTime ? this.state.lastFailureTime.toISOString() : 'Never'}`);
    console.log(`Alerts sent: ${this.state.alerts.length}`);
  }
}

// Run monitor if called directly
if (process.argv[1] === __filename) {
  const options = {};
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--urls' && i + 1 < args.length) {
      options.urls = args[i + 1].split(',');
      i++;
    } else if (arg === '--interval' && i + 1 < args.length) {
      options.checkInterval = parseInt(args[i + 1], 10) * 1000; // Convert to ms
      i++;
    } else if (arg === '--timeout' && i + 1 < args.length) {
      options.timeout = parseInt(args[i + 1], 10) * 1000; // Convert to ms
      i++;
    } else if (arg === '--webhook' && i + 1 < args.length) {
      options.webhookUrl = args[i + 1];
      i++;
    } else if (arg === '--status') {
      // Print status and exit
      const monitor = new DeploymentMonitor(options);
      monitor.printStatus();
      process.exit(0);
    }
  }
  
  const monitor = new DeploymentMonitor(options);
  
  // Handle status printing
  setInterval(() => {
    monitor.printStatus();
  }, 300000); // Every 5 minutes
  
  monitor.start().catch(error => {
    console.error('Monitor failed to start:', error);
    process.exit(1);
  });
}

export { DeploymentMonitor };
