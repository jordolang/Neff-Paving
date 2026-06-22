#!/usr/bin/env node

/**
 * SEO Meta Tag Verification Script
 * Extracts and verifies unique meta tags across all HTML pages
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const PAGES = [
  { path: './index.html', name: 'Homepage' },
  { path: './services/residential-asphalt.html', name: 'Residential Asphalt' },
  { path: './services/commercial-asphalt.html', name: 'Commercial Asphalt' },
  { path: './services/concrete-solutions.html', name: 'Concrete Solutions' },
  { path: './services/maintenance.html', name: 'Maintenance' },
  { path: './areas/columbus-paving.html', name: 'Columbus Paving' },
  { path: './areas/zanesville-paving.html', name: 'Zanesville Paving' },
  { path: './areas/newark-paving.html', name: 'Newark Paving' },
  { path: './areas/lancaster-paving.html', name: 'Lancaster Paving' },
];

/**
 * Extract meta tag content from HTML
 */
function extractMetaTags(html) {
  const meta = {};

  // Title tag
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  meta.title = titleMatch ? titleMatch[1].trim() : null;

  // Meta description
  const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
  meta.description = descMatch ? descMatch[1].trim() : null;

  // Open Graph title
  const ogTitleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
  meta.ogTitle = ogTitleMatch ? ogTitleMatch[1].trim() : null;

  // Open Graph description
  const ogDescMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i);
  meta.ogDescription = ogDescMatch ? ogDescMatch[1].trim() : null;

  // Open Graph URL
  const ogUrlMatch = html.match(/<meta\s+property="og:url"\s+content="([^"]+)"/i);
  meta.ogUrl = ogUrlMatch ? ogUrlMatch[1].trim() : null;

  // Canonical URL
  const canonicalMatch = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i);
  meta.canonical = canonicalMatch ? canonicalMatch[1].trim() : null;

  // Keywords (for keyword optimization check)
  const keywordsMatch = html.match(/<meta\s+name="keywords"\s+content="([^"]+)"/i);
  meta.keywords = keywordsMatch ? keywordsMatch[1].trim() : null;

  return meta;
}

/**
 * Check if meta tags contain expected keywords for service/area pages
 */
function checkKeywordOptimization(page, meta) {
  const warnings = [];

  // Service page keyword checks
  if (page.path.includes('residential-asphalt')) {
    if (!meta.description?.toLowerCase().includes('residential')) {
      warnings.push('Missing "residential" keyword in description');
    }
    if (!meta.description?.toLowerCase().includes('asphalt')) {
      warnings.push('Missing "asphalt" keyword in description');
    }
  }

  if (page.path.includes('commercial-asphalt')) {
    if (!meta.description?.toLowerCase().includes('commercial')) {
      warnings.push('Missing "commercial" keyword in description');
    }
  }

  if (page.path.includes('concrete-solutions')) {
    if (!meta.description?.toLowerCase().includes('concrete')) {
      warnings.push('Missing "concrete" keyword in description');
    }
  }

  if (page.path.includes('maintenance')) {
    if (!meta.description?.toLowerCase().includes('seal coating') && !meta.description?.toLowerCase().includes('maintenance')) {
      warnings.push('Missing maintenance-related keywords');
    }
  }

  // Area page keyword checks
  if (page.path.includes('columbus-paving')) {
    if (!meta.title?.toLowerCase().includes('columbus')) {
      warnings.push('Missing "Columbus" in title');
    }
    if (!meta.description?.toLowerCase().includes('columbus')) {
      warnings.push('Missing "Columbus" in description');
    }
  }

  if (page.path.includes('zanesville-paving')) {
    if (!meta.title?.toLowerCase().includes('zanesville')) {
      warnings.push('Missing "Zanesville" in title');
    }
  }

  if (page.path.includes('newark-paving')) {
    if (!meta.title?.toLowerCase().includes('newark')) {
      warnings.push('Missing "Newark" in title');
    }
  }

  if (page.path.includes('lancaster-paving')) {
    if (!meta.title?.toLowerCase().includes('lancaster')) {
      warnings.push('Missing "Lancaster" in title');
    }
  }

  return warnings;
}

/**
 * Main verification function
 */
function verifyMetaTags() {
  console.log('🔍 SEO Meta Tag Verification\n');
  console.log('=' .repeat(80));

  const results = [];
  const titles = new Map();
  const descriptions = new Map();
  const ogTitles = new Map();

  let hasErrors = false;

  // Extract meta tags from all pages
  for (const page of PAGES) {
    if (!existsSync(page.path)) {
      console.log(`❌ ${page.name}: File not found - ${page.path}`);
      hasErrors = true;
      continue;
    }

    const html = readFileSync(page.path, 'utf-8');
    const meta = extractMetaTags(html);

    results.push({ page, meta });

    // Track duplicates
    if (meta.title) {
      if (!titles.has(meta.title)) titles.set(meta.title, []);
      titles.get(meta.title).push(page.name);
    }

    if (meta.description) {
      if (!descriptions.has(meta.description)) descriptions.set(meta.description, []);
      descriptions.get(meta.description).push(page.name);
    }

    if (meta.ogTitle) {
      if (!ogTitles.has(meta.ogTitle)) ogTitles.set(meta.ogTitle, []);
      ogTitles.get(meta.ogTitle).push(page.name);
    }
  }

  // Report findings for each page
  console.log('\n📄 Page-by-Page Analysis:\n');

  for (const { page, meta } of results) {
    console.log(`\n${page.name} (${page.path})`);
    console.log('-'.repeat(80));

    const errors = [];
    const warnings = [];

    // Check required tags
    if (!meta.title) errors.push('Missing <title> tag');
    if (!meta.description) errors.push('Missing meta description');
    if (!meta.ogTitle) warnings.push('Missing og:title');
    if (!meta.ogDescription) warnings.push('Missing og:description');
    if (!meta.canonical) warnings.push('Missing canonical URL');

    // Check keyword optimization
    const keywordWarnings = checkKeywordOptimization(page, meta);
    warnings.push(...keywordWarnings);

    // Display meta tag values
    console.log(`  Title: ${meta.title || '(missing)'}`);
    console.log(`  Description: ${meta.description ? meta.description.substring(0, 100) + '...' : '(missing)'}`);
    console.log(`  OG Title: ${meta.ogTitle || '(missing)'}`);
    console.log(`  OG Description: ${meta.ogDescription ? meta.ogDescription.substring(0, 80) + '...' : '(missing)'}`);
    console.log(`  Canonical: ${meta.canonical || '(missing)'}`);

    if (errors.length > 0) {
      hasErrors = true;
      console.log(`\n  ❌ ERRORS:`);
      errors.forEach(err => console.log(`     - ${err}`));
    }

    if (warnings.length > 0) {
      console.log(`\n  ⚠️  WARNINGS:`);
      warnings.forEach(warn => console.log(`     - ${warn}`));
    }

    if (errors.length === 0 && warnings.length === 0) {
      console.log(`\n  ✅ All checks passed`);
    }
  }

  // Check for duplicates
  console.log('\n\n🔍 Uniqueness Check:\n');
  console.log('=' .repeat(80));

  let hasDuplicates = false;

  // Title duplicates
  const duplicateTitles = Array.from(titles.entries()).filter(([_, pages]) => pages.length > 1);
  if (duplicateTitles.length > 0) {
    hasDuplicates = true;
    hasErrors = true;
    console.log('\n❌ DUPLICATE TITLES FOUND:');
    duplicateTitles.forEach(([title, pages]) => {
      console.log(`\n  "${title}"`);
      console.log(`  Used on: ${pages.join(', ')}`);
    });
  } else {
    console.log('\n✅ All page titles are unique');
  }

  // Description duplicates
  const duplicateDescriptions = Array.from(descriptions.entries()).filter(([_, pages]) => pages.length > 1);
  if (duplicateDescriptions.length > 0) {
    hasDuplicates = true;
    hasErrors = true;
    console.log('\n❌ DUPLICATE META DESCRIPTIONS FOUND:');
    duplicateDescriptions.forEach(([desc, pages]) => {
      console.log(`\n  "${desc.substring(0, 100)}..."`);
      console.log(`  Used on: ${pages.join(', ')}`);
    });
  } else {
    console.log('✅ All meta descriptions are unique');
  }

  // OG Title duplicates
  const duplicateOgTitles = Array.from(ogTitles.entries()).filter(([_, pages]) => pages.length > 1);
  if (duplicateOgTitles.length > 0) {
    hasDuplicates = true;
    console.log('\n⚠️  DUPLICATE OG:TITLE TAGS:');
    duplicateOgTitles.forEach(([title, pages]) => {
      console.log(`\n  "${title}"`);
      console.log(`  Used on: ${pages.join(', ')}`);
    });
  } else {
    console.log('✅ All Open Graph titles are unique');
  }

  // Final summary
  console.log('\n\n📊 Summary:\n');
  console.log('=' .repeat(80));
  console.log(`Total pages checked: ${PAGES.length}`);
  console.log(`Unique titles: ${titles.size}/${PAGES.length}`);
  console.log(`Unique descriptions: ${descriptions.size}/${PAGES.length}`);
  console.log(`Unique OG titles: ${ogTitles.size}/${PAGES.length}`);

  if (!hasErrors && !hasDuplicates) {
    console.log('\n✅ ALL CHECKS PASSED - Meta tags are unique and properly optimized!\n');
    return 0;
  } else {
    console.log('\n❌ VERIFICATION FAILED - Please fix the issues above\n');
    return 1;
  }
}

// Run verification
const exitCode = verifyMetaTags();
process.exit(exitCode);
