#!/usr/bin/env node

/**
 * Build script to inject environment variables into the config-loader.js file
 * This replaces placeholders with actual values from .env.local during build
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const GOOGLE_MAPS_API_KEY = process.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Files to process
const configLoaderPath = path.join(__dirname, '../config-loader.js');
const distConfigLoaderPath = path.join(__dirname, '../dist/config-loader.js');

function injectEnvironmentVariables(filePath) {
    if (!fs.existsSync(filePath)) {
        console.warn(`⚠️  File not found: ${filePath}`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // Replace placeholder with actual API key
    content = content.replace(
        /%VITE_GOOGLE_MAPS_API_KEY%/g,
        GOOGLE_MAPS_API_KEY
    );

    fs.writeFileSync(filePath, content, 'utf8');

    if (GOOGLE_MAPS_API_KEY) {
        console.log(`✅ Injected API key into ${path.basename(filePath)}`);
    } else {
        console.warn(`⚠️  No API key found in environment variables for ${path.basename(filePath)}`);
    }
}

// Process files
console.log('🔄 Injecting environment variables into config files...');

// Copy config-loader.js to dist if dist exists
const distDir = path.join(__dirname, '../dist');
if (fs.existsSync(distDir)) {
    fs.copyFileSync(configLoaderPath, distConfigLoaderPath);
    console.log('📋 Copied config-loader.js to dist/');
}

// Inject into both files
injectEnvironmentVariables(configLoaderPath);
if (fs.existsSync(distConfigLoaderPath)) {
    injectEnvironmentVariables(distConfigLoaderPath);
}

console.log('✅ Environment variable injection complete!');

if (!GOOGLE_MAPS_API_KEY) {
    console.log('');
    console.log('⚠️  WARNING: Google Maps API key not configured!');
    console.log('To enable Google Maps:');
    console.log('1. Create a .env.local file in the project root');
    console.log('2. Add: VITE_GOOGLE_MAPS_API_KEY=your_api_key_here');
    console.log('3. Run the build again');
}
