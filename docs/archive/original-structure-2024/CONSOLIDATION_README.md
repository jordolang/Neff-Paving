# Documentation Consolidation Script

This Node.js script automates the consolidation of scattered documentation files into organized, deduplicated documents.

## Features

- **Automatic File Discovery**: Scans for predefined documentation files across the project
- **Content Deduplication**: Removes duplicate sections using content hashing
- **Table of Contents Generation**: Creates automatic TOCs for consolidated documents
- **Backup Creation**: Safely backs up original files before consolidation
- **Redirect Mapping**: Generates a mapping file for updating references to old files
- **Comprehensive Reporting**: Provides detailed logs and statistics

## Installation

No additional dependencies required - uses Node.js built-in modules only.

## Usage

### Basic Usage

```bash
node consolidate-docs.js
```

### Command Line Options

```bash
# Show help
node consolidate-docs.js --help

# Dry run (preview what would be consolidated)
node consolidate-docs.js --dry-run

# Specify custom source directory
node consolidate-docs.js --source-dir /path/to/docs

# Specify custom output directory
node consolidate-docs.js --output-dir /path/to/output
```

### Example

```bash
# Run consolidation with custom directories
node consolidate-docs.js --source-dir ./project --output-dir ./docs-consolidated
```

## Configuration

The script is configured through the `consolidationMap` object at the top of the file:

```javascript
const consolidationMap = {
  'DEPLOYMENT.md': [
    'deployment/deployment-guide.md',
    'DEPLOYMENT_GUIDE.md',
    'VERCEL_DEPLOYMENT_CHECKLIST.md',
    'deployment/deployment-checklist.md',
    'DEPLOYMENT_STATUS.md'
  ],
  // ... more mappings
};
```

### Adding New Consolidation Rules

To add new consolidation rules:

1. Edit the `consolidationMap` object
2. Add your target file name as a key
3. List all source files that should be consolidated into that target

Example:
```javascript
'SECURITY.md': [
  'security/security-guide.md',
  'SECURITY_GUIDE.md',
  'security/authentication.md',
  'security/authorization.md'
]
```

## Output Structure

The script creates several output files:

### Consolidated Documents
- `DEPLOYMENT.md` - All deployment-related documentation
- `DATABASE.md` - Database setup and configuration
- `CONFIGURATION.md` - Configuration and environment setup
- `DEVELOPMENT.md` - Development setup and guidelines
- `API.md` - API documentation and endpoints
- `TESTING.md` - Testing guides and procedures

### Supporting Files
- `redirect-map.json` - Mapping of old file paths to new consolidated files
- `consolidation-report.md` - Detailed report of the consolidation process
- `consolidation-log.txt` - Processing logs

### Directory Structure
```
docs-consolidated/
├── DEPLOYMENT.md
├── DATABASE.md
├── CONFIGURATION.md
├── DEVELOPMENT.md
├── API.md
├── TESTING.md
├── redirect-map.json
└── consolidation-report.md

docs-backup/
├── deployment/
├── database/
└── ... (backed up source files)
```

## Content Processing

### Section Extraction
The script analyzes markdown files and extracts sections based on headers (`#`, `##`, `###`, etc.)

### Deduplication
- Content is normalized by removing extra whitespace
- SHA-256 hashes are generated for each section
- Duplicate sections are automatically removed

### Table of Contents
- Automatically generated from section headers
- Includes proper anchor links
- Maintains hierarchical structure

### Formatting
Each consolidated document includes:
- Document title and metadata
- Table of contents
- List of source files
- Consolidated content with proper spacing

## Error Handling

The script includes comprehensive error handling:
- File not found warnings
- Large file size limits (default: 10MB)
- Graceful handling of unreadable files
- Detailed error logging

## Backup Strategy

Before making any changes, the script:
1. Creates a `docs-backup` directory
2. Backs up all source files in their original structure
3. Backs up any existing consolidated files
4. Maintains file timestamps and permissions

## Customization

### File Size Limits
```javascript
const config = {
  maxFileSizeMB: 10, // Adjust as needed
  // ... other config
};
```

### Encoding
```javascript
const config = {
  encoding: 'utf8', // Change if needed
  // ... other config
};
```

### Directory Structure
```javascript
const config = {
  outputDirectory: path.join(process.cwd(), 'docs-consolidated'),
  backupDirectory: path.join(process.cwd(), 'docs-backup'),
  // ... other config
};
```

## Integration

### NPM Scripts
Add to your `package.json`:
```json
{
  "scripts": {
    "consolidate-docs": "node docs/consolidate-docs.js",
    "consolidate-docs:dry-run": "node docs/consolidate-docs.js --dry-run"
  }
}
```

### CI/CD Integration
```yaml
# Example GitHub Actions step
- name: Consolidate Documentation
  run: node docs/consolidate-docs.js
```

## Troubleshooting

### Common Issues

1. **Permission Errors**: Ensure write permissions for output directories
2. **File Not Found**: Check that source files exist and paths are correct
3. **ES Module Issues**: Ensure Node.js version supports ES modules

### Debug Mode
For verbose output, examine the logs in `consolidation-log.txt` after running.

## Best Practices

1. **Run Dry Run First**: Always use `--dry-run` to preview changes
2. **Review Backups**: Check backed up files before proceeding
3. **Update References**: Use the generated `redirect-map.json` to update file references
4. **Version Control**: Commit changes incrementally
5. **Test Links**: Verify all internal links work after consolidation

## Contributing

To extend the script:
1. Add new consolidation mappings
2. Enhance content processing logic
3. Add new output formats
4. Improve error handling
5. Add more CLI options

## License

This script is part of the project documentation system and follows the same license as the main project.
