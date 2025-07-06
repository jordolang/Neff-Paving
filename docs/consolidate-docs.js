#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define consolidation mappings
const consolidationMap = {
  'DEPLOYMENT.md': [
    'deployment/deployment-guide.md',
    'DEPLOYMENT_GUIDE.md',
    'VERCEL_DEPLOYMENT_CHECKLIST.md',
    'deployment/deployment-checklist.md',
    'DEPLOYMENT_STATUS.md'
  ],
  'DATABASE.md': [
    'database/database-setup.md',
    'DATABASE_SETUP.md',
    'database/schema.md',
    'DATABASE_SCHEMA.md',
    'database/migrations.md'
  ],
  'CONFIGURATION.md': [
    'config/configuration-guide.md',
    'CONFIGURATION_GUIDE.md',
    'config/environment-variables.md',
    'ENV_SETUP.md',
    'config/api-keys.md'
  ],
  'DEVELOPMENT.md': [
    'dev/development-setup.md',
    'DEVELOPMENT_SETUP.md',
    'dev/local-development.md',
    'LOCAL_SETUP.md',
    'dev/coding-standards.md'
  ],
  'API.md': [
    'api/api-documentation.md',
    'API_DOCUMENTATION.md',
    'api/endpoints.md',
    'API_ENDPOINTS.md',
    'api/authentication.md'
  ],
  'TESTING.md': [
    'tests/testing-guide.md',
    'TESTING_GUIDE.md',
    'tests/unit-tests.md',
    'tests/integration-tests.md',
    'QA_CHECKLIST.md'
  ]
};

// Configuration
const config = {
  sourceDirectory: process.cwd(),
  outputDirectory: path.join(process.cwd(), 'docs-consolidated'),
  backupDirectory: path.join(process.cwd(), 'docs-backup'),
  redirectMapFile: 'redirect-map.json',
  logFile: 'consolidation-log.txt',
  encoding: 'utf8',
  maxFileSizeMB: 10
};

class DocumentConsolidator {
  constructor() {
    this.processedFiles = new Set();
    this.contentHashes = new Map();
    this.redirectMap = new Map();
    this.logs = [];
    this.stats = {
      filesProcessed: 0,
      filesConsolidated: 0,
      duplicatesRemoved: 0,
      totalSizeReduced: 0
    };
  }

  log(message, type = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${type}: ${message}`;
    this.logs.push(logEntry);
    console.log(logEntry);
  }

  // Create necessary directories
  ensureDirectories() {
    const dirs = [config.outputDirectory, config.backupDirectory];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        this.log(`Created directory: ${dir}`);
      }
    });
  }

  // Read file with error handling
  readFile(filePath) {
    try {
      const fullPath = path.resolve(config.sourceDirectory, filePath);
      if (!fs.existsSync(fullPath)) {
        this.log(`File not found: ${filePath}`, 'WARN');
        return null;
      }

      const stats = fs.statSync(fullPath);
      if (stats.size > config.maxFileSizeMB * 1024 * 1024) {
        this.log(`File too large (${Math.round(stats.size / 1024 / 1024)}MB): ${filePath}`, 'WARN');
        return null;
      }

      const content = fs.readFileSync(fullPath, config.encoding);
      this.stats.filesProcessed++;
      return {
        path: filePath,
        content: content,
        size: stats.size,
        lastModified: stats.mtime
      };
    } catch (error) {
      this.log(`Error reading file ${filePath}: ${error.message}`, 'ERROR');
      return null;
    }
  }

  // Generate content hash for deduplication
  generateContentHash(content) {
    // Normalize content by removing extra whitespace and converting to lowercase
    const normalized = content
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim()
      .toLowerCase();
    
    return crypto.createHash('sha256').update(normalized).digest('hex');
  }

  // Extract sections from markdown content
  extractSections(content, filePath) {
    const sections = [];
    const lines = content.split('\n');
    let currentSection = { title: '', content: '', level: 0 };
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      
      if (headerMatch) {
        // Save previous section if it has content
        if (currentSection.content.trim()) {
          currentSection.source = filePath;
          sections.push({ ...currentSection });
        }
        
        // Start new section
        currentSection = {
          title: headerMatch[2].trim(),
          content: line + '\n',
          level: headerMatch[1].length,
          source: filePath
        };
      } else {
        currentSection.content += line + '\n';
      }
    }
    
    // Add final section
    if (currentSection.content.trim()) {
      currentSection.source = filePath;
      sections.push(currentSection);
    }
    
    return sections;
  }

  // Deduplicate content sections
  deduplicateContent(sections) {
    const uniqueSections = [];
    const seenHashes = new Set();
    
    for (const section of sections) {
      const hash = this.generateContentHash(section.content);
      
      if (!seenHashes.has(hash)) {
        seenHashes.add(hash);
        uniqueSections.push(section);
      } else {
        this.stats.duplicatesRemoved++;
        this.log(`Duplicate section removed: "${section.title}" from ${section.source}`);
      }
    }
    
    return uniqueSections;
  }

  // Generate table of contents
  generateTableOfContents(sections) {
    const toc = [];
    toc.push('## Table of Contents\n');
    
    for (const section of sections) {
      if (section.title && section.level > 0) {
        const indent = '  '.repeat(section.level - 1);
        const anchor = section.title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-');
        
        toc.push(`${indent}- [${section.title}](#${anchor})`);
      }
    }
    
    toc.push(''); // Empty line after TOC
    return toc.join('\n');
  }

  // Format consolidated content
  formatConsolidatedContent(outputFileName, sections) {
    const content = [];
    
    // Add header
    const title = outputFileName.replace('.md', '').replace(/[_-]/g, ' ').toUpperCase();
    content.push(`# ${title}\n`);
    content.push(`*This document was automatically consolidated from multiple sources.*\n`);
    content.push(`*Last updated: ${new Date().toISOString()}*\n`);
    
    // Add table of contents
    content.push(this.generateTableOfContents(sections));
    
    // Add source file list
    const sources = [...new Set(sections.map(s => s.source))];
    content.push('## Source Files\n');
    content.push('This document consolidates information from the following files:\n');
    sources.forEach(source => {
      content.push(`- \`${source}\``);
    });
    content.push('\n---\n');
    
    // Add sections
    sections.forEach(section => {
      if (section.content.trim()) {
        content.push(section.content);
        content.push(''); // Add spacing between sections
      }
    });
    
    return content.join('\n');
  }

  // Create backup of existing files
  createBackup() {
    this.log('Creating backup of existing documentation...');
    
    for (const [outputFile, sourceFiles] of Object.entries(consolidationMap)) {
      // Backup source files
      for (const sourceFile of sourceFiles) {
        const sourcePath = path.resolve(config.sourceDirectory, sourceFile);
        if (fs.existsSync(sourcePath)) {
          const backupPath = path.join(config.backupDirectory, sourceFile);
          const backupDir = path.dirname(backupPath);
          
          if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
          }
          
          fs.copyFileSync(sourcePath, backupPath);
          this.log(`Backed up: ${sourceFile}`);
        }
      }
      
      // Backup existing consolidated file if it exists
      const outputPath = path.join(config.outputDirectory, outputFile);
      if (fs.existsSync(outputPath)) {
        const backupPath = path.join(config.backupDirectory, `consolidated-${outputFile}`);
        fs.copyFileSync(outputPath, backupPath);
        this.log(`Backed up existing consolidated file: ${outputFile}`);
      }
    }
  }

  // Process consolidation for a single output file
  processConsolidation(outputFileName, sourceFiles) {
    this.log(`Processing consolidation for: ${outputFileName}`);
    
    const allSections = [];
    const fileInfos = [];
    
    // Read all source files
    for (const sourceFile of sourceFiles) {
      const fileData = this.readFile(sourceFile);
      if (fileData) {
        fileInfos.push(fileData);
        const sections = this.extractSections(fileData.content, sourceFile);
        allSections.push(...sections);
        
        // Track redirect mapping
        this.redirectMap.set(sourceFile, outputFileName);
        this.log(`Mapped ${sourceFile} -> ${outputFileName}`);
      }
    }
    
    if (allSections.length === 0) {
      this.log(`No content found for ${outputFileName}`, 'WARN');
      return false;
    }
    
    // Deduplicate content
    const uniqueSections = this.deduplicateContent(allSections);
    
    // Sort sections by level and title
    uniqueSections.sort((a, b) => {
      if (a.level !== b.level) return a.level - b.level;
      return a.title.localeCompare(b.title);
    });
    
    // Generate consolidated content
    const consolidatedContent = this.formatConsolidatedContent(outputFileName, uniqueSections);
    
    // Write consolidated file
    const outputPath = path.join(config.outputDirectory, outputFileName);
    fs.writeFileSync(outputPath, consolidatedContent, config.encoding);
    
    this.stats.filesConsolidated++;
    this.log(`Created consolidated file: ${outputFileName} (${uniqueSections.length} sections)`);
    
    return true;
  }

  // Generate redirect mapping file
  generateRedirectMap() {
    const redirectObj = Object.fromEntries(this.redirectMap);
    const redirectPath = path.join(config.outputDirectory, config.redirectMapFile);
    
    fs.writeFileSync(redirectPath, JSON.stringify(redirectObj, null, 2), config.encoding);
    this.log(`Generated redirect mapping: ${config.redirectMapFile}`);
  }

  // Generate consolidation report
  generateReport() {
    const report = [];
    report.push('# Documentation Consolidation Report\n');
    report.push(`Generated: ${new Date().toISOString()}\n`);
    
    report.push('## Statistics\n');
    report.push(`- Files processed: ${this.stats.filesProcessed}`);
    report.push(`- Files consolidated: ${this.stats.filesConsolidated}`);
    report.push(`- Duplicates removed: ${this.stats.duplicatesRemoved}`);
    report.push('');
    
    report.push('## Consolidation Mappings\n');
    for (const [outputFile, sourceFiles] of Object.entries(consolidationMap)) {
      report.push(`### ${outputFile}`);
      report.push('Source files:');
      sourceFiles.forEach(file => {
        const exists = fs.existsSync(path.resolve(config.sourceDirectory, file));
        report.push(`- ${file} ${exists ? '✓' : '✗'}`);
      });
      report.push('');
    }
    
    report.push('## Processing Log\n');
    report.push('```');
    report.push(...this.logs);
    report.push('```');
    
    const reportPath = path.join(config.outputDirectory, 'consolidation-report.md');
    fs.writeFileSync(reportPath, report.join('\n'), config.encoding);
    this.log(`Generated consolidation report: consolidation-report.md`);
  }

  // Main consolidation process
  async consolidate() {
    try {
      this.log('Starting documentation consolidation...');
      
      // Setup
      this.ensureDirectories();
      this.createBackup();
      
      // Process each consolidation mapping
      for (const [outputFile, sourceFiles] of Object.entries(consolidationMap)) {
        this.processConsolidation(outputFile, sourceFiles);
      }
      
      // Generate supporting files
      this.generateRedirectMap();
      this.generateReport();
      
      this.log('Documentation consolidation completed successfully!');
      console.log('\n📊 Final Statistics:');
      console.log(`   Files processed: ${this.stats.filesProcessed}`);
      console.log(`   Files consolidated: ${this.stats.filesConsolidated}`);
      console.log(`   Duplicates removed: ${this.stats.duplicatesRemoved}`);
      console.log(`\n📁 Output directory: ${config.outputDirectory}`);
      console.log(`📁 Backup directory: ${config.backupDirectory}`);
      
    } catch (error) {
      this.log(`Fatal error during consolidation: ${error.message}`, 'ERROR');
      console.error('❌ Consolidation failed:', error.message);
      process.exit(1);
    }
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  // Handle command line arguments
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Documentation Consolidation Script

Usage: node consolidate-docs.js [options]

Options:
  --help, -h          Show this help message
  --dry-run          Show what would be consolidated without making changes
  --source-dir DIR   Source directory to scan (default: current directory)
  --output-dir DIR   Output directory for consolidated files (default: ./docs-consolidated)
  --verbose          Enable verbose logging

Example:
  node consolidate-docs.js --source-dir ./project --output-dir ./docs
    `);
    process.exit(0);
  }
  
  // Handle dry run
  if (args.includes('--dry-run')) {
    console.log('🔍 Dry run mode - showing consolidation plan...\n');
    
    for (const [outputFile, sourceFiles] of Object.entries(consolidationMap)) {
      console.log(`📄 ${outputFile}`);
      console.log('   Source files:');
      sourceFiles.forEach(file => {
        const exists = fs.existsSync(path.resolve(config.sourceDirectory, file));
        console.log(`   - ${file} ${exists ? '✓' : '✗'}`);
      });
      console.log('');
    }
    
    process.exit(0);
  }
  
  // Handle custom directories
  const sourceIndex = args.indexOf('--source-dir');
  if (sourceIndex !== -1 && args[sourceIndex + 1]) {
    config.sourceDirectory = path.resolve(args[sourceIndex + 1]);
  }
  
  const outputIndex = args.indexOf('--output-dir');
  if (outputIndex !== -1 && args[outputIndex + 1]) {
    config.outputDirectory = path.resolve(args[outputIndex + 1]);
    config.backupDirectory = path.join(config.outputDirectory, '../docs-backup');
  }
  
  // Run consolidation
  const consolidator = new DocumentConsolidator();
  consolidator.consolidate();
}

export default DocumentConsolidator;
