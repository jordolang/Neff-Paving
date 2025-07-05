import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig(({ mode }) => ({
  base: mode === 'vercel' ? '/' : '/Neff-Paving/',
  root: '.',
  server: {
    port: 3000,
    open: true,
    // Enable compression in dev
    compress: true,
    headers: {
      // Development server headers
      'Cache-Control': 'no-cache'
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
    __BUILD_TIMESTAMP__: JSON.stringify(process.env.VITE_BUILD_TIMESTAMP || new Date().toISOString()),
    __DEPLOY_TIME__: JSON.stringify(process.env.VITE_DEPLOY_TIME || Date.now())
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
    sourcemap: true,
    // Code splitting optimization
    // Copy blog posts and JSON to dist
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin/index.html')  // Add admin entry point
      },
      output: {
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/md|json/i.test(ext)) {
            return `blog-posts/[name][extname]`
          }
          return `assets/[name]-[hash][extname]`
        }
      },
      // Remove external Node.js built-ins to let Vite handle them
    },
    // Compression and minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    // Asset inlining threshold
    assetsInlineLimit: 4096,
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Target modern browsers to avoid polyfill issues
    target: 'esnext'
  },
  // Plugin configuration
  plugins: [
    {
      name: 'replace-build-placeholders',
      generateBundle(options, bundle) {
        const buildTimestamp = process.env.VITE_BUILD_TIMESTAMP || new Date().toISOString();
        const deployTime = process.env.VITE_DEPLOY_TIME || Date.now();
        
        for (const fileName in bundle) {
          if (fileName.endsWith('.html')) {
            const htmlFile = bundle[fileName];
            if (htmlFile.source) {
              // Replace timestamp placeholders
              htmlFile.source = htmlFile.source.replace(
                /{{ BUILD_TIMESTAMP }}/g,
                buildTimestamp
              );
              
              // Add cache-busting query parameters to assets
              htmlFile.source = htmlFile.source.replace(
                /(href|src)="([^"]+\.(css|js|jpg|jpeg|png|gif|svg|webp|mp4|webm))"/g,
                `$1="$2?v=${deployTime}"`
              );
            }
          }
        }
      }
    }
  ]
}))
