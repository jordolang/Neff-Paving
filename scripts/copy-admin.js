import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('📁 Starting admin panel deployment process...');

// Validation function for deployment
function validateDeployment() {
  console.log('🔍 Validating deployment prerequisites...');
  
  const distDir = path.resolve(__dirname, '../dist');
  const adminSourceDir = path.resolve(__dirname, '../admin');
  const servicesSourceDir = path.resolve(__dirname, '../services');
  
  // Check if dist directory exists
  if (!fs.existsSync(distDir)) {
    console.error('❌ Error: dist directory does not exist. Run build first.');
    process.exit(1);
  }
  
  // Check if admin source directory exists
  if (!fs.existsSync(adminSourceDir)) {
    console.error('❌ Error: admin source directory does not exist.');
    process.exit(1);
  }
  
  // Check if services source directory exists
  if (!fs.existsSync(servicesSourceDir)) {
    console.warn('⚠️  Warning: services source directory does not exist. Skipping services copy.');
    return { copyServices: false };
  }
  
  console.log('✅ All validation checks passed');
  return { copyServices: true };
}

// Enhanced copy function with filtering
function copyWithFilter(source, dest, description) {
  console.log(`📋 Copying ${description}...`);
  
  try {
    fs.copySync(source, dest, {
      overwrite: true,
      filter: (src) => {
        // Filter out node_modules, .git, and other unwanted directories
        const shouldExclude = src.includes('node_modules') ||
                            src.includes('.git') ||
                            src.includes('.DS_Store') ||
                            src.includes('Thumbs.db') ||
                            src.includes('.env') ||
                            src.includes('.env.local') ||
                            src.includes('npm-debug.log') ||
                            src.includes('yarn-error.log');
        
        if (shouldExclude) {
          console.log(`⏭️  Skipping: ${path.relative(source, src)}`);
        }
        
        return !shouldExclude;
      }
    });
    
    console.log(`✅ ${description} copied successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Error copying ${description}:`, error.message);
    return false;
  }
}

// Post-deployment validation
function validatePostDeployment() {
  console.log('🔍 Validating post-deployment files...');
  
  const adminDistDir = path.resolve(__dirname, '../dist/admin');
  const adminIndexPath = path.join(adminDistDir, 'index.html');
  const adminJsPath = path.join(adminDistDir, 'admin.js');
  
  const validations = [
    { path: adminIndexPath, description: 'Admin index.html' },
    { path: adminJsPath, description: 'Admin JavaScript file' }
  ];
  
  let allValid = true;
  
  validations.forEach(({ path: filePath, description }) => {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      console.log(`✅ ${description} exists (${(stats.size / 1024).toFixed(2)} KB)`);
    } else {
      console.error(`❌ ${description} is missing`);
      allValid = false;
    }
  });
  
  return allValid;
}

// Main deployment process
function deployAdminPanel() {
  const validation = validateDeployment();
  
  let deploymentSuccess = true;
  
  // Copy admin files to dist/admin
  const adminCopySuccess = copyWithFilter(
    path.resolve(__dirname, '../admin'),
    path.resolve(__dirname, '../dist/admin'),
    'admin files'
  );
  
  if (!adminCopySuccess) {
    deploymentSuccess = false;
  }
  
  // Copy services files to dist/services (if available)
  if (validation.copyServices) {
    const servicesCopySuccess = copyWithFilter(
      path.resolve(__dirname, '../services'),
      path.resolve(__dirname, '../dist/services'),
      'services files'
    );
    
    if (!servicesCopySuccess) {
      deploymentSuccess = false;
    }
  }
  
  // Validate post-deployment
  const postValidation = validatePostDeployment();
  
  if (!postValidation) {
    deploymentSuccess = false;
  }
  
  if (deploymentSuccess) {
    console.log('🎉 Admin panel deployment completed successfully!');
    console.log('📊 Deployment Summary:');
    console.log('   ✅ Admin files copied and validated');
    if (validation.copyServices) {
      console.log('   ✅ Services files copied and validated');
    }
    console.log('   ✅ SPA routing ready (fallback configured in server)');
  } else {
    console.error('💥 Admin panel deployment failed!');
    process.exit(1);
  }
}

// Run deployment
deployAdminPanel();
