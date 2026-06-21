/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'icons.svg', 'ozora_banner.png'],
      manifest: {
        name: 'Ozora Festival 2026',
        short_name: 'Ozora 2026',
        description: 'Ozora Festival 2026 Timetable Companion',
        theme_color: '#0b0713',
        background_color: '#0b0713',
        display: 'standalone',
        scope: '/ozora-2026/',
        start_url: '/ozora-2026/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,json,woff,woff2}']
      }
    })
  ],
  base: '/ozora-2026/',
  resolve: {
    alias: {
      '@content': path.resolve(__dirname, 'content')
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  }
})
