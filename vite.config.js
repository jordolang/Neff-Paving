import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  // Dynamic base URL configuration
  const getBaseUrl = () => {
    // Detect Vercel environment
    if (mode === 'vercel' || process.env.VERCEL || process.env.VERCEL_ENV || process.env.VERCEL_URL) return '/';
    if (mode === 'github') return '/Neff-Paving/';
    return process.env.VITE_BASE_URL || '/Neff-Paving/';
  };

  const baseUrl = getBaseUrl();
  const deployTime = process.env.VITE_DEPLOY_TIME || Date.now();
  const buildTimestamp = new Date().toISOString();

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
      // SPA fallback for admin panel during development
      middlewareMode: false,
      proxy: {
        // Proxy admin API calls to backend during development
        '/api': {
          target: 'http://localhost:8001',
          changeOrigin: true,
          secure: false
        }
      },
      // Custom middleware for SPA routing
      configureServer(server) {
        server.middlewares.use('/admin', (req, res, next) => {
          // Handle admin SPA routing in development
          if (req.url.startsWith('/admin') && !req.url.includes('.')) {
            req.url = '/admin/index.html';
          }
          next();
        });
      }
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
      __IS_VERCEL__: JSON.stringify(mode === 'vercel' || process.env.VITE_PLATFORM === 'vercel')
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
    assetsInlineLimit: 8192, // Increased from 4096
    // Enhanced code splitting
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        '404': resolve(__dirname, '404.html'),
        'estimate-form': resolve(__dirname, 'assets/paving-estimate-form.html')
      },
      output: {
        // Optimized asset file naming with cache-friendly hashes
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          
          // Special handling for different asset types
          if (/md|json/i.test(ext)) {
            return `blog-posts/[name][extname]`
          }
          
          // Font files
          if (/woff2?|ttf|eot/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`
          }
          
          // Images
          if (/png|jpe?g|gif|svg|webp/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`
          }
          
          // Videos
          if (/mp4|webm|ogg/i.test(ext)) {
            return `assets/videos/[name]-[hash][extname]`
          }
          
          // CSS files
          if (/css/i.test(ext)) {
            return `assets/styles/[name]-[hash][extname]`
          }
          
          // Default for other assets
          return `assets/[name]-[hash][extname]`
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
    // Temporarily commented out enhanced-asset-processor plugin as it may be breaking paths
    /*
    {
      name: 'enhanced-asset-processor',
      async writeBundle(options, bundle) {
        
        const fs = await import('fs');
        const path = await import('path');
        
        // Helper functions defined within the scope
        const generatePreloadTags = (bundle, mode) => {
          const criticalAssets = [];
          
          // Find critical CSS
          const cssFiles = Object.keys(bundle).filter(name => name.endsWith('.css'));
          cssFiles.forEach(file => {
            criticalAssets.push(`    <link rel="preload" href="/${file}" as="style" onload="this.onload=null;this.rel='stylesheet'">`);
          });
          
          // Find main JS entry
          const jsFiles = Object.keys(bundle).filter(name => name.startsWith('entries/main-'));
          jsFiles.forEach(file => {
            criticalAssets.push(`    <link rel="modulepreload" href="/${file}">`);
          });
          
          return criticalAssets.join('\n');
        };
        
        const processVercelPaths = (content) => {
          // Ensure all asset paths are absolute from root
          return content.replace(
            /(href|src)="\/([^"]+)"/g,
            '$1="/$2"'
          );
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
        
        const addCacheBusting = (content, deployTime) => {
          // Only add cache busting to non-hashed assets
          return content.replace(
            /(href|src)="([^"]+\.(css|js|png|jpg|jpeg|gif|svg|webp|mp4|webm|ico|woff|woff2))(?!.*-[a-f0-9]{8,})[^"]*"/g,
            `$1="$2?v=${deployTime}"`
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
            content = addCacheBusting(content, deployTime);
            
            // Add performance optimizations
            content = addPerformanceOptimizations(content);
            
            // Write the modified content back to file
            fs.writeFileSync(htmlFilePath, content, 'utf8');
          }
        }
      }
    }
    */
  ]
  };
});
