import { defineConfig } from 'vite'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

export default defineConfig(({ mode }) => {
  // Dynamic base URL configuration
  const getBaseUrl = () => {
    // Detect Vercel environment more reliably
    if (mode === 'vercel' || process.env.VERCEL === '1' || process.env.VERCEL_ENV || process.env.VERCEL_URL) {
      return '/';
    }
    if (mode === 'github') return '/Neff-Paving/';
    return process.env.VITE_BASE_URL || '/Neff-Paving/';
  };

  const baseUrl = getBaseUrl();
  const deployTime = process.env.VITE_DEPLOY_TIME || Date.now();
  // Use environment variable if available, otherwise generate new timestamp
  const buildTimestamp = process.env.VITE_BUILD_TIMESTAMP || new Date().toISOString();

  return {
    base: baseUrl,
    root: '.',
    server: {
      port: 3000,
      open: true,
      // Enable compression in dev
      compress: true,
      headers: {
        // Development server headers - disable caching for dev
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      // Configure CORS for development
      cors: true,
      // Standard SPA fallback
      middlewareMode: false
    },
    resolve: {
      alias: {
        '@': '/src',
        '@assets': '/assets',
        '@styles': '/styles',
        '@scripts': '/scripts'
      }
    },
    define: {
      global: 'globalThis',
      __BUILD_TIMESTAMP__: JSON.stringify(buildTimestamp),
      __DEPLOY_TIME__: JSON.stringify(deployTime),
      __BASE_URL__: JSON.stringify(baseUrl),
      __DEPLOY_MODE__: JSON.stringify(mode || 'github'),
      __PLATFORM__: JSON.stringify(process.env.VITE_PLATFORM || mode || 'github'),
      __IS_GITHUB_PAGES__: JSON.stringify(mode === 'github' || process.env.VITE_PLATFORM === 'github'),
      __IS_VERCEL__: JSON.stringify(
        mode === 'vercel' || 
        process.env.VITE_PLATFORM === 'vercel' || 
        process.env.VERCEL === '1' || 
        process.env.VERCEL_ENV || 
        process.env.DEPLOY_PLATFORM === 'vercel'
      )
    },
  // Performance optimizations
  optimizeDeps: {
    include: ['gsap', 'aos'],
    exclude: ['@vite/client', '@vite/env']
  },
  // Handle Node.js built-ins
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: mode !== 'production',
    // Optimize asset inlining
    assetsInlineLimit: (filePath, content) => {
      // Exclude gallery images from inlining to preserve paths
      if (filePath && filePath.includes('gallery/')) {
        return false;
      }
      // For Vercel, use smaller inline limit to ensure proper asset handling
      const inlineLimit = mode === 'vercel' ? 4096 : 8192;
      return content.length < inlineLimit;
    },
    // Enhanced code splitting
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        '404': resolve(__dirname, '404.html'),
        'estimate-form': resolve(__dirname, 'estimate-form.html')
      },
      output: {
        // Optimized asset file naming with cache-friendly hashes
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          
          // Gallery images - preserve original paths without hashing for Vercel
          if (assetInfo.name && assetInfo.name.includes('gallery/')) {
            // Extract the gallery path from the original name
            const galleryMatch = assetInfo.name.match(/(gallery\/.+)/);
            if (galleryMatch) {
              // For Vercel deployment, ensure paths start with assets/
              return `assets/${galleryMatch[1]}`;
            }
          }
          
          // Special handling for different asset types
          if (/md|json/i.test(ext)) {
            return `blog-posts/[name][extname]`
          }
          
          // Font files - use consistent paths for Vercel
          if (/woff2?|ttf|eot/i.test(ext)) {
            return mode === 'vercel' ? 
              `assets/fonts/[name].[hash][extname]` : 
              `assets/fonts/[name]-[hash][extname]`
          }
          
          // Images (excluding gallery images which are handled above)
          if (/png|jpe?g|gif|svg|webp/i.test(ext)) {
            return mode === 'vercel' ? 
              `assets/images/[name].[hash][extname]` : 
              `assets/images/[name]-[hash][extname]`
          }
          
          // Videos
          if (/mp4|webm|ogg/i.test(ext)) {
            return mode === 'vercel' ? 
              `assets/videos/[name].[hash][extname]` : 
              `assets/videos/[name]-[hash][extname]`
          }
          
          // CSS files
          if (/css/i.test(ext)) {
            return mode === 'vercel' ? 
              `assets/styles/[name].[hash][extname]` : 
              `assets/styles/[name]-[hash][extname]`
          }
          
          // Default for other assets
          return mode === 'vercel' ? 
            `assets/[name].[hash][extname]` : 
            `assets/[name]-[hash][extname]`
        },
        
        // Chunk file naming for better caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop().replace(/\.[^.]+$/, '') : 'chunk';
          return `chunks/${facadeModuleId}-[hash].js`
        },
        
        // Entry file naming
        entryFileNames: (chunkInfo) => {
          return `entries/[name]-[hash].js`
        },
        
        // Manual chunks for better code splitting - simplified
        manualChunks: {
          // Vendor chunks
          'vendor': ['gsap', 'aos']
        }
      },
    },
    // Compression and minification
    minify: mode === 'production' || mode === 'vercel' ? 'terser' : false,
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
        pure_funcs: mode === 'production' ? ['console.log', 'console.info', 'console.debug'] : []
      },
      mangle: {
        safari10: true
      }
    },
    // Enable CSS code splitting for better caching
    cssCodeSplit: true,
    // CSS minification
    cssMinify: mode === 'production' || mode === 'vercel',
    // Target modern browsers for better performance
    target: ['es2020', 'chrome70', 'firefox78', 'safari13']
  },
  // Enhanced plugin configuration
  plugins: [
    // Copy gallery images to dist - runs after build process to avoid Vite asset pipeline
    {
      name: 'copy-gallery-images',
      // Use writeBundle hook to ensure this runs after the build process
      async writeBundle() {
        const sourceDir = resolve(__dirname, 'assets/gallery');
        const targetDir = resolve(__dirname, 'dist/assets/gallery');
        
        console.log('🔄 Starting gallery images copy process...');
        console.log(`📂 Source: ${sourceDir}`);
        console.log(`📂 Target: ${targetDir}`);
        
        // Statistics tracking
        const stats = {
          directories: 0,
          files: 0,
          totalSize: 0
        };
        
        // Function to copy directory recursively while preserving exact structure
        const copyDirectory = (src, dest, relativePath = '') => {
          try {
            // Ensure destination directory exists
            mkdirSync(dest, { recursive: true });
            
            // Read directory contents
            const entries = readdirSync(src, { withFileTypes: true });
            
            // Log directory being processed
            if (relativePath) {
              console.log(`📁 Processing subdirectory: ${relativePath}`);
              stats.directories++;
            }
            
            for (const entry of entries) {
              const srcPath = join(src, entry.name);
              const destPath = join(dest, entry.name);
              const currentRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
              
              if (entry.isDirectory()) {
                // Recursively copy subdirectories
                copyDirectory(srcPath, destPath, currentRelativePath);
              } else {
                // Copy files without modification or renaming
                const srcStat = statSync(srcPath);
                copyFileSync(srcPath, destPath);
                
                // Log each file copied
                console.log(`  📄 Copied: ${currentRelativePath} (${(srcStat.size / 1024).toFixed(1)}KB)`);
                stats.files++;
                stats.totalSize += srcStat.size;
              }
            }
          } catch (error) {
            console.error(`❌ Error copying directory ${src}:`, error.message);
            throw error;
          }
        };
        
        try {
          // Verify source directory exists
          if (!readdirSync(sourceDir).length) {
            console.warn('⚠️ Source gallery directory is empty');
            return;
          }
          
          // Copy gallery directory with exact structure preservation
          copyDirectory(sourceDir, targetDir);
          
          // Verify copy completed successfully
          const verifyDirectory = (src, dest, path = '') => {
            const srcEntries = readdirSync(src, { withFileTypes: true });
            for (const entry of srcEntries) {
              const srcPath = join(src, entry.name);
              const destPath = join(dest, entry.name);
              const currentPath = path ? `${path}/${entry.name}` : entry.name;
              
              if (entry.isDirectory()) {
                if (!readdirSync(destPath).length && readdirSync(srcPath).length) {
                  throw new Error(`Directory not copied correctly: ${currentPath}`);
                }
                verifyDirectory(srcPath, destPath, currentPath);
              } else {
                const srcStat = statSync(srcPath);
                const destStat = statSync(destPath);
                if (srcStat.size !== destStat.size) {
                  throw new Error(`File size mismatch: ${currentPath}`);
                }
              }
            }
          };
          
          // Verify the copy
          verifyDirectory(sourceDir, targetDir);
          
          // Success summary
          console.log('\n✅ Gallery images copy completed successfully!');
          console.log(`📊 Summary:`);
          console.log(`   - Directories copied: ${stats.directories}`);
          console.log(`   - Files copied: ${stats.files}`);
          console.log(`   - Total size: ${(stats.totalSize / 1024 / 1024).toFixed(2)}MB`);
          console.log(`📁 All gallery subdirectories confirmed in: dist/assets/gallery/`);
          
          // List all subdirectories copied
          const subdirs = readdirSync(targetDir, { withFileTypes: true })
            .filter(entry => entry.isDirectory())
            .map(entry => entry.name);
          console.log(`🗂️ Subdirectories copied: ${subdirs.join(', ')}`);
          
        } catch (error) {
          console.error('❌ Gallery images copy failed:', error.message);
          throw error;
        }
      }
    },
    // Temporarily commented out enhanced-asset-processor plugin as it may be breaking paths
    {
      name: 'enhanced-asset-processor',
      async writeBundle(options, bundle) {
        
        const fs = await import('fs');
        const path = await import('path');
        
        // Helper functions defined within the scope
        const generatePreloadTags = (bundle, mode) => {
          const criticalAssets = [];
          
          // Find critical CSS - but don't add preload tags since they're already in the HTML
          // Vite automatically handles preloading, so we don't need to duplicate
          
          return criticalAssets.join('\n');
        };
        
        const addMainScript = (content, bundle, timestamp) => {
          // Vite automatically adds script tags, so we don't need to add them manually
          // This prevents duplicate script tags
          return content;
        };
        
        const processVercelPaths = (content) => {
          // For Vercel, ensure all asset paths are absolute from root
          // Remove any duplicate slashes and ensure proper asset path structure
          return content
            .replace(/(href|src)="\/+/g, '$1="/')
            .replace(/(href|src)="\/assets\/gallery\//g, '$1="/assets/gallery/')
            .replace(/(url\(['"]?)\/+/g, '$1/')
            // Ensure all assets start with single slash but don't add if already present
            .replace(/(href|src)="(?!\/|https?:\/\/)([^\"]*\.(css|js|png|jpg|jpeg|gif|svg|webp|mp4|webm|ico|woff|woff2)(?:[?#][^"]*)?)"/g, '$1="/$2"')
        };
        
        const processGitHubPaths = (content, baseUrl) => {
          const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
          
          // Update asset paths to include base URL for GitHub Pages
          return content
            .replace(
              /(href|src)="\/assets\/([^"]+)"/g,
              `$1="${cleanBaseUrl}/assets/$2"`
            )
            .replace(
              /(href|src)="\/entries\/([^"]+)"/g,
              `$1="${cleanBaseUrl}/entries/$2"`
            )
            .replace(
              /(href|src)="\/chunks\/([^"]+)"/g,
              `$1="${cleanBaseUrl}/chunks/$2"`
            );
        };
        
        const process404Html = (content, mode, baseUrl) => {
          // Special 404 page handling
          return content;
        };
        
        const addCacheBusting = (content, timestamp) => {
          // Only add cache busting to non-hashed assets
          return content.replace(
            /(href|src)="([^"]+\.(css|js|png|jpg|jpeg|gif|svg|webp|mp4|webm|ico|woff|woff2))(?!.*-[a-f0-9]{8,})[^"]*"/g,
            `$1="$2?v=${timestamp}"`
          );
        };
        
        const addPerformanceOptimizations = (content) => {
          // Add dns-prefetch for external domains
          const dnsPrefetch = [
            '    <link rel="dns-prefetch" href="//fonts.googleapis.com">',
            '    <link rel="dns-prefetch" href="//fonts.gstatic.com">',
            '    <link rel="dns-prefetch" href="//www.google-analytics.com">'
          ].join('\n');
          
          // Insert after existing preconnect tags
          return content.replace(
            '    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
            `    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n${dnsPrefetch}`
          );
        };

        // Process HTML files from dist directory
        const distDir = options.dir || 'dist';
        const htmlFiles = [
          path.join(distDir, 'index.html'),
          path.join(distDir, '404.html'),
          path.join(distDir, 'estimate-form.html'),
          path.join(distDir, 'services', 'index.html'),
          path.join(distDir, 'admin', 'index.html')
        ];
        
        for (const htmlFilePath of htmlFiles) {
          if (fs.existsSync(htmlFilePath)) {
            let content = fs.readFileSync(htmlFilePath, 'utf8');
            
            // Replace build-time placeholders
            content = content.replace(/{{ BUILD_TIMESTAMP }}/g, buildTimestamp);
            content = content.replace(/{{ BASE_URL }}/g, baseUrl);
            content = content.replace(/{{ DEPLOY_TIME }}/g, deployTime);
            
            // Add comprehensive asset preloading
            const preloadTags = generatePreloadTags(bundle, mode);
            content = content.replace(
              '<!-- Font preload for critical fonts -->',
              `<!-- Enhanced asset preloading -->\n${preloadTags}\n    <!-- Font preload for critical fonts -->`
            );
            
            // Handle relative vs absolute paths based on deployment mode
            if (mode === 'vercel') {
              // Vercel: Use absolute paths from root
              content = processVercelPaths(content);
            } else {
              // GitHub Pages: Use relative paths with base URL
              content = processGitHubPaths(content, baseUrl);
            }
            
            // Special handling for 404.html
            if (htmlFilePath.endsWith('404.html')) {
              content = process404Html(content, mode, baseUrl);
            }
            
            // Add cache-busting to static assets (but not to already hashed files)
            content = addCacheBusting(content, buildTimestamp);
            
            // Add performance optimizations
            content = addPerformanceOptimizations(content);
            
            // Add the main script tag to all HTML files
            content = addMainScript(content, bundle, buildTimestamp);
            
            // Write the modified content back to file
            fs.writeFileSync(htmlFilePath, content, 'utf8');
          }
        }
      }
    }
  ]
  };
});
