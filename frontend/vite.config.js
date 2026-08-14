import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { compression } from 'vite-plugin-compression2'
import { copyFileSync, existsSync, mkdirSync } from 'fs'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'copy-htaccess',
      closeBundle() {
        const htaccessSrc = resolve(__dirname, 'public', '.htaccess')
        const htaccessDst = resolve(__dirname, 'dist', '.htaccess')
        if (existsSync(htaccessSrc)) {
          copyFileSync(htaccessSrc, htaccessDst)
        }
      },
    },
    {
      name: 'copy-service-worker',
      closeBundle() {
        const swSrc = resolve(__dirname, 'public/sw.js')
        const distDir = resolve(__dirname, 'dist')
        if (existsSync(swSrc)) {
          if (!existsSync(distDir)) mkdirSync(distDir, { recursive: true })
          copyFileSync(swSrc, resolve(distDir, 'sw.js'))
        }
      },
    },
    {
      name: 'copy-manifest',
      closeBundle() {
        const manifestSrc = resolve(__dirname, 'public/manifest.json')
        const distDir = resolve(__dirname, 'dist')
        if (existsSync(manifestSrc)) {
          if (!existsSync(distDir)) mkdirSync(distDir, { recursive: true })
          copyFileSync(manifestSrc, resolve(distDir, 'manifest.json'))
        }
      },
    },
    compression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
  ],
  build: {
    chunkSizeWarningLimit: 1000,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/storage': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/settings': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/categories': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/products': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/cart': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/orders': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/bank-accounts': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
