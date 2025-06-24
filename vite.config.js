import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true
  },
  server: {
    port: 3000,
    open: true
  },
  resolve: {
    alias: {
      '@': '/src',
      '@assets': '/assets',
      '@styles': '/styles',
      '@scripts': '/scripts'
    }
  },
  assetsInclude: ['**/*.mp4', '**/*.webm', '**/*.ogg', '**/*.mov']
})
