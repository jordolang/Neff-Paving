import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distPath = path.resolve(__dirname, '../dist');

console.log('🔍 Verifying build output...');

try {
  // Check if dist directory exists
  if (!fs.existsSync(distPath)) {
    console.error('❌ Build failed: dist directory not found');
    process.exit(1);
  }

  // Check for essential files
  const requiredFiles = [
    'index.html',
    'admin/index.html'
  ];
  
  // Optional files that should be checked but not fail the build
  const optionalFiles = [
    'services/index.html'
  ];

  const missingFiles = [];
  const foundFiles = [];

  for (const file of requiredFiles) {
    const filePath = path.join(distPath, file);
    if (fs.existsSync(filePath)) {
      foundFiles.push(file);
      console.log(`✅ Found: ${file}`);
    } else {
      missingFiles.push(file);
      console.log(`❌ Missing: ${file}`);
    }
  }
  
  // Check optional files
  for (const file of optionalFiles) {
    const filePath = path.join(distPath, file);
    if (fs.existsSync(filePath)) {
      foundFiles.push(file);
      console.log(`✅ Found: ${file}`);
    } else {
      console.log(`⚠️  Optional file missing: ${file}`);
    }
  }

  // Check for services directory/file if it should exist
  const servicesPath = path.join(distPath, 'services');
  const servicesIndexPath = path.join(distPath, 'services', 'index.html');
  
  if (fs.existsSync(servicesPath)) {
    console.log('✅ Found: services directory');
    if (fs.existsSync(servicesIndexPath)) {
      console.log('✅ Found: services/index.html');
    } else {
      console.log('⚠️  Warning: services directory exists but services/index.html is missing');
    }
  } else {
    console.log('ℹ️  Info: services directory not found (rewrite will handle this)');
  }

  // Check for assets directory
  const assetsPath = path.join(distPath, 'assets');
  if (fs.existsSync(assetsPath)) {
    console.log('✅ Found: assets directory');
    
    // Count asset files
    const assetFiles = fs.readdirSync(assetsPath);
    console.log(`ℹ️  Found ${assetFiles.length} asset files`);
  } else {
    console.log('❌ Missing: assets directory');
    missingFiles.push('assets directory');
  }

  // Final verification
  if (missingFiles.length > 0) {
    console.error(`❌ Build verification failed! Missing: ${missingFiles.join(', ')}`);
    process.exit(1);
  } else {
    console.log('✅ Build verification successful!');
    console.log(`📁 Output directory: ${distPath}`);
    console.log(`📋 Files verified: ${foundFiles.length} required files found`);
    
    // Get directory size info
    const stats = fs.statSync(distPath);
    console.log(`📊 Build completed at: ${stats.mtime.toISOString()}`);
  }

} catch (error) {
  console.error('❌ Build verification failed with error:', error.message);
  process.exit(1);
}
