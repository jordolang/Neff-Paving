import { defineConfig } from 'vite'
import { resolve } from 'path'
import { VitePWA } from 'vite-plugin-pwa'

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
  // Image optimization
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              }
            }
          },
          {
            urlPattern: /\.(png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30
              }
            }
          }
        ]
      },
      manifest: {
        name: 'Neff Paving - Professional Paving Services',
        short_name: 'Neff Paving',
        description: 'Expert paving contractors with 35+ years experience. Residential driveways, commercial parking lots, maintenance services.',
        theme_color: '#2C2C2C',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})
