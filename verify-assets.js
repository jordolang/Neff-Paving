#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

console.log('🔍 Verifying asset paths in build output...\n');

const distDir = 'dist';
const issues = [];
let checks = 0;

// Read HTML files and extract asset references
const htmlFiles = ['index.html', '404.html', 'estimate-form.html'];

htmlFiles.forEach(file => {
  const filePath = join(distDir, file);
  if (!existsSync(filePath)) {
    issues.push(`❌ HTML file not found: ${file}`);
    return;
  }

  const content = readFileSync(filePath, 'utf8');
  console.log(`📄 Checking ${file}...`);

  // Extract all asset references
  const assetRegex = /(href|src)="([^"]+(?:\.css|\.js|\.png|\.jpg|\.jpeg|\.gif|\.svg|\.webp|\.mp4|\.webm|\.ico|\.woff|\.woff2)[^"]*)"/g;
  const matches = [...content.matchAll(assetRegex)];

  matches.forEach(match => {
    const [, attr, assetPath] = match;
    checks++;

    // Skip external URLs and data URLs
    if (assetPath.startsWith('http') || assetPath.startsWith('data:') || assetPath.startsWith('//')) {
      return;
    }

    // Remove query parameters and base URL
    let cleanPath = assetPath.split('?')[0];
    if (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.substring(1);
    }

    // Skip Vercel specific assets
    if (cleanPath.startsWith('_vercel/')) {
      return;
    }

    const fullPath = join(distDir, cleanPath);
    if (!existsSync(fullPath)) {
      issues.push(`❌ Missing asset in ${file}: ${assetPath} -> ${cleanPath}`);
    } else {
      console.log(`  ✅ ${cleanPath}`);
    }
  });
});

// Summary
console.log(`\n📊 Verification Summary:`);
console.log(`   - Files checked: ${htmlFiles.length}`);
console.log(`   - Asset references verified: ${checks}`);
console.log(`   - Issues found: ${issues.length}`);

if (issues.length > 0) {
  console.log(`\n❌ Issues found:`);
  issues.forEach(issue => console.log(issue));
  process.exit(1);
} else {
  console.log(`\n✅ All asset paths verified successfully!`);
  console.log(`🚀 Build is ready for deployment.`);
}
