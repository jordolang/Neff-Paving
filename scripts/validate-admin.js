import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Admin Panel Deployment Validator');
console.log('=====================================');

// Validation functions
function validateFileStructure() {
  console.log('\n📁 Validating file structure...');
  
  const requiredFiles = [
    { path: '../dist/admin/index.html', description: 'Admin Panel HTML' },
    { path: '../dist/admin/admin.js', description: 'Admin Panel JavaScript' },
    { path: '../backend/server.js', description: 'Backend Server' },
    { path: '../dist/index.html', description: 'Main Application HTML' }
  ];
  
  let allExists = true;
  
  requiredFiles.forEach(({ path: filePath, description }) => {
    const fullPath = path.resolve(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      console.log(`✅ ${description}: ${(stats.size / 1024).toFixed(2)} KB`);
    } else {
      console.log(`❌ ${description}: Missing`);
      allExists = false;
    }
  });
  
  return allExists;
}

function validateAdminPanelContent() {
  console.log('\n🔍 Validating admin panel content...');
  
  const adminIndexPath = path.resolve(__dirname, '../dist/admin/index.html');
  
  if (!fs.existsSync(adminIndexPath)) {
    console.log('❌ Admin index.html not found');
    return false;
  }
  
  const content = fs.readFileSync(adminIndexPath, 'utf8');
  
  const checks = [
    { test: content.includes('admin.js'), description: 'Admin JavaScript reference' },
    { test: content.includes('Admin Dashboard'), description: 'Admin Dashboard title' },
    { test: content.includes('login-screen'), description: 'Login functionality' },
    { test: content.includes('admin-dashboard'), description: 'Dashboard interface' }
  ];
  
  let allValid = true;
  
  checks.forEach(({ test, description }) => {
    if (test) {
      console.log(`✅ ${description}: Present`);
    } else {
      console.log(`❌ ${description}: Missing`);
      allValid = false;
    }
  });
  
  return allValid;
}

function validateServerConfiguration() {
  console.log('\n⚙️ Validating server configuration...');
  
  const serverPath = path.resolve(__dirname, '../backend/server.js');
  
  if (!fs.existsSync(serverPath)) {
    console.log('❌ Server.js not found');
    return false;
  }
  
  const content = fs.readFileSync(serverPath, 'utf8');
  
  const checks = [
    { test: content.includes('/admin'), description: 'Admin route configuration' },
    { test: content.includes('static'), description: 'Static file serving' },
    { test: content.includes('SPA fallback'), description: 'SPA fallback routing' },
    { test: content.includes('express.static'), description: 'Express static middleware' }
  ];
  
  let allValid = true;
  
  checks.forEach(({ test, description }) => {
    if (test) {
      console.log(`✅ ${description}: Configured`);
    } else {
      console.log(`❌ ${description}: Missing or misconfigured`);
      allValid = false;
    }
  });
  
  return allValid;
}

function validateSPARouting() {
  console.log('\n🔄 Validating SPA routing configuration...');
  
  const serverPath = path.resolve(__dirname, '../backend/server.js');
  const content = fs.readFileSync(serverPath, 'utf8');
  
  const routingChecks = [
    { 
      test: content.includes("app.get('/admin*'"), 
      description: 'Admin SPA catch-all route' 
    },
    { 
      test: content.includes("app.get('*'"), 
      description: 'Main application SPA catch-all route' 
    },
    { 
      test: content.includes('sendFile') && content.includes('index.html'), 
      description: 'HTML file serving for SPA routes' 
    },
    { 
      test: content.includes('Cache-Control'), 
      description: 'Proper caching headers' 
    }
  ];
  
  let allValid = true;
  
  routingChecks.forEach(({ test, description }) => {
    if (test) {
      console.log(`✅ ${description}: Configured`);
    } else {
      console.log(`❌ ${description}: Missing`);
      allValid = false;
    }
  });
  
  return allValid;
}

function validateSecurityHeaders() {
  console.log('\n🔒 Validating security configuration...');
  
  const serverPath = path.resolve(__dirname, '../backend/server.js');
  const content = fs.readFileSync(serverPath, 'utf8');
  
  const securityChecks = [
    { 
      test: content.includes('X-Frame-Options'), 
      description: 'X-Frame-Options header' 
    },
    { 
      test: content.includes('X-Content-Type-Options'), 
      description: 'X-Content-Type-Options header' 
    },
    { 
      test: content.includes('cors'), 
      description: 'CORS configuration' 
    }
  ];
  
  let allValid = true;
  
  securityChecks.forEach(({ test, description }) => {
    if (test) {
      console.log(`✅ ${description}: Configured`);
    } else {
      console.log(`⚠️ ${description}: Not configured`);
      // Don't fail validation for security headers, just warn
    }
  });
  
  return allValid;
}

function runFullValidation() {
  console.log('🚀 Running complete admin panel validation...\n');
  
  const results = {
    fileStructure: validateFileStructure(),
    adminContent: validateAdminPanelContent(),
    serverConfig: validateServerConfiguration(),
    spaRouting: validateSPARouting(),
    security: validateSecurityHeaders()
  };
  
  console.log('\n📊 Validation Summary:');
  console.log('======================');
  
  Object.entries(results).forEach(([check, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const checkName = check.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    console.log(`${status} ${checkName}`);
  });
  
  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('\n🎉 All validations passed! Admin panel is ready for deployment.');
    console.log('\n📝 Next steps:');
    console.log('   • Start the server: npm run dev (or production server)');
    console.log('   • Access admin panel: http://localhost:3000/admin');
    console.log('   • Test SPA routing by navigating to different admin sections');
  } else {
    console.log('\n💥 Some validations failed. Please fix the issues above.');
    process.exit(1);
  }
  
  return allPassed;
}

// Command line interface
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'files':
    validateFileStructure();
    break;
  case 'content':
    validateAdminPanelContent();
    break;
  case 'server':
    validateServerConfiguration();
    break;
  case 'routing':
    validateSPARouting();
    break;
  case 'security':
    validateSecurityHeaders();
    break;
  default:
    runFullValidation();
}
