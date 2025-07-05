import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  // Dynamic base URL configuration
  const getBaseUrl = () => {
    if (mode === 'vercel') return '/';
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
        services: resolve(__dirname, 'services/index.html'),
        admin: resolve(__dirname, 'admin/index.html'),
        '404': resolve(__dirname, '404.html')
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
        
        // Manual chunks for better code splitting
        manualChunks: {
          // Vendor chunks
          'vendor-animation': ['gsap', 'aos'],
          'vendor-vercel': ['@vercel/analytics', '@vercel/speed-insights'],
          // Utilities
          'utils': ['./src/utils/base-url.js']
        }
      },
    },
    // Compression and minification
    minify: mode === 'production' ? 'terser' : false,
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
    // Target modern browsers for better performance
    target: ['es2020', 'chrome70', 'firefox78', 'safari13']
  },
  // Enhanced plugin configuration
  plugins: [
    {
      name: 'enhanced-asset-processor',
      generateBundle(options, bundle) {
        for (const fileName in bundle) {
          if (fileName.endsWith('.html')) {
            const htmlFile = bundle[fileName];
            if (htmlFile.source) {
              let content = htmlFile.source;
              
              // Replace build-time placeholders
              content = content.replace(/{{ BUILD_TIMESTAMP }}/g, buildTimestamp);
              content = content.replace(/{{ BASE_URL }}/g, baseUrl);
              content = content.replace(/{{ DEPLOY_TIME }}/g, deployTime);
              
              // Add comprehensive asset preloading
              const preloadTags = this.generatePreloadTags(bundle, mode);
              content = content.replace(
                '<!-- Font preload for critical fonts -->',
                `<!-- Enhanced asset preloading -->
${preloadTags}
    <!-- Font preload for critical fonts -->`
              );
              
              // Handle relative vs absolute paths based on deployment mode
              if (mode === 'vercel') {
                // Vercel: Use absolute paths from root
                content = this.processVercelPaths(content);
              } else {
                // GitHub Pages: Use relative paths with base URL
                content = this.processGitHubPaths(content, baseUrl);
              }
              
              // Special handling for 404.html
              if (fileName === '404.html') {
                content = this.process404Html(content, mode, baseUrl);
              }
              
              // Add cache-busting to static assets (but not to already hashed files)
              content = this.addCacheBusting(content, deployTime);
              
              // Add performance optimizations
              content = this.addPerformanceOptimizations(content);
              
              htmlFile.source = content;
            }
          }
        }
      },
      
      generatePreloadTags(bundle, mode) {
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
      },
      
      processVercelPaths(content) {
        // Ensure all asset paths are absolute from root
        return content.replace(
          /(href|src)="\/([^"]+)"/g,
          '$1="/$2"'
        );
      },
      
      processGitHubPaths(content, baseUrl) {
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
      },
      
      addCacheBusting(content, deployTime) {
        // Only add cache busting to non-hashed assets
        return content.replace(
          /(href|src)="([^"]+\.(css|js|png|jpg|jpeg|gif|svg|webp|mp4|webm|ico|woff|woff2))(?!.*-[a-f0-9]{8,})[^"]*"/g,
          `$1="$2?v=${deployTime}"`
        );
      },
      
      addPerformanceOptimizations(content) {
        // Add dns-prefetch for external domains
        const dnsPrefetch = [
          '    <link rel="dns-prefetch" href="//fonts.googleapis.com">',
          '    <link rel="dns-prefetch" href="//fonts.gstatic.com">',
          '    <link rel="dns-prefetch" href="//www.google-analytics.com">'
        ].join('\n');
        
        // Insert after existing preconnect tags
        content = content.replace(
          '    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
          `    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${dnsPrefetch}`
        );
        
        // Add resource hints for better loading
        const resourceHints = [
          '    <meta name="format-detection" content="telephone=no">',
          '    <meta name="apple-mobile-web-app-capable" content="yes">',
          '    <meta name="apple-mobile-web-app-status-bar-style" content="default">'
        ].join('\n');
        
        content = content.replace(
          '    <meta name="msapplication-TileColor" content="#2C2C2C">',
          `    <meta name="msapplication-TileColor" content="#2C2C2C">
${resourceHints}`
        );
        
        return content;
      },
      
      process404Html(content, mode, baseUrl) {
        // Update 404.html with correct base path for different platforms
        if (mode === 'vercel') {
          // Vercel deployment: no base path needed
          content = content.replace(
            "var githubPagesBase = '/Neff-Paving';",
            "var githubPagesBase = '';"
          );
        } else {
          // GitHub Pages: use the configured base URL
          const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
          content = content.replace(
            "var githubPagesBase = '/Neff-Paving';",
            `var githubPagesBase = '${cleanBaseUrl}';`
          );
        }
        
        // Update favicon path for different platforms
        if (mode === 'github') {
          const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
          content = content.replace(
            'href="/favicon.ico"',
            `href="${cleanBaseUrl}/favicon.ico"`
          );
        }
        
        return content;
      }
    }
  ]
  };
});
