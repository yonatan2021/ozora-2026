import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/ozora-2026/',
  resolve: {
    alias: {
      '@content': path.resolve(__dirname, 'content')
    }
  }
})
