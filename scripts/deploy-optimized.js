#!/usr/bin/env node

/**
 * Optimized Deployment Script for Birkhimer Asphalt
 * Handles both GitHub Pages and Vercel deployments
 */

import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Get deployment platform from environment
const deployPlatform = process.env.DEPLOY_PLATFORM || 'github';
const isVercel = deployPlatform === 'vercel' || process.env.VERCEL === '1';

console.log(`🚀 Starting optimized deployment for ${deployPlatform.toUpperCase()}...`);

async function deployOptimized() {
    try {
        // Step 1: Clean previous builds
        console.log('🧹 Cleaning previous builds...');
        await fs.remove(path.join(projectRoot, 'dist'));
        await fs.remove(path.join(projectRoot, 'dist-github'));

        // Step 2: Build for target platform
        console.log(`🔨 Building for ${deployPlatform}...`);
        const buildCommand = isVercel ? 'npm run build:vercel' : 'npm run build:github';
        execSync(buildCommand, { stdio: 'inherit', cwd: projectRoot });

        // Step 3: Verify build output
        console.log('✅ Verifying build output...');
        const distDir = path.join(projectRoot, 'dist');
        const distExists = await fs.pathExists(distDir);

        if (!distExists) {
            throw new Error('Build output directory not found');
        }

        // Step 4: Generate deployment manifest
        console.log('📋 Generating deployment manifest...');
        const manifest = {
            platform: deployPlatform,
            timestamp: new Date().toISOString(),
            buildId: `build-${Date.now()}`,
            assets: []
        };

        // Collect asset information
        const assetsDir = path.join(distDir, 'assets');
        if (await fs.pathExists(assetsDir)) {
            const assetFiles = await fs.readdir(assetsDir, { recursive: true });
            manifest.assets = assetFiles.filter(file =>
                typeof file === 'string' &&
                (file.endsWith('.js') || file.endsWith('.css') || file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.webp'))
            );
        }

        await fs.writeJson(path.join(distDir, 'deployment-manifest.json'), manifest, { spaces: 2 });

        // Step 5: Platform-specific optimizations
        if (isVercel) {
            console.log('🔧 Applying Vercel optimizations...');
            await applyVercelOptimizations(distDir);
        } else {
            console.log('🔧 Applying GitHub Pages optimizations...');
            await applyGitHubOptimizations(distDir);
        }

        // Step 6: Generate deployment report
        console.log('📊 Generating deployment report...');
        const report = {
            platform: deployPlatform,
            timestamp: new Date().toISOString(),
            buildSize: await getDirectorySize(distDir),
            assetCount: manifest.assets.length,
            status: 'success'
        };

        await fs.writeJson(path.join(distDir, 'deployment-report.json'), report, { spaces: 2 });

        console.log('✅ Deployment preparation completed successfully!');
        console.log(`📁 Build output: ${distDir}`);
        console.log(`📊 Assets: ${manifest.assets.length} files`);
        console.log(`💾 Build size: ${(report.buildSize / 1024 / 1024).toFixed(2)} MB`);

    } catch (error) {
        console.error('❌ Deployment preparation failed:', error.message);
        process.exit(1);
    }
}

async function applyVercelOptimizations(distDir) {
    // Vercel-specific optimizations
    const indexHtmlPath = path.join(distDir, 'index.html');
    if (await fs.pathExists(indexHtmlPath)) {
        let content = await fs.readFile(indexHtmlPath, 'utf8');

        // Ensure absolute paths for Vercel
        content = content.replace(/href="\.\//g, 'href="/');
        content = content.replace(/src="\.\//g, 'src="/');

        await fs.writeFile(indexHtmlPath, content);
    }
}

async function applyGitHubOptimizations(distDir) {
    // GitHub Pages-specific optimizations
    const indexHtmlPath = path.join(distDir, 'index.html');
    if (await fs.pathExists(indexHtmlPath)) {
        let content = await fs.readFile(indexHtmlPath, 'utf8');

        // Ensure relative paths for GitHub Pages
        content = content.replace(/href="\/assets\//g, 'href="./assets/');
        content = content.replace(/src="\/assets\//g, 'src="./assets/');

        await fs.writeFile(indexHtmlPath, content);
    }
}

async function getDirectorySize(dirPath) {
    let totalSize = 0;

    const files = await fs.readdir(dirPath, { recursive: true });
    for (const file of files) {
        if (typeof file === 'string') {
            const filePath = path.join(dirPath, file);
            const stats = await fs.stat(filePath);
            if (stats.isFile()) {
                totalSize += stats.size;
            }
        }
    }

    return totalSize;
}

// Run deployment
deployOptimized();