#!/usr/bin/env node
/**
 * Automated Platform Monitoring Script
 * Monitors both GitHub Pages and Vercel deployments
 * Performs health checks, performance monitoring, and alerting
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Platform configurations
const platforms = {
    github: {
        name: 'GitHub Pages',
        url: 'https://neff-paving.github.io',
        healthEndpoint: '/api/health',
        servicesEndpoint: '/api/services/status',
        adminEndpoint: '/admin',
        expectedResponseTime: 3000,
        retryAttempts: 3
    },
    vercel: {
        name: 'Vercel',
        url: 'https://neff-paving.vercel.app',
        healthEndpoint: '/api/health',
        servicesEndpoint: '/api/services/status',
        adminEndpoint: '/admin',
        expectedResponseTime: 2000,
        retryAttempts: 3
    }
};

// ANSI color codes
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

// Monitoring results
const monitoringResults = {
    timestamp: new Date().toISOString(),
    platforms: {},
    summary: {
        totalPlatforms: 0,
        healthyPlatforms: 0,
        degradedPlatforms: 0,
        unhealthyPlatforms: 0
    },
    alerts: []
};

// Utility function for HTTP requests with timeout
async function makeRequest(url, timeout = 10000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Neff-Paving-Monitor/1.0'
            }
        });
        
        clearTimeout(timeoutId);
        
        return {
            ok: response.ok,
            status: response.status,
            statusText: response.statusText,
            data: response.ok ? await response.json().catch(() => null) : null,
            responseTime: Date.now()
        };
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

// Monitor individual platform
async function monitorPlatform(platformKey, config) {
    console.log(`\n${colors.blue}${colors.bold}=== Monitoring ${config.name} ===${colors.reset}`);
    
    const platformResult = {
        name: config.name,
        url: config.url,
        status: 'unknown',
        checks: {},
        metrics: {},
        issues: [],
        timestamp: new Date().toISOString()
    };
    
    try {
        // 1. Main site availability check
        console.log(`${colors.cyan}Checking main site availability...${colors.reset}`);
        const startTime = Date.now();
        
        try {
            const mainResponse = await makeRequest(config.url, config.expectedResponseTime);
            const responseTime = Date.now() - startTime;
            
            platformResult.checks.mainSite = {
                status: mainResponse.ok ? 'healthy' : 'unhealthy',
                responseTime,
                httpStatus: mainResponse.status,
                details: mainResponse.ok ? 'Site accessible' : `HTTP ${mainResponse.status}`
            };
            
            if (responseTime > config.expectedResponseTime) {
                platformResult.issues.push(`Slow response time: ${responseTime}ms (expected < ${config.expectedResponseTime}ms)`);
            }
            
            console.log(`${mainResponse.ok ? colors.green : colors.red}Main site: ${mainResponse.status} (${responseTime}ms)${colors.reset}`);
            
        } catch (error) {
            platformResult.checks.mainSite = {
                status: 'unhealthy',
                responseTime: null,
                error: error.message,
                details: 'Site unreachable'
            };
            
            platformResult.issues.push(`Main site unreachable: ${error.message}`);
            console.log(`${colors.red}Main site: UNREACHABLE - ${error.message}${colors.reset}`);
        }
        
        // 2. Health endpoint check
        console.log(`${colors.cyan}Checking health endpoint...${colors.reset}`);
        
        try {
            const healthResponse = await makeRequest(config.url + config.healthEndpoint);
            const healthData = healthResponse.data;
            
            platformResult.checks.healthEndpoint = {
                status: healthResponse.ok && healthData?.status === 'healthy' ? 'healthy' : 'degraded',
                responseTime: healthData?.metrics?.responseTime || null,
                details: healthData || 'No health data',
                httpStatus: healthResponse.status
            };
            
            if (healthData) {
                platformResult.metrics.uptime = healthData.uptime;
                platformResult.metrics.memory = healthData.metrics?.memory;
                platformResult.metrics.features = healthData.features;
            }
            
            console.log(`${healthResponse.ok ? colors.green : colors.red}Health endpoint: ${healthResponse.status}${colors.reset}`);
            
        } catch (error) {
            platformResult.checks.healthEndpoint = {
                status: 'unhealthy',
                error: error.message,
                details: 'Health endpoint unreachable'
            };
            
            platformResult.issues.push(`Health endpoint unreachable: ${error.message}`);
            console.log(`${colors.red}Health endpoint: UNREACHABLE - ${error.message}${colors.reset}`);
        }
        
        // 3. Services status check
        console.log(`${colors.cyan}Checking services status...${colors.reset}`);
        
        try {
            const servicesResponse = await makeRequest(config.url + config.servicesEndpoint);
            const servicesData = servicesResponse.data;
            
            platformResult.checks.servicesSection = {
                status: servicesResponse.ok && servicesData?.status === 'healthy' ? 'healthy' : 'degraded',
                categories: servicesData?.checks?.categories?.count || 0,
                features: servicesData?.features || {},
                details: servicesData || 'No services data',
                httpStatus: servicesResponse.status
            };
            
            if (servicesData?.checks?.categories?.count < 4) {
                platformResult.issues.push('Insufficient service categories available');
            }
            
            console.log(`${servicesResponse.ok ? colors.green : colors.red}Services status: ${servicesResponse.status}${colors.reset}`);
            
        } catch (error) {
            platformResult.checks.servicesSection = {
                status: 'unhealthy',
                error: error.message,
                details: 'Services endpoint unreachable'
            };
            
            platformResult.issues.push(`Services endpoint unreachable: ${error.message}`);
            console.log(`${colors.red}Services status: UNREACHABLE - ${error.message}${colors.reset}`);
        }
        
        // 4. Admin panel accessibility check
        console.log(`${colors.cyan}Checking admin panel accessibility...${colors.reset}`);
        
        try {
            const adminResponse = await makeRequest(config.url + config.adminEndpoint);
            
            platformResult.checks.adminPanel = {
                status: adminResponse.ok ? 'healthy' : 'degraded',
                httpStatus: adminResponse.status,
                details: adminResponse.ok ? 'Admin panel accessible' : `HTTP ${adminResponse.status}`
            };
            
            console.log(`${adminResponse.ok ? colors.green : colors.red}Admin panel: ${adminResponse.status}${colors.reset}`);
            
        } catch (error) {
            platformResult.checks.adminPanel = {
                status: 'unhealthy',
                error: error.message,
                details: 'Admin panel unreachable'
            };
            
            platformResult.issues.push(`Admin panel unreachable: ${error.message}`);
            console.log(`${colors.red}Admin panel: UNREACHABLE - ${error.message}${colors.reset}`);
        }
        
        // 5. Performance metrics calculation
        const responseTimeValues = Object.values(platformResult.checks)
            .map(check => check.responseTime)
            .filter(time => time !== null && time !== undefined);
        
        platformResult.metrics.averageResponseTime = responseTimeValues.length > 0 
            ? Math.round(responseTimeValues.reduce((a, b) => a + b, 0) / responseTimeValues.length)
            : null;
        
        // 6. Overall platform status determination
        const checkStatuses = Object.values(platformResult.checks).map(check => check.status);
        const hasUnhealthy = checkStatuses.includes('unhealthy');
        const hasDegraded = checkStatuses.includes('degraded');
        
        if (hasUnhealthy) {
            platformResult.status = 'unhealthy';
            monitoringResults.summary.unhealthyPlatforms++;
        } else if (hasDegraded) {
            platformResult.status = 'degraded';
            monitoringResults.summary.degradedPlatforms++;
        } else {
            platformResult.status = 'healthy';
            monitoringResults.summary.healthyPlatforms++;
        }
        
        // Add alerts for issues
        if (platformResult.issues.length > 0) {
            monitoringResults.alerts.push({
                platform: config.name,
                severity: platformResult.status === 'unhealthy' ? 'critical' : 'warning',
                issues: platformResult.issues,
                timestamp: new Date().toISOString()
            });
        }
        
        const statusColor = platformResult.status === 'healthy' ? colors.green :
                           platformResult.status === 'degraded' ? colors.yellow : colors.red;
        
        console.log(`\n${statusColor}${colors.bold}Platform Status: ${platformResult.status.toUpperCase()}${colors.reset}`);
        
        if (platformResult.metrics.averageResponseTime) {
            console.log(`${colors.cyan}Average Response Time: ${platformResult.metrics.averageResponseTime}ms${colors.reset}`);
        }
        
        if (platformResult.issues.length > 0) {
            console.log(`${colors.yellow}Issues (${platformResult.issues.length}):${colors.reset}`);
            platformResult.issues.forEach(issue => {
                console.log(`  - ${issue}`);
            });
        }
        
    } catch (error) {
        platformResult.status = 'unhealthy';
        platformResult.issues.push(`Monitoring error: ${error.message}`);
        monitoringResults.summary.unhealthyPlatforms++;
        
        console.log(`${colors.red}${colors.bold}MONITORING ERROR: ${error.message}${colors.reset}`);
    }
    
    return platformResult;
}

// Generate monitoring report
function generateReport() {
    console.log(`\n${colors.bold}${colors.blue}=== MONITORING SUMMARY ===${colors.reset}`);
    
    const summary = monitoringResults.summary;
    console.log(`${colors.green}✅ Healthy: ${summary.healthyPlatforms}${colors.reset}`);
    console.log(`${colors.yellow}⚠️  Degraded: ${summary.degradedPlatforms}${colors.reset}`);
    console.log(`${colors.red}❌ Unhealthy: ${summary.unhealthyPlatforms}${colors.reset}`);
    
    // Overall system health
    const totalPlatforms = summary.totalPlatforms;
    const healthyPercentage = totalPlatforms > 0 ? Math.round((summary.healthyPlatforms / totalPlatforms) * 100) : 0;
    
    console.log(`\n${colors.bold}Overall System Health: ${healthyPercentage}%${colors.reset}`);
    
    if (healthyPercentage >= 100) {
        console.log(`${colors.green}${colors.bold}🎉 ALL SYSTEMS OPERATIONAL${colors.reset}`);
    } else if (healthyPercentage >= 50) {
        console.log(`${colors.yellow}${colors.bold}⚠️  PARTIAL SYSTEM ISSUES${colors.reset}`);
    } else {
        console.log(`${colors.red}${colors.bold}🚨 CRITICAL SYSTEM ISSUES${colors.reset}`);
    }
    
    // Show alerts
    if (monitoringResults.alerts.length > 0) {
        console.log(`\n${colors.bold}${colors.red}=== ALERTS ===${colors.reset}`);
        monitoringResults.alerts.forEach((alert, index) => {
            const severityColor = alert.severity === 'critical' ? colors.red : colors.yellow;
            console.log(`\n${severityColor}${colors.bold}Alert ${index + 1}: ${alert.platform} (${alert.severity.toUpperCase()})${colors.reset}`);
            alert.issues.forEach(issue => {
                console.log(`  - ${issue}`);
            });
        });
    }
    
    // Save detailed report
    const reportPath = path.join(projectRoot, 'monitoring-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(monitoringResults, null, 2));
    
    console.log(`\n${colors.blue}📄 Detailed report saved to: ${reportPath}${colors.reset}`);
    
    return monitoringResults;
}

// Main monitoring function
async function runMonitoring() {
    console.log(`${colors.bold}${colors.blue}🔍 Neff Paving Platform Monitoring${colors.reset}\n`);
    console.log(`${colors.blue}Starting monitoring at: ${new Date().toISOString()}${colors.reset}\n`);
    
    monitoringResults.summary.totalPlatforms = Object.keys(platforms).length;
    
    // Monitor each platform
    for (const [key, config] of Object.entries(platforms)) {
        const platformResult = await monitorPlatform(key, config);
        monitoringResults.platforms[key] = platformResult;
        
        // Add delay between platform checks
        if (Object.keys(platforms).indexOf(key) < Object.keys(platforms).length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    // Generate and display final report
    const report = generateReport();
    
    // Exit with appropriate code based on system health
    const criticalIssues = monitoringResults.alerts.filter(alert => alert.severity === 'critical').length;
    const overallHealth = monitoringResults.summary.healthyPlatforms / monitoringResults.summary.totalPlatforms;
    
    if (criticalIssues > 0 || overallHealth < 0.5) {
        process.exit(1); // Critical issues detected
    } else if (overallHealth < 1.0) {
        process.exit(2); // Some issues detected
    } else {
        process.exit(0); // All systems healthy
    }
}

// Continuous monitoring mode
async function runContinuousMonitoring(intervalMinutes = 5) {
    console.log(`${colors.blue}Starting continuous monitoring (${intervalMinutes} minute intervals)...${colors.reset}\n`);
    
    const intervalMs = intervalMinutes * 60 * 1000;
    
    while (true) {
        try {
            await runMonitoring();
        } catch (error) {
            console.log(`${colors.red}Monitoring cycle failed: ${error.message}${colors.reset}`);
        }
        
        console.log(`\n${colors.cyan}Waiting ${intervalMinutes} minutes before next check...${colors.reset}`);
        await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
}

// CLI handling
if (import.meta.url === `file://${process.argv[1]}`) {
    const args = process.argv.slice(2);
    
    if (args.includes('--continuous')) {
        const intervalIndex = args.indexOf('--interval');
        const interval = intervalIndex !== -1 && args[intervalIndex + 1] 
            ? parseInt(args[intervalIndex + 1]) 
            : 5;
        
        runContinuousMonitoring(interval).catch(console.error);
    } else {
        runMonitoring().catch(console.error);
    }
}

export { runMonitoring, runContinuousMonitoring, platforms };
