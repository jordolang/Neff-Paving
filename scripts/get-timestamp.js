#!/usr/bin/env node

/**
 * Cross-platform timestamp generator for build-time cache busting
 * Outputs current timestamp in ISO format for use in environment variables
 */

const timestamp = new Date().toISOString();
process.stdout.write(timestamp);
