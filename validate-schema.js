#!/usr/bin/env node
/**
 * Structured Data Validation Script
 * Validates JSON-LD structured data from all HTML pages
 */

import fs from 'fs';
import path from 'path';

// Pages to validate
const pages = [
  { path: './index.html', name: 'Homepage' },
  { path: './services/residential-asphalt.html', name: 'Residential Asphalt Service Page' },
  { path: './services/commercial-asphalt.html', name: 'Commercial Asphalt Service Page' },
  { path: './services/concrete-solutions.html', name: 'Concrete Solutions Service Page' },
  { path: './services/maintenance.html', name: 'Maintenance Service Page' },
  { path: './areas/columbus-paving.html', name: 'Columbus Area Page' },
  { path: './areas/zanesville-paving.html', name: 'Zanesville Area Page' },
  { path: './areas/newark-paving.html', name: 'Newark Area Page' },
  { path: './areas/lancaster-paving.html', name: 'Lancaster Area Page' },
];

console.log('='.repeat(80));
console.log('STRUCTURED DATA VALIDATION REPORT');
console.log('Google Rich Results Test - Pre-Validation');
console.log('Generated:', new Date().toISOString());
console.log('='.repeat(80));
console.log('');

let totalPages = 0;
let totalValid = 0;
let totalInvalid = 0;
const issues = [];

pages.forEach(page => {
  totalPages++;
  console.log(`\n${'='.repeat(80)}`);
  console.log(`PAGE: ${page.name}`);
  console.log(`FILE: ${page.path}`);
  console.log('-'.repeat(80));

  if (!fs.existsSync(page.path)) {
    console.log('❌ ERROR: File not found');
    totalInvalid++;
    issues.push({ page: page.name, issue: 'File not found' });
    return;
  }

  const html = fs.readFileSync(page.path, 'utf8');
  const schemaMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);

  if (!schemaMatches || schemaMatches.length === 0) {
    console.log('❌ ERROR: No structured data found');
    totalInvalid++;
    issues.push({ page: page.name, issue: 'No structured data found' });
    return;
  }

  console.log(`✓ Found ${schemaMatches.length} structured data block(s)`);

  let pageValid = true;

  schemaMatches.forEach((schemaBlock, index) => {
    const jsonString = schemaBlock.replace(/<script type="application\/ld\+json">/, '').replace(/<\/script>/, '');

    try {
      const schema = JSON.parse(jsonString);
      console.log(`\n  Block ${index + 1}:`);
      console.log(`  ✓ Valid JSON syntax`);

      // Check for @context
      if (!schema['@context']) {
        console.log(`  ⚠️  WARNING: Missing @context`);
        issues.push({ page: page.name, issue: 'Missing @context' });
      } else {
        console.log(`  ✓ @context: ${schema['@context']}`);
      }

      // Check schema types
      if (schema['@graph']) {
        const types = schema['@graph'].map(item => item['@type']).filter(Boolean);
        console.log(`  ✓ @graph with ${schema['@graph'].length} items`);
        console.log(`  ✓ Schema types: ${types.join(', ')}`);

        // Validate required types
        const hasOrganization = types.includes('Organization');
        const hasLocalBusiness = types.includes('LocalBusiness');
        const hasService = types.some(t => t === 'Service' || schema['@graph'].some(item => item['@type'] === 'Service'));
        const hasReview = types.includes('Review');

        console.log(`\n  Schema Components:`);
        console.log(`    Organization: ${hasOrganization ? '✓' : '❌'}`);
        console.log(`    LocalBusiness: ${hasLocalBusiness ? '✓' : '❌'}`);
        console.log(`    Service: ${hasService ? '✓' : '❌'}`);
        console.log(`    Review: ${hasReview ? '✓' : '⚠️  (optional)'}`);

        // Check each schema item
        schema['@graph'].forEach(item => {
          if (item['@type'] === 'LocalBusiness') {
            console.log(`\n  LocalBusiness Schema:`);
            console.log(`    Name: ${item.name ? '✓' : '❌'} ${item.name || ''}`);
            console.log(`    Address: ${item.address ? '✓' : '❌'}`);
            console.log(`    Telephone: ${item.telephone ? '✓' : '❌'} ${item.telephone || ''}`);
            console.log(`    URL: ${item.url ? '✓' : '❌'}`);

            if (item.aggregateRating) {
              console.log(`    AggregateRating: ✓`);
              console.log(`      Rating: ${item.aggregateRating.ratingValue || 'N/A'}`);
              console.log(`      Reviews: ${item.aggregateRating.reviewCount || 'N/A'}`);
            }
          }

          if (item['@type'] === 'Service') {
            console.log(`\n  Service Schema:`);
            console.log(`    Name: ${item.name || 'N/A'}`);
            console.log(`    Description: ${item.description ? '✓' : '❌'}`);
            console.log(`    Provider: ${item.provider ? '✓' : '❌'}`);
            console.log(`    AreaServed: ${item.areaServed ? '✓' : '❌'}`);
          }

          if (item['@type'] === 'Review') {
            console.log(`\n  Review Schema:`);
            console.log(`    Author: ${item.author ? '✓' : '❌'}`);
            console.log(`    Rating: ${item.reviewRating ? '✓' : '❌'}`);
            console.log(`    Date: ${item.datePublished ? '✓' : '❌'}`);
          }
        });

      } else if (schema['@type']) {
        console.log(`  ✓ Schema type: ${schema['@type']}`);
      }

    } catch (e) {
      console.log(`  ❌ JSON Parse Error: ${e.message}`);
      pageValid = false;
      issues.push({ page: page.name, issue: `JSON Parse Error: ${e.message}` });
    }
  });

  if (pageValid) {
    totalValid++;
    console.log(`\n✅ PASSED: All structured data valid`);
  } else {
    totalInvalid++;
    console.log(`\n❌ FAILED: Validation errors found`);
  }
});

// Summary
console.log('\n\n');
console.log('='.repeat(80));
console.log('VALIDATION SUMMARY');
console.log('='.repeat(80));
console.log(`Total Pages Tested: ${totalPages}`);
console.log(`✅ Valid: ${totalValid}`);
console.log(`❌ Invalid: ${totalInvalid}`);
console.log(`Success Rate: ${Math.round((totalValid / totalPages) * 100)}%`);

if (issues.length > 0) {
  console.log(`\n\n${'='.repeat(80)}`);
  console.log('ISSUES FOUND');
  console.log('='.repeat(80));
  issues.forEach((issue, i) => {
    console.log(`${i + 1}. ${issue.page}: ${issue.issue}`);
  });
}

console.log('\n\n');
console.log('='.repeat(80));
console.log('NEXT STEPS - GOOGLE RICH RESULTS TEST');
console.log('='.repeat(80));
console.log('');
console.log('1. Start the dev server: npm run dev');
console.log('2. Visit: https://search.google.com/test/rich-results');
console.log('3. Test each page URL:');
console.log('');
pages.forEach(page => {
  const urlPath = page.path.replace('./', '');
  console.log(`   http://localhost:5173/${urlPath}`);
});
console.log('');
console.log('4. Verify:');
console.log('   - LocalBusiness schema appears in results');
console.log('   - Service schema appears in results');
console.log('   - Review schema appears in results (homepage only)');
console.log('   - No errors or critical warnings');
console.log('');
console.log('='.repeat(80));
console.log('');
