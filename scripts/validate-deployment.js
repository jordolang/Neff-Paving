#!/usr/bin/env node
/**
 * Comprehensive Deployment Validation Script
 * Validates deployment readiness, health checks, and critical functionality
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// ANSI color codes
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

// Validation results tracker
const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    tests: []
};

// Test result logging
function logResult(test, status, message, details = null) {
    const timestamp = new Date().toISOString();
    const result = { test, status, message, details, timestamp };
    results.tests.push(result);
    
    const color = status === 'PASS' ? colors.green : 
                  status === 'FAIL' ? colors.red : colors.yellow;
    
    console.log(`${color}[${status}]${colors.reset} ${test}: ${message}`);
    
    if (details) {
        console.log(`  Details: ${JSON.stringify(details, null, 2)}`);
    }
    
    if (status === 'PASS') results.passed++;
    else if (status === 'FAIL') results.failed++;
    else results.warnings++;
}

// Critical file existence checks
function validateCriticalFiles() {
    console.log(`\n${colors.bold}=== Critical Files Validation ===${colors.reset}`);
    
    const criticalFiles = [
        'index.html',
        'package.json',
        'vercel.json',
        'styles/main.css',
        'src/main.js',
        'admin/index.html',
        'api/health.js',
        'api/services/status.js'
    ];
    
    criticalFiles.forEach(file => {
        const filePath = path.join(projectRoot, file);
        if (fs.existsSync(filePath)) {
            logResult(`File Check: ${file}`, 'PASS', 'File exists');
        } else {
            logResult(`File Check: ${file}`, 'FAIL', 'File missing', { path: filePath });
        }
    });
}

// Build output validation
function validateBuildOutput() {
    console.log(`\n${colors.bold}=== Build Output Validation ===${colors.reset}`);
    
    const distPath = path.join(projectRoot, 'dist');
    
    if (!fs.existsSync(distPath)) {
        logResult('Build Output', 'FAIL', 'dist directory not found', { expected: distPath });
        return;
    }
    
    logResult('Build Output', 'PASS', 'dist directory exists');
    
    // Check for essential built files
    const builtFiles = [
        'index.html',
        'admin/index.html',
        'services/index.html'
    ];
    
    builtFiles.forEach(file => {
        const filePath = path.join(distPath, file);
        if (fs.existsSync(filePath)) {
            logResult(`Built File: ${file}`, 'PASS', 'Built file exists');
        } else {
            logResult(`Built File: ${file}`, 'FAIL', 'Built file missing', { path: filePath });
        }
    });
    
    // Check for asset files
    const assetDirs = ['assets/styles', 'assets/images', 'assets/videos'];
    assetDirs.forEach(dir => {
        const dirPath = path.join(distPath, dir);
        if (fs.existsSync(dirPath)) {
            const files = fs.readdirSync(dirPath);
            logResult(`Asset Directory: ${dir}`, 'PASS', `${files.length} files found`);
        } else {
            logResult(`Asset Directory: ${dir}`, 'WARN', 'Directory not found');
        }
    });
}

// Services section validation
function validateServicesSection() {
    console.log(`\n${colors.bold}=== Services Section Validation ===${colors.reset}`);
    
    const indexPath = path.join(projectRoot, 'index.html');
    
    if (!fs.existsSync(indexPath)) {
        logResult('Services Section', 'FAIL', 'index.html not found');
        return;
    }
    
    const htmlContent = fs.readFileSync(indexPath, 'utf-8');
    
    // Check for services section
    if (htmlContent.includes('id="services"') || htmlContent.includes('class="services"')) {
        logResult('Services Section', 'PASS', 'Services section found in HTML');
    } else {
        logResult('Services Section', 'FAIL', 'Services section not found in HTML');
    }
    
    // Check for service categories
    const serviceKeywords = [
        'residential', 'commercial', 'maintenance', 
        'asphalt', 'concrete', 'paving'
    ];
    
    serviceKeywords.forEach(keyword => {
        if (htmlContent.toLowerCase().includes(keyword)) {
            logResult(`Service Keyword: ${keyword}`, 'PASS', 'Keyword found in content');
        } else {
            logResult(`Service Keyword: ${keyword}`, 'WARN', 'Keyword not found in content');
        }
    });
    
    // Check for pricing information
    if (htmlContent.includes('pricing') || htmlContent.includes('estimate')) {
        logResult('Pricing Information', 'PASS', 'Pricing information found');
    } else {
        logResult('Pricing Information', 'WARN', 'Pricing information not clearly visible');
    }
}

// Admin panel validation
function validateAdminPanel() {
    console.log(`\n${colors.bold}=== Admin Panel Validation ===${colors.reset}`);
    
    const adminPath = path.join(projectRoot, 'admin/index.html');
    
    if (!fs.existsSync(adminPath)) {
        logResult('Admin Panel', 'FAIL', 'Admin panel HTML not found');
        return;
    }
    
    const adminHtml = fs.readFileSync(adminPath, 'utf-8');
    
    // Check for essential admin components
    const adminComponents = [
        { name: 'Login Screen', pattern: 'login' },
        { name: 'Dashboard', pattern: 'dashboard' },
        { name: 'Navigation', pattern: 'nav' },
        { name: 'Bootstrap', pattern: 'bootstrap' },
        { name: 'User Management', pattern: 'user' },
        { name: 'Job Management', pattern: 'job' }
    ];
    
    adminComponents.forEach(component => {
        if (adminHtml.toLowerCase().includes(component.pattern)) {
            logResult(`Admin: ${component.name}`, 'PASS', `${component.name} component found`);
        } else {
            logResult(`Admin: ${component.name}`, 'WARN', `${component.name} component not clearly visible`);
        }
    });
    
    // Check for responsive design
    if (adminHtml.includes('viewport') && adminHtml.includes('responsive')) {
        logResult('Admin Responsive', 'PASS', 'Responsive design elements found');
    } else {
        logResult('Admin Responsive', 'WARN', 'Responsive design not clearly implemented');
    }
}

// Configuration validation
function validateConfiguration() {
    console.log(`\n${colors.bold}=== Configuration Validation ===${colors.reset}`);
    
    // Vercel configuration
    const vercelPath = path.join(projectRoot, 'vercel.json');
    if (fs.existsSync(vercelPath)) {
        const vercelConfig = JSON.parse(fs.readFileSync(vercelPath, 'utf-8'));
        
        logResult('Vercel Config', 'PASS', 'vercel.json found and valid');
        
        // Check for essential routes
        if (vercelConfig.rewrites) {
            const hasServicesRoute = vercelConfig.rewrites.some(r => r.source.includes('services'));
            const hasAdminRoute = vercelConfig.rewrites.some(r => r.source.includes('admin'));
            const hasApiRoute = vercelConfig.rewrites.some(r => r.source.includes('api'));
            
            logResult('Services Route', hasServicesRoute ? 'PASS' : 'FAIL', 
                     hasServicesRoute ? 'Services route configured' : 'Services route missing');
            logResult('Admin Route', hasAdminRoute ? 'PASS' : 'FAIL',
                     hasAdminRoute ? 'Admin route configured' : 'Admin route missing');
            logResult('API Route', hasApiRoute ? 'PASS' : 'FAIL',
                     hasApiRoute ? 'API route configured' : 'API route missing');
        }
        
        // Check for performance headers
        if (vercelConfig.headers) {
            logResult('Performance Headers', 'PASS', 'Performance headers configured');
        } else {
            logResult('Performance Headers', 'WARN', 'Performance headers not configured');
        }
    } else {
        logResult('Vercel Config', 'FAIL', 'vercel.json not found');
    }
    
    // Package.json validation
    const packagePath = path.join(projectRoot, 'package.json');
    if (fs.existsSync(packagePath)) {
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
        
        logResult('Package Config', 'PASS', 'package.json found and valid');
        
        // Check for essential scripts
        const essentialScripts = ['build', 'dev', 'deploy', 'test'];
        essentialScripts.forEach(script => {
            if (packageJson.scripts && packageJson.scripts[script]) {
                logResult(`Script: ${script}`, 'PASS', `${script} script configured`);
            } else {
                logResult(`Script: ${script}`, 'WARN', `${script} script not found`);
            }
        });
        
        // Check for essential dependencies
        const essentialDeps = ['vite', 'express'];
        essentialDeps.forEach(dep => {
            if ((packageJson.dependencies && packageJson.dependencies[dep]) ||
                (packageJson.devDependencies && packageJson.devDependencies[dep])) {
                logResult(`Dependency: ${dep}`, 'PASS', `${dep} dependency found`);
            } else {
                logResult(`Dependency: ${dep}`, 'WARN', `${dep} dependency not found`);
            }
        });
    } else {
        logResult('Package Config', 'FAIL', 'package.json not found');
    }
}

// SEO and metadata validation
function validateSEOAndMeta() {
    console.log(`\n${colors.bold}=== SEO and Metadata Validation ===${colors.reset}`);
    
    const indexPath = path.join(projectRoot, 'index.html');
    
    if (!fs.existsSync(indexPath)) {
        logResult('SEO Validation', 'FAIL', 'index.html not found');
        return;
    }
    
    const htmlContent = fs.readFileSync(indexPath, 'utf-8');
    
    // Essential meta tags
    const metaTags = [
        { name: 'Title', pattern: '<title>' },
        { name: 'Description', pattern: 'name="description"' },
        { name: 'Keywords', pattern: 'name="keywords"' },
        { name: 'Viewport', pattern: 'name="viewport"' },
        { name: 'Canonical', pattern: 'rel="canonical"' },
        { name: 'Open Graph', pattern: 'property="og:' },
        { name: 'Twitter Card', pattern: 'property="twitter:' }
    ];
    
    metaTags.forEach(tag => {
        if (htmlContent.includes(tag.pattern)) {
            logResult(`Meta: ${tag.name}`, 'PASS', `${tag.name} tag found`);
        } else {
            logResult(`Meta: ${tag.name}`, 'FAIL', `${tag.name} tag missing`);
        }
    });
    
    // Structured data validation
    if (htmlContent.includes('application/ld+json')) {
        logResult('Structured Data', 'PASS', 'JSON-LD structured data found');
        
        try {
            const ldJsonMatch = htmlContent.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
            if (ldJsonMatch) {
                const ldJson = JSON.parse(ldJsonMatch[1]);
                if (ldJson['@context'] && ldJson['@graph']) {
                    logResult('Structured Data Format', 'PASS', 'Valid JSON-LD format');
                } else {
                    logResult('Structured Data Format', 'WARN', 'JSON-LD format may be incomplete');
                }
            }
        } catch (error) {
            logResult('Structured Data Format', 'FAIL', 'Invalid JSON-LD format', { error: error.message });
        }
    } else {
        logResult('Structured Data', 'FAIL', 'Structured data not found');
    }
}

// Performance validation
function validatePerformance() {
    console.log(`\n${colors.bold}=== Performance Validation ===${colors.reset}`);
    
    const indexPath = path.join(projectRoot, 'index.html');
    
    if (!fs.existsSync(indexPath)) {
        logResult('Performance Validation', 'FAIL', 'index.html not found');
        return;
    }
    
    const htmlContent = fs.readFileSync(indexPath, 'utf-8');
    
    // Performance optimizations
    const performanceChecks = [
        { name: 'Preconnect', pattern: 'rel="preconnect"' },
        { name: 'Preload', pattern: 'rel="preload"' },
        { name: 'Font Display', pattern: 'font-display' },
        { name: 'Lazy Loading', pattern: 'loading="lazy"' },
        { name: 'Critical CSS', pattern: 'rel="stylesheet"' }
    ];
    
    performanceChecks.forEach(check => {
        if (htmlContent.includes(check.pattern)) {
            logResult(`Performance: ${check.name}`, 'PASS', `${check.name} optimization found`);
        } else {
            logResult(`Performance: ${check.name}`, 'WARN', `${check.name} optimization not found`);
        }
    });
    
    // Image optimization check
    const imgTags = htmlContent.match(/<img[^>]*>/g) || [];
    let imagesWithAlt = 0;
    let imagesWithSrcset = 0;
    
    imgTags.forEach(img => {
        if (img.includes('alt=')) imagesWithAlt++;
        if (img.includes('srcset=')) imagesWithSrcset++;
    });
    
    logResult('Image Alt Tags', imagesWithAlt > 0 ? 'PASS' : 'FAIL', 
             `${imagesWithAlt}/${imgTags.length} images have alt tags`);
    
    if (imagesWithSrcset > 0) {
        logResult('Responsive Images', 'PASS', `${imagesWithSrcset} images use srcset`);
    } else {
        logResult('Responsive Images', 'WARN', 'No responsive images found');
    }
}

// Main validation function
async function runValidation() {
    console.log(`${colors.bold}${colors.blue}🚀 Neff Paving Deployment Validation${colors.reset}\n`);
    console.log(`${colors.blue}Starting validation at: ${new Date().toISOString()}${colors.reset}\n`);
    
    // Run all validation tests
    validateCriticalFiles();
    validateBuildOutput();
    validateServicesSection();
    validateAdminPanel();
    validateConfiguration();
    validateSEOAndMeta();
    validatePerformance();
    
    // Generate final report
    console.log(`\n${colors.bold}=== Final Validation Report ===${colors.reset}`);
    console.log(`${colors.green}✅ Passed: ${results.passed}${colors.reset}`);
    console.log(`${colors.red}❌ Failed: ${results.failed}${colors.reset}`);
    console.log(`${colors.yellow}⚠️  Warnings: ${results.warnings}${colors.reset}`);
    
    const totalTests = results.passed + results.failed + results.warnings;
    const successRate = totalTests > 0 ? Math.round((results.passed / totalTests) * 100) : 0;
    
    console.log(`\n${colors.bold}Success Rate: ${successRate}%${colors.reset}`);
    
    // Determine deployment readiness
    if (results.failed === 0 && successRate >= 80) {
        console.log(`\n${colors.green}${colors.bold}🎉 DEPLOYMENT READY${colors.reset}`);
        console.log(`${colors.green}All critical tests passed. Deployment is recommended.${colors.reset}`);
    } else if (results.failed <= 2 && successRate >= 70) {
        console.log(`\n${colors.yellow}${colors.bold}⚠️  DEPLOYMENT WITH CAUTION${colors.reset}`);
        console.log(`${colors.yellow}Some issues detected. Review failures before deploying.${colors.reset}`);
    } else {
        console.log(`\n${colors.red}${colors.bold}🚫 DEPLOYMENT NOT RECOMMENDED${colors.reset}`);
        console.log(`${colors.red}Critical issues detected. Fix errors before deploying.${colors.reset}`);
    }
    
    // Save detailed report
    const reportPath = path.join(projectRoot, 'deployment-validation-report.json');
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            passed: results.passed,
            failed: results.failed,
            warnings: results.warnings,
            successRate,
            deploymentReady: results.failed === 0 && successRate >= 80
        },
        tests: results.tests
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n${colors.blue}📄 Detailed report saved to: ${reportPath}${colors.reset}`);
    
    // Exit with appropriate code
    process.exit(results.failed > 5 ? 1 : 0);
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runValidation().catch(console.error);
}

export { runValidation };
