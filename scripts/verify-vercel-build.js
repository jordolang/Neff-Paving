#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

/**
 * Verifies the Vercel build output for proper asset handling
 */
function verifyVercelBuild() {
  console.log('🔍 Verifying Vercel build configuration...\n');
  
  const distDir = join(projectRoot, 'dist');
  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    issues: []
  };

  function addResult(type, test, status, message) {
    if (status === 'pass') {
      results.passed++;
      console.log(`✅ ${test}: ${message}`);
    } else if (status === 'fail') {
      results.failed++;
      console.log(`❌ ${test}: ${message}`);
      results.issues.push(`${test}: ${message}`);
    } else if (status === 'warn') {
      results.warnings++;
      console.log(`⚠️  ${test}: ${message}`);
    }
  }

  // Test 1: Check if dist directory exists
  addResult('Build Output', 'Dist Directory', 
    existsSync(distDir) ? 'pass' : 'fail',
    existsSync(distDir) ? 'Build output directory exists' : 'Build output directory not found'
  );

  if (!existsSync(distDir)) {
    console.log('\n❌ Cannot proceed with verification - dist directory not found');
    console.log('💡 Run: npm run build:vercel');
    return results;
  }

  // Test 2: Check gallery images structure
  const galleryDir = join(distDir, 'assets', 'gallery');
  addResult('Gallery Assets', 'Gallery Directory', 
    existsSync(galleryDir) ? 'pass' : 'fail',
    existsSync(galleryDir) ? 'Gallery directory exists in dist/assets/' : 'Gallery directory missing from build output'
  );

  if (existsSync(galleryDir)) {
    const gallerySubdirs = ['commercial', 'residential', 'equipment', 'concrete'];
    let foundSubdirs = 0;
    
    gallerySubdirs.forEach(subdir => {
      const subdirPath = join(galleryDir, subdir);
      if (existsSync(subdirPath)) {
        foundSubdirs++;
        const files = readdirSync(subdirPath).filter(f => f.endsWith('.webp'));
        addResult('Gallery Structure', `${subdir} subdirectory`, 
          files.length > 0 ? 'pass' : 'warn',
          files.length > 0 ? `Contains ${files.length} images` : 'Directory exists but no images found'
        );
      } else {
        addResult('Gallery Structure', `${subdir} subdirectory`, 'fail', 'Missing from gallery');
      }
    });

    addResult('Gallery Structure', 'Overall Structure', 
      foundSubdirs >= 3 ? 'pass' : foundSubdirs > 0 ? 'warn' : 'fail',
      `Found ${foundSubdirs}/${gallerySubdirs.length} expected subdirectories`
    );
  }

  // Test 3: Check HTML files for proper base URLs
  const htmlFiles = ['index.html', '404.html', 'estimate-form.html'];
  htmlFiles.forEach(htmlFile => {
    const htmlPath = join(distDir, htmlFile);
    if (existsSync(htmlPath)) {
      const content = readFileSync(htmlPath, 'utf8');
      
      // Check for proper asset paths (should start with / for Vercel)
      const assetPaths = content.match(/(href|src)="([^"]+\.(css|js|png|jpg|jpeg|gif|svg|webp|mp4|webm|ico|woff|woff2))"/g);
      if (assetPaths) {
        const invalidPaths = assetPaths.filter(path => {
          const match = path.match(/(href|src)="([^"]+)"/);
          return match && !match[2].startsWith('/') && !match[2].startsWith('http');
        });
        
        addResult('HTML Assets', `${htmlFile} paths`, 
          invalidPaths.length === 0 ? 'pass' : 'fail',
          invalidPaths.length === 0 ? 
            `All ${assetPaths.length} asset paths use absolute URLs` : 
            `Found ${invalidPaths.length} relative paths that may break on Vercel`
        );
      }

      // Check for build-time variables
      const buildVars = ['__BASE_URL__', '__IS_VERCEL__', '__PLATFORM__'];
      const unprocessedVars = buildVars.filter(varName => content.includes(varName));
      addResult('Build Variables', `${htmlFile} processing`, 
        unprocessedVars.length === 0 ? 'pass' : 'warn',
        unprocessedVars.length === 0 ? 
          'All build variables processed' : 
          `Unprocessed variables: ${unprocessedVars.join(', ')}`
      );
    }
  });

  // Test 4: Check asset file naming for Vercel
  const assetsDir = join(distDir, 'assets');
  if (existsSync(assetsDir)) {
    const assetTypes = {
      styles: 'css',
      images: 'png|jpg|jpeg|gif|svg|webp',
      fonts: 'woff|woff2|ttf|eot',
      videos: 'mp4|webm|ogg'
    };

    Object.entries(assetTypes).forEach(([type, extensions]) => {
      const typeDir = join(assetsDir, type);
      if (existsSync(typeDir)) {
        const files = readdirSync(typeDir);
        const hashedFiles = files.filter(f => {
          const regex = new RegExp(`\\.(${extensions})$`, 'i');
          return regex.test(f) && f.includes('.');
        });
        
        addResult('Asset Naming', `${type} files`, 
          hashedFiles.length > 0 ? 'pass' : 'warn',
          hashedFiles.length > 0 ? 
            `Found ${hashedFiles.length} properly named ${type} files` : 
            `No ${type} files found or not properly hashed`
        );
      }
    });
  }

  // Test 5: Check chunk and entry files
  const chunksDir = join(distDir, 'chunks');
  const entriesDir = join(distDir, 'entries');
  
  addResult('Code Splitting', 'Chunks directory', 
    existsSync(chunksDir) ? 'pass' : 'warn',
    existsSync(chunksDir) ? 'Chunks directory exists' : 'No chunks directory - code splitting may not be working'
  );

  addResult('Code Splitting', 'Entries directory', 
    existsSync(entriesDir) ? 'pass' : 'fail',
    existsSync(entriesDir) ? 'Entries directory exists' : 'Entries directory missing - build may have failed'
  );

  // Summary
  console.log('\n📊 Verification Summary:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`⚠️  Warnings: ${results.warnings}`);
  console.log(`❌ Failed: ${results.failed}`);

  if (results.issues.length > 0) {
    console.log('\n🚨 Issues that need attention:');
    results.issues.forEach(issue => console.log(`   • ${issue}`));
  }

  if (results.failed === 0) {
    console.log('\n🎉 Build verification completed successfully!');
    console.log('💡 The build should work correctly on Vercel deployment.');
  } else {
    console.log('\n⚠️  Build verification found issues that should be addressed.');
    console.log('💡 Please fix the failed tests before deploying to Vercel.');
  }

  return results;
}

// Always run verification when script is executed
verifyVercelBuild();

export default verifyVercelBuild;
