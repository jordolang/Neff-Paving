import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/Neff-Paving/' : '/',
  root: '.',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    // Code splitting optimization
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        // Manual chunking for better caching
        manualChunks: {
          vendor: ['gsap', 'aos'],
          video: ['plyr', 'hls.js', 'video.js'],
          utils: ['lottie-web']
        },
        // Asset naming for better caching
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `images/[name]-[hash][extname]`
          }
          if (/mp4|webm|ogg|mov/i.test(ext)) {
            return `videos/[name]-[hash][extname]`
          }
          return `assets/[name]-[hash][extname]`
        },
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js'
      }
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
    cssCodeSplit: true
  },
  server: {
    port: 3000,
    open: true,
    // Enable compression in dev
    compress: true
  },
  resolve: {
    alias: {
      '@': '/src',
      '@assets': '/assets',
      '@styles': '/styles',
      '@scripts': '/scripts'
    }
  },
  assetsInclude: ['**/*.mp4', '**/*.webm', '**/*.ogg', '**/*.mov'],
  // Performance optimizations
  optimizeDeps: {
    include: ['gsap', 'aos', 'plyr'],
    exclude: ['@vite/client', '@vite/env']
  },
  // Plugin configuration
  plugins: [
    // No plugins currently needed - PWA support removed
  ]
})
