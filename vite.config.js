import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: '/Neff-Paving/',
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
  },
  assetsInclude: ['**/*.mp4', '**/*.webm', '**/*.ogg', '**/*.mov'],
  // Performance optimizations
  optimizeDeps: {
    include: ['gsap', 'aos', 'plyr'],
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
        main: resolve(__dirname, 'index.html')
      },
      output: {
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/md|json/i.test(ext)) {
            return `blog-posts/[name][extname]`
          }
          if (assetInfo.name.endsWith('.mp4')) {
            // Add content hash for videos
            return 'assets/videos/[name]-[hash][extname]'
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
    // No plugins currently needed - PWA support removed
  ]
})
